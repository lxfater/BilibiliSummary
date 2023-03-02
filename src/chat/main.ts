import Browser from 'webextension-polyfill'
import { ChatGptWebProvider } from "../ai"
// import { ChatGptWebProvider } from "@lxfater/ai-bridge"
const chatGptWebProvider = new ChatGptWebProvider()


let lastController: AbortController | null = null
export const port = Browser.runtime.connect({ name: 'ChatGPT' })
port.onMessage.addListener(async (job, port) => {
    function cancel() {
        if(lastController) {
            lastController.abort()
            lastController = null
        }
        port.postMessage({
            type: 'error',
            content: 'cancel'
        })
    }
    
    function timeout(ms: number) {
        return setTimeout(() => {
            cancel()
            port.postMessage({
                type: 'error',
                content: 'timeout'
            })
        },ms)
    }

    if (job.type === 'getSummary') {
        if(lastController && job.force === false) {
            port.postMessage({
                type: 'error',
                content: 'onlyOne'
            })
            return;
        }
        //@ts-ignore
        try {
            if(lastController) {
                lastController.abort()
            }
            lastController = new AbortController()
            const timeoutThreshold = job.timeout * 30 * 1000
            const timeoutHandle = timeout(timeoutThreshold)
            let result = await chatGptWebProvider.ask(job.question,{
                deleteConversation: true,
                signal: lastController!.signal,
                refreshToken: job.refreshToken,
                onMessage: (m) => {
                    clearTimeout(timeoutHandle)
                    port.postMessage({
                        type: 'summary',
                        content: {
                            message: m.message,
                            videoId: job.videoId
                        }
                    })
                }
            })
            port.postMessage({
                type: 'summaryFinal',
                content: {
                    message: result,
                    videoId: job.videoId
                }
            })
           
            try {
                clearTimeout(timeoutHandle)
            } catch (error) {
                console.error(error)
            }

        } catch (error: any) {
            console.error(error)
            port.postMessage({
                type: 'error',
                content: error.message
            })
        } finally {
            lastController = null
        }
    } else if(job.type === 'cancel') {
        cancel()
    }
})