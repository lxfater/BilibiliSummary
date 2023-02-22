import { type } from 'os';
import Browser from 'webextension-polyfill'
import { ChatGptWebProvider } from "../ai"
import { getChunckedTranscripts, getSummaryPrompt } from "./prompt";
const chatGptWebProvider = new ChatGptWebProvider()

function getPrompt(content: any[], title: string) {
    const textData = content.map((item, index) => {
        return {
            text: item.content,
            index
        }
    })
    const text = getChunckedTranscripts(textData, textData);
    const prompt = getSummaryPrompt(title,text);

    return prompt;
}

const getSubtitle = async (videoId:string) => {
    try {
        let result = await (await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`)).json()
        if(result.data.subtitle.list.length > 0) {
            let url = result.data.subtitle.list[0].subtitle_url.replace(/^http:/, 'https:')
            let subtitle = await (await fetch(url)).json()
            return subtitle.body
        } else {
            return null
        }
    } catch (error) {
        console.error(error)
        return null
    }
}
let lastController: AbortController | null = null
Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected', port)
    if (port.name === 'BilibiliSUMMARY') {
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
            const timeoutThreshold = 5 * 30 * 1000
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
                const subtitle = await getSubtitle(job.videoId)
                if(!subtitle) { 
                    port.postMessage({
                        type: 'error',
                        content: 'unfetchable'
                    })
                }
                const question = getPrompt(subtitle, job.title)
                console.log(question)
                if(lastController) {
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
                    const timeoutHandle = timeout(timeoutThreshold)
                    let result = await chatGptWebProvider.ask(question,{
                        deleteConversation: true,
                        signal: lastController!.signal,
                        onMessage: (m) => {
                            console.log(m);
                            clearTimeout(timeoutHandle)
                            port.postMessage({
                                type: 'summary',
                                content: m.message
                            })
                        }
                    })
                    port.postMessage({
                        type: 'summary',
                        content: result
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
            } else if (job.type === 'forceSummary') {
                const subtitle = await getSubtitle(job.videoId)
                if(!subtitle) { 
                    port.postMessage({
                        type: 'error',
                        content: 'unfetchable'
                    })
                }
                const question = getPrompt(subtitle, job.title)
                console.log(question)
                //@ts-ignore
                try {
                    if(lastController) {
                        lastController.abort()
                    }
                    lastController = new AbortController()
                    const timeoutHandle = timeout(timeoutThreshold)
                    let result = await chatGptWebProvider.ask(question,{
                        deleteConversation: true,
                        signal: lastController!.signal,
                        onMessage: (m) => {
                            console.log(m);
                            clearTimeout(timeoutHandle)
                            port.postMessage({
                                type: 'summary',
                                content: m.message
                            })
                        }
                    })
                    port.postMessage({
                        type: 'summary',
                        content: result
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
    }
})