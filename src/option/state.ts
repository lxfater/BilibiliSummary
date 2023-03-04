import { defineStore } from 'pinia'
import { ExtensionStorage } from  '../store/index'
type ProviderType = 'ChatgptWeb' | 'Openai'

export const storage = new ExtensionStorage()
export const useStore = defineStore('store', {
    state: () => {
        return {
            [storage.metaKey]: storage.getDefaultMetaKey(),
        }
    },
    getters: {
    },
    actions: { 
        async loadSettings() {
            let meta = await storage.getMetaKey();
            this[storage.metaKey] = Object.assign(this[storage.metaKey], meta)  
        },
        async changeClickSubtitle(value: boolean) {
            this[storage.metaKey].clickSubtitle = value  
        },
        async changeOpenaiApikey(value: string) {
            this[storage.metaKey].OpenaiSetting.apiKey = value
        },
        async changeOpenaiModel(value: string) {
            this[storage.metaKey].OpenaiSetting.model = value as ProviderType
        },
        async changeOpenaiMaxTokens(value: number) {
            this[storage.metaKey].OpenaiSetting.maxTokens = value
        },
        async changeProviderType(value: string) {
            debugger
            this[storage.metaKey].providerType = value as ProviderType
        },
        async changeAutoFetch(value:boolean) {
            this[storage.metaKey].autoFetch = value
        },
        async changeSummaryToken(value:number) {
            this[storage.metaKey].summaryToken = value
        },
        async changeFetchTimeout(value:number) {
            console.log(value, 'value')
            this[storage.metaKey].fetchTimeout = value
        }
    }
})



