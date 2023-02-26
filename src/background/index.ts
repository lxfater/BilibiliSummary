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


let BilibiliSUMMARYPort = null
let ChatGPTPort = null
Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected', port)
    if (port.name === 'BilibiliSUMMARY') {
        port.onMessage.addListener(async (job, port) => {
            BilibiliSUMMARYPort = port;
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
            async function setSummary(key:string, value: string) {
                // write cache to chrome extension storage by key
                try {
                    await Browser.storage.local.set({[key]: value})
                } catch (error) {
                    console.error(error)
                }
                
                // try {
                //     let response = await fetch('http://localhost:3000/set?key=' + key + '&value=' + value)
                //     if(response.status === 200) {
                //         return true
                //     } else {
                //         return false
                //     }
                // } catch (error) {
                //     console.error(error)
                //     return false
                // }
            }
            async function getSummary(key:string) {
                // read cache from chrome extension storage by key
                try {
                    let result = await Browser.storage.local.get([key])
                    if(result[key]) {
                        return result[key]
                    }
                } catch (error) {
                    console.error(error)
                }

                // try {
                //     let response = await fetch('http://localhost:3000/get?key=' + key)
                //     if(response.status === 200) {
                //         let result = await response.text()
                //         return result
                //     } else {
                //         return null
                //     }
                // } catch (error) {
                //     console.error(error)
                //     return null
                // }
                
            }
            if (job.type === 'getSummary') {
                let cache = await getSummary(job.videoId)
                if(cache) {
                    port.postMessage({
                        type: 'summary',
                        content: cache
                    })
                    return 0;
                }
                const subtitle = await getSubtitle(job.videoId)
                if(!subtitle) { 
                    port.postMessage({
                        type: 'error',
                        content: 'unfetchable'
                    })
                }
                const question = getPrompt(subtitle, job.title)
                console.log(question)
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
                    const timeoutHandle = timeout(timeoutThreshold)
                    let result = await chatGptWebProvider.ask(question,{
                        deleteConversation: true,
                        signal: lastController!.signal,
                        refreshToken: job.refreshToken,
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
                    await setSummary(job.videoId, result as string)
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
    } else if (port.name === 'ChatGPT') {
        port.onMessage.addListener(async (message, port) => {
            ChatGPTPort = port;
            if (message.type === 'ask') {
                let result = await chatGptWebProvider.ask(message.content)
                port.postMessage({
                    type: 'answer',
                    content: result
                })
            }
        })
    }
})