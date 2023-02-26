import { ChatGptWebProvider } from "../ai"
const chatGptWebProvider = new ChatGptWebProvider()
setTimeout(async() => {
    console.log('start')
    try {
        let result = await chatGptWebProvider.ask('如何评价张学友？',{
            deleteConversation: true,
            onMessage: (m) => {
                console.log(m);
            }
        })
        console.log(result)
    } catch (error) {
        console.error(error)
    }
},800)