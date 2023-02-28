import Browser from 'webextension-polyfill'
import { ChatGptWebProvider } from "ai-bridge"
import { getSmallSizeTranscripts, getSummaryPrompt } from "./prompt";
const chatGptWebProvider = new ChatGptWebProvider()

function getPrompt(content: any[], title: string) {
    const textData = content.map((item, index) => {
        return {
            text: item.content,
            index
        }
    })
    const text = getSmallSizeTranscripts(textData, textData, 7000);
    const prompt = getSummaryPrompt(title,text, 7000);

    return prompt;
}
let lastController: AbortController | null = null
Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected', port)
    if (port.name === 'BilibiliSUMMARY') {
        port.onMessage.addListener(async (job, port) => {
            if (job.type === 'getSummary') {
                const question = getPrompt(job.content, job.title)
                console.log(question)
                // //@ts-ignore
                try {
                    if(lastController) {
                        lastController.abort()
                    }
                    lastController = new AbortController()
                    let result = await chatGptWebProvider.ask(question,{
                        deleteConversation: true,
                        signal: lastController!.signal,
                        onMessage: (message) => {
                            console.log(message)
                        }
                    })
                    port.postMessage({
                        type: 'summary',
                        content: result
                    })
                } catch (error) {
                    console.error(error)
                    port.postMessage({
                        type: 'error',
                        content: 'error'
                    })
                }
            }
        })
    }
})