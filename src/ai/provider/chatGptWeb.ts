
import { v4 as uuidv4 } from "uuid";
import ExpiryMap from "expiry-map";
import { createParser } from "eventsource-parser";
type MessageInfo = {
    message: string;
    done: boolean;
}
type TalkOptions = {
    signal?: AbortSignal;
    cId?: string;
    pId?: string;
    refreshToken?: boolean;
    deleteConversation?: boolean;
    onMessage?: (messageInfo:MessageInfo) => void;
}

type AskOptions = {
    signal?: AbortSignal;
    deleteConversation?: boolean;
    refreshToken?: boolean;
    onMessage?: (messageInfo:MessageInfo) => void;
}


export interface Rely {
    message:         Message;
    conversation_id: string;
    error:           null;
}

export interface Message {
    id:          string;
    role:        string;
    user:        null;
    create_time: null;
    update_time: null;
    content:     Content;
    end_turn:    null;
    weight:      number;
    metadata:    Metadata;
    recipient:   string;
}

export interface Content {
    content_type: string;
    parts:        string[];
}

export interface Metadata {
    message_type: string;
    model_slug:   string;
}


export default class Bridge {
    ACCESS_TOKEN = 'ACCESS_TOKEN'
    tokenCache = new ExpiryMap(30 * 60 * 1000);
    errorText = {
      "Too many requests": "tooManyRequests",
      "Unauthorized": "unauthorized",
      "Not Found": "notFound",
      "Unknown": "unknown",
      "CloudFlare": "cloudFlare"
    }
    async fetch(path: string, options: { method: any; headers: any; body: any; signal: any; }) {
      const { method, headers, body, signal } = options;
      const response = await fetch(path, {
          method,
          headers,
          body,
          signal,
      });
      if (response.status === 403)
          throw new Error(this.errorText["CloudFlare"]);
      if (response.ok) {
          return response;
      }
      const result = await response.json().catch(()=>({}));
      throw this.createErrorBaseResult(result)
    }
    createErrorBaseResult(result : { detail: { message: string } }) {
        const text = result.detail.message || "";
        if(text.includes("Too many requests")) {
            return new Error(this.errorText['Too many requests'])
        } else if(text.includes("Unauthorized")) {
            return new Error(this.errorText['Unauthorized'])
        } else if(text.includes('Not Found')) {
            return new Error(this.errorText['Not Found'])
        }
        return new Error(this.errorText['Unknown'])
    }
    async getToken(refreshToken = false) {
        if (refreshToken === false && this.tokenCache.get(this.ACCESS_TOKEN)) {
            return this.tokenCache.get(this.ACCESS_TOKEN);
        }
        const response = await fetch("https://chat.openai.com/api/auth/session")
        if (response.status === 403) {
            throw new Error(this.errorText["CloudFlare"]);
        }
        const result = await response.json();
        if (result.accessToken) {
          this.tokenCache.set(this.ACCESS_TOKEN, result.accessToken);
          return result.accessToken;
        } else {
          throw new Error(this.errorText['Unauthorized'])
        }
    }
    private async *streamAsyncIterable(stream: ReadableStream<Uint8Array>) {
        const reader = stream.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    return;
                }
                yield value;
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async fetchSSE(resource:string, options: any) {
        const { onMessage, ...fetchOptions } = options;
        const resp = await this.fetch(resource, fetchOptions);
        const parser = createParser((event) => {
            if (event.type === "event") {
                onMessage(event.data);
            }
        });
        if(resp.body === null) {
            throw new Error('response body is null')
        }
        for await (const chunk of this.streamAsyncIterable(resp.body)) {
            const str = new TextDecoder().decode(chunk);
            parser.feed(str);
        }
    }
    async ask(question: string, options: AskOptions) {
        const { signal, onMessage, deleteConversation, refreshToken } = options;
        const accessToken = await this.getToken(refreshToken);
        let text = '';
        let conversationID = ''
        return new Promise((resolve, reject) => {
          try {
            this.fetchSSE("https://chat.openai.com/backend-api/conversation", {
              method: "POST",
              signal,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                action: "next",
                messages: [
                  {
                    id: uuidv4(),
                    role: "user",
                    content: {
                      content_type: "text",
                      parts: [question],
                    },
                  },
                ],
                model: "text-davinci-002-render-sha",
                parent_message_id: uuidv4(),
              }),
              onMessage:(message: string) => {
                console.debug("sse message", message);
                if (message === "[DONE]") {
                  if(deleteConversation) {
                      this.deleteConversation(accessToken,conversationID)
                  }
                  if(onMessage) {
                    onMessage({
                        message: text,
                        done: true
                    })
                  }
                  resolve(text)
                  return;
                } else {
                  try {
                    const data = JSON.parse(message);
                    text = data.message?.content?.parts?.[0];
                    conversationID = data.conversation_id
                    if(onMessage) {
                      onMessage({
                          message: text,
                          done: false
                      })
                    }
                  } catch (error) {
                    console.error(error);
                  }
                }
              },
            });
          } catch (error) {
            reject(error);
          }
        })
    }
    async talk(question: string, options: TalkOptions) {
        const { signal, cId, pId, onMessage,deleteConversation, refreshToken } = options;
        const accessToken = await this.getToken(refreshToken);
        let text = '';
        let id = '';
        let conversationID = ''

        const basis = {
            action: "next",
            messages: [
              {
                id: uuidv4(),
                role: "user",
                content: {
                  content_type: "text",
                  parts: [question],
                },
              },
            ],
            model: "text-davinci-002-render-sha",
            parent_message_id: pId? pId : uuidv4(),
        }
        const body = cId ? {...basis, conversation_id: cId} : basis;
        return new Promise<{
            text: string;
            cId: string;
            pId: string;
        }>((resolve, reject) => {
          try {
            this.fetchSSE("https://chat.openai.com/backend-api/conversation", {
              method: "POST",
              signal,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(body),
              onMessage:(message: string)  => {
                console.debug("sse message", message);
                if (message === "[DONE]") {
                  if(deleteConversation) {
                      this.deleteConversation(accessToken,conversationID)
                  }
                  if(onMessage) {
                    onMessage({
                        message: text,
                        done: true
                    })
                  }
                  resolve({
                      text,
                      cId:conversationID,
                      pId:id
                  })
                  return;
                } else {
                  try {
                    const data = JSON.parse(message) as Rely
                    text = data.message?.content?.parts?.[0];
                    id = data.message.id
                    conversationID = data.conversation_id
                    if(onMessage) {
                      onMessage({
                          message: text,
                          done: false
                      })
                    }
                  } catch (error) {
                    console.error(error);
                  }
                }
              },
            });
          } catch (error) {
            reject(error);
          }

        })
    }
    async request(token: string, method: string, path: string, data?: unknown) {
        return fetch(`https://chat.openai.com/backend-api${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: data === undefined ? undefined : JSON.stringify(data),
        })
    }
    async setConversationProperty(
        token: string,
        conversationId: string,
        propertyObject: object,
      ) {
        await this.request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject)
    }
    async deleteConversation(token: string, conversationId: string) {
        this.setConversationProperty(token, conversationId, { is_visible: false })
    }
}