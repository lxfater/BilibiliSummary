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
            // a function take this[storage.metaKey] as default value for object meta
            

            this[storage.metaKey] = Object.assign(this[storage.metaKey],meta)  
        },
        async changeClickSubtitle(value: boolean) {
            this[storage.metaKey].clickSubtitle = value  
        },
        async changeOpenaiApikey(value: string) {
            this[storage.metaKey].ChatgptWebSetting.apiKey = value
        },
        async changeOpenaiModel(value: string) {
            this[storage.metaKey].ChatgptWebSetting.model = value as ProviderType
        },
        async changeOpenaiMaxTokens(value: number) {
            this[storage.metaKey].ChatgptWebSetting.maxTokens = value
        },
        async changeProviderType(value: string) {
            this[storage.metaKey].providerType = value as ProviderType
        },
        async changeAutoFetch(value:boolean) {
            this[storage.metaKey].autoFetch = value
        }
    }
})



