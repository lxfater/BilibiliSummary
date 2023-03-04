import Browser from 'webextension-polyfill'
import { ChatGptWebProvider } from "../ai"
const chatGptWebProvider = new ChatGptWebProvider()

type ChatgptJob = {
    type: 'getSummary' | 'cancel'
    videoId: string
    question: string
    refreshToken?: boolean
    force?: boolean
    timeout: number
}

export const port = Browser.runtime.connect({ name: 'CHATGPT' })
class ChatgptProvider {
    private lastController: AbortController | null = null;
  
    private cancel() {
      if (this.lastController) {
        this.lastController.abort();
        this.lastController = null;
      }
      port.postMessage({
        type: 'error',
        content: 'cancel'
      });
    }
  
    private timeout(ms: number) {
      return setTimeout(() => {
        this.cancel();
        port.postMessage({
          type: 'error',
          content: 'timeout'
        });
      }, ms);
    }
  
    public async handleJob(job: ChatgptJob) {
      if (job.type === 'getSummary') {
        if (this.lastController && job.force === false) {
            port.postMessage({
                type: 'error',
                content: 'onlyOne'
            });
            return 0;
        } 
  
        try {
          if (this.lastController) {
            this.lastController.abort();
          }
          this.lastController = new AbortController();
          const timeoutThreshold = job.timeout * 30 * 1000;
          const timeoutHandle = this.timeout(timeoutThreshold);
          let result = await chatGptWebProvider.ask(job.question, {
            deleteConversation: true,
            signal: this.lastController!.signal,
            refreshToken: job.refreshToken,
            onMessage: (m) => {
              clearTimeout(timeoutHandle);
              port.postMessage({
                type: 'summary',
                content: {
                  message: m.message,
                  videoId: job.videoId
                }
              });
            }
          });
          port.postMessage({
            type: 'summary',
            content: {
              message: result,
              videoId: job.videoId
            }
          });
          try {
            clearTimeout(timeoutHandle);
          } catch (error) {
            console.error(error);
          }
        } catch (error: any) {
          console.error(error);
          port.postMessage({
            type: 'error',
            content: error.message
          });
        } finally {
          this.lastController = null;
        }
      } else if (job.type === 'cancel') {
        this.cancel();
      }
    }
}
  
const chatgptProvider = new ChatgptProvider();
port.onMessage.addListener(async (job, port) => {
    chatgptProvider.handleJob(job)
})