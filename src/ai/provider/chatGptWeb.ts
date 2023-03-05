
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
  onMessage?: (messageInfo: MessageInfo) => void;
}

type AskOptions = {
  signal?: AbortSignal;
  deleteConversation?: boolean;
  refreshToken?: boolean;
  onMessage?: (messageInfo: MessageInfo) => void;
}


export interface Rely {
  message: Message;
  conversation_id: string;
  error: null;
}

export interface Message {
  id: string;
  role: string;
  user: null;
  create_time: null;
  update_time: null;
  content: Content;
  end_turn: null;
  weight: number;
  metadata: Metadata;
  recipient: string;
}

export interface Content {
  content_type: string;
  parts: string[];
}

export interface Metadata {
  message_type: string;
  model_slug: string;
}


export default class Bridge {
  ACCESS_TOKEN = 'ACCESS_TOKEN'
  tokenCache = new ExpiryMap(30 * 60 * 1000);
  errorText = {
    "Too many requests": "tooManyRequests",
    "Unauthorized": "unauthorized",
    "Not Found": "notFound",
    "Unknown": "unknown",
    "CloudFlare": "cloudFlare",
    "Only one": "onlyOne",
    "Rate limit": "rateLimit",
  }
  private async fetchResult(path: string, options: { method: any; headers: any; body: any; signal: any; }) {
    const { method, headers, body, signal } = options;
    const response = await fetch(path, {
      signal,
      method,
      headers,
      body,
    });
    if (this.isCloudFlare(response.status))
      throw new Error(this.errorText["CloudFlare"]);
    if (response.status === 429) {
      throw new Error(this.errorText["Rate limit"]);
    }
    if (response.ok) {
      return response;
    }
    const result = await response.json().catch((e) => {
      // console.log(e)
    });
    throw this.createErrorResult(result)
  }
  isCloudFlare(status: number) {
    return status === 403;
  }
  createErrorResult(result: { detail: { message: string } }) {
    const text = result.detail.message || "";
    const errorName = Object.keys(this.errorText).find((key) => text.includes(key)) || 'Unknown';
    const errorMessage = this.errorText[errorName as keyof typeof this.errorText];
    return new Error(errorMessage);
  }
  async getToken(refreshToken = false) {
    if (refreshToken === false && this.tokenCache.get(this.ACCESS_TOKEN)) {
      return this.tokenCache.get(this.ACCESS_TOKEN);
    }
    const response = await fetch("https://chat.openai.com/api/auth/session")
    if (this.isCloudFlare(response.status)) {
      throw new Error(this.errorText["CloudFlare"]);
    }
    const result = await response.json();
    if (result.accessToken) {
      this.tokenCache.set(this.ACCESS_TOKEN, result.accessToken);
      return result.accessToken;
    }
    throw new Error(this.errorText['Unauthorized'])

  }
  private async getSSE(resource: string, options: any) {
    const { onData, ...fetchOptions } = options;
    try {
      const resp = await this.fetchResult(resource, fetchOptions);
      const feeder = createParser((event) => {
        if (event.type === "event") {
          onData(event.data);
        }
      });
      if (resp.body === null) {
        throw new Error(' Null response body')
      }
      const textDecoder = new TextDecoder();
      const reader = resp.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            return void 0;
          } else {
            const info = textDecoder.decode(value);
            feeder.feed(info);
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      debugger
      throw error;
    }


  }
  async ask(question: string, options: AskOptions) {
    const { signal, deleteConversation, refreshToken, onMessage: onData } = options;
    const accessToken = await this.getToken(refreshToken);
    let message = '';
    let conversationID = ''
    signal?.addEventListener("abort", () => {
      this.clearConversation(accessToken, conversationID)
    })
    const body = JSON.stringify({
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
    });
    return new Promise((resolve, reject) => {
        this.getSSE("https://chat.openai.com/backend-api/conversation", {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body,
          onData: (str: string) => {
            if (str === "[DONE]") {
              if (deleteConversation) {
                this.clearConversation(accessToken, conversationID)
              }
              if (onData) {
                onData({
                  message,
                  done: true
                })
              }
              resolve(message)
              return;
            } else {
              try {
                const data = JSON.parse(str);
                message = data.message?.content?.parts?.[0];
                conversationID = data.conversation_id
                if (onData) {
                  onData({
                    message,
                    done: false
                  })
                }
              } catch (error) {
                console.error(error);
              }
            }
          },
        }).catch(e => {
          reject(e)
        })
    })
  }
  async talk(question: string, options: TalkOptions) {
    const { signal, cId, pId, onMessage: onData, deleteConversation, refreshToken } = options;
    const accessToken = await this.getToken(refreshToken);
    let message = '';
    let id = '';
    let conversationID = ''
    signal?.addEventListener("abort", () => {
      this.clearConversation(accessToken, conversationID)
    })
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
      parent_message_id: pId ? pId : uuidv4(),
    }
    const body = JSON.stringify(cId ? { ...basis, conversation_id: cId } : basis);
    return new Promise<{
      text: string;
      cId: string;
      pId: string;
    }>((resolve, reject) => {
      try {
        this.getSSE("https://chat.openai.com/backend-api/conversation", {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body,
          onData: (str: string) => {
            if (str === "[DONE]") {
              if (deleteConversation) {
                this.clearConversation(accessToken, conversationID)
              }
              if (onData) {
                onData({
                  message,
                  done: true
                })
              }
              resolve({
                text: message,
                cId: conversationID,
                pId: id
              })
            } else {
              try {
                const data = JSON.parse(str) as Rely
                message = data.message?.content?.parts?.[0];
                id = data.message.id
                conversationID = data.conversation_id
                if (onData) {
                  onData({
                    message,
                    done: false
                  })
                }
              } catch (error) {
                // console.error(error);
              }
            }
          },
        });
      } catch (error) {
        reject(error);
      }

    })
  }
  async clearConversation(token: string, conversationId: string) {
    const path = `https://chat.openai.com/backend-api/conversation/${conversationId}`;
    const data = { is_visible: false };
    const options: RequestInit = {
      method: 'PATCH', body: JSON.stringify(data), headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    };
    await fetch(`${path}`, options);
  }
}