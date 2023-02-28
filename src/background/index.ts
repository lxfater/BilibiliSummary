
import { prototype } from 'events';
import Browser from 'webextension-polyfill'
import { getSmallSizeTranscripts, getSummaryPrompt } from './prompt';

function getPrompt(content: any[], title: string, summaryTokenNumber: number) {
    const textData = content.map((item, index) => {
        return {
            text: item.content,
            index
        }
    })
    const limit = Math.round(15000 * summaryTokenNumber / 100)
    const text = getSmallSizeTranscripts(textData, textData, limit);
    const prompt = getSummaryPrompt(title,text,limit);

    return prompt;
}

async function getSummary(key:string) {
    // read cache from chrome extension storage by key
    try {
        let result = await Browser.storage.local.get([key])
        if(result[key]) {
            return result[key]
        } else {
            return null
        }
    } catch (error) {
        console.error(error)
        return null
    } 
}

async function setSummary(key:string, value: string) {
    // write cache to chrome extension storage by key
    try {
        await Browser.storage.local.set({[key]: value})
    } catch (error) {
        console.error(error)
    }
}

async function connect() {
    let tabs =  await Browser.tabs.query({})
    let find = false
    for await (let tab of tabs) {
        if (tab.url && tab.url!.includes("https://chat.openai.com")) {
            const updateProperties = { 'active': true };
            await Browser.tabs.update(tab.id!, updateProperties);
            await Browser.tabs.reload(tab.id!)
            find = true
        }
    }

    if(!find) {
        await Browser.tabs.create({url: "https://chat.openai.com"})
    }
}
let BilibiliSUMMARYPort: Browser.Runtime.Port | null = null
let ChatGPTPort: Browser.Runtime.Port | null = null
Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected', port)
    if (port.name === 'BilibiliSUMMARY') {
        BilibiliSUMMARYPort = port;

        port.onMessage.addListener(async (job, port) => {
            if(job.type === 'login') {
                await connect()
                setTimeout(() => {
                    port.postMessage({
                        type: 'error',
                        content: 'reFetchable'
                    })
                }, 1000);
            }
            if(ChatGPTPort) {
                if(job.type ==='getSummary') {
                    let cache = await getSummary(job.videoId)
                    if(cache) {
                        port.postMessage({
                            type: 'summary',
                            content: {
                                videoId: job.videoId,
                                message: cache
                            }
                        })
                        return 0;
                    }

                    const question = getPrompt(job.subtitle, job.title,  job.summaryTokenNumber)
                    ChatGPTPort.postMessage({
                        type: 'getSummary',
                        question,
                        videoId: job.videoId,
                        force: job.force,
                        timeout: job.timeout,
                        refreshToken: job.refreshToken,
                    })
                } else {
                    ChatGPTPort.postMessage(job)
                }
            } else {
                port.postMessage({
                    type: 'error',
                    content: 'unauthorized'
                })
            }
        })
        port.onDisconnect.addListener(() => {
            BilibiliSUMMARYPort = null
        })
    } else if (port.name === 'ChatGPT') {
        ChatGPTPort = port;
        port.onMessage.addListener(async (job, port) => {
            if(BilibiliSUMMARYPort) {
                if(job.type === 'summaryFinal') {
                    await setSummary(job.content.videoId,job.content.message)
                    BilibiliSUMMARYPort.postMessage(job)
                } else {
                    BilibiliSUMMARYPort.postMessage(job)
                }
            }
        })
        port.onDisconnect.addListener(() => {
            ChatGPTPort = null
        })
    }
})