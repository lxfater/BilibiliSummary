import Browser from 'webextension-polyfill'
import { ChatGptWebProvider } from "../ai"
import Notify from 'simple-notify'
import 'simple-notify/dist/simple-notify.min.css'
const chatGptWebProvider = new ChatGptWebProvider()



type ChatgptJob = {
    type: 'getSummary' | 'cancel'
    videoId: string
    questions: string[]
    refreshToken?: boolean
    force?: boolean
    timeout: number
    stopIntervalMs: number
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      console.log('chatgpt job', job)
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
          const timeoutThreshold = job.timeout * 60 * 1000;
          const timeoutHandle = this.timeout(timeoutThreshold);
          let resultSum = ''
          for await (const question of job.questions) {
            if(this.lastController.signal.aborted) {
              break;
            }
            try {
              let result = await chatGptWebProvider.ask(question, {
                deleteConversation: true,
                signal: this.lastController!.signal,
                refreshToken: job.refreshToken,
                onMessage: (m) => {
                  clearTimeout(timeoutHandle);
                  if(!this.lastController!.signal.aborted) {
                    port.postMessage({
                      type: 'summary',
                      content: {
                        message: m.message,
                        videoId: job.videoId
                      }
                    });
                  }

                }
              });
              resultSum += result
              port.postMessage({
                type: 'summaryFinal',
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
              await sleep(job.stopIntervalMs || 500)
            } catch (error) {
              console.error(error);
              port.postMessage({
                type: 'error',
                content: error.message
              });
            }
            port.postMessage({
              type: 'summaryFinalCache',
              content: {
                message: resultSum,
                videoId: job.videoId
              }
            });

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
      } else if (job.type === 'connected') {
        new Notify({
          status: 'success',
          title: '连接成功',
          text: '请不要关闭这个页面，否则Summary for Bilibili将无法使用',
          effect: 'fade',
          speed: 300,
          showIcon: true,
          showCloseButton: true,
          autoclose: true,
          autotimeout: 5000,
          gap: 20,
          distance: 20,
          type: 1,
          position: 'right top'
        })
      }
    }
}
  
const chatgptProvider = new ChatgptProvider();
port.onMessage.addListener(async (job, port) => {
    chatgptProvider.handleJob(job)
})

// a Notification when web page is loaded


