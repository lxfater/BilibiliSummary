import Browser from 'webextension-polyfill'
import { ChatGptWebProvider } from "ai-bridge"
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
Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected', port)
    if (port.name === 'BilibiliSUMMARY') {
        port.onMessage.addListener(async (job) => {
            if (job.type === 'getSummary') {
                const question = getPrompt(job.content, job.title)
                console.log(question, '????')
                // //@ts-ignore
                try {
                    let result = await chatGptWebProvider.ask(question,{
                        deleteConversation: false,
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