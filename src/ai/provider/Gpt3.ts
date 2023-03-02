import { createParser } from "eventsource-parser";
export class Gpt3 {
    key: string
    constructor(key: string) {
        this.key = key;
    }
    private async getSSE(resource:string, options: any) {
        const { onData, ...fetchOptions } = options;
        const resp = await fetch(resource, fetchOptions);
        const feeder = createParser((event) => {
            if (event.type === "event") {
                onData(event.data);
            }
        });
        if(resp.body === null) {
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
    }
    async ask(question: string, options: { signal: any; onMessage: any; }) {
        const { signal,onMessage: onData } = options;
        let message = '';
        const body = JSON.stringify({
            model: "text-davinci-003",
            prompt: question,
            stream: true,
            max_tokens: 500,

        });
        return new Promise((resolve, reject) => {
          try {
            this.getSSE("https://api.openai.com/v1/completions", {
              method: "POST",
              signal,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.key}`,
              },
              body,
              onData:(str: string) => {
                if (str === "[DONE]") {
                  if(onData) {
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
                    message += data.choices[0].text
                    if(onData) {
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
            });
          } catch (error) {
            reject(error);
          }
        })
    }
}