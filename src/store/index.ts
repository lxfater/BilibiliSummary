import Browser from 'webextension-polyfill'
type Keys = 'meta' | 'subTitle' | 'summary'
export class ExtensionStorage {
    metaKey = 'meta'
    subTitle = 'subTitle'
    summary = 'summary'
    getDefaultMetaKey() {
        return {
            clickSubtitle: false,
            autoFetch: false,
            summaryToken: 20,
            providerType: 'ChatgptWeb',
            shareCache: true,
            OpenaiSetting: {
                apiKey: '',
                model: 'gpt-3.5-turbo',
                maxTokens: 200,
                words:1000,
                baseTime: 5,
                step: 0.1,
                maxCount:8,
                minCount: 5,
                count: 30,
                timeout: 8,
                stopCount: 4000,
                stopIntervalMs: 150  
            },
            ChatgptWebSetting: {
                words:1000,
                baseTime: 5,
                step: 0.1,
                maxCount:8,
                minCount: 5,
                count: 30,
                timeout: 8,
                stopCount: 4000,
                stopIntervalMs: 200 
            }
        }
    }
    async getMetaKey() {
        return await this.get(this.metaKey as Keys)
    }
    setMetaKey(value: any) {
        return this.set(this.metaKey as Keys,value)
    }
    onMetaKeyChange(handle: (arg0: any) => void) {
        this.onChange(this.metaKey as Keys,handle)
    }
    async get(key: Keys, defaultValue = {}) {
        let result = await Browser.storage.local.get([key])
        if(result[key]) {
            return result[key]
        } else {
            return defaultValue
        }
    }
    async set(key:Keys,value: any) {
        await Browser.storage.local.set({
            [key]: value
        })
    }
    onChange(key:Keys,handle: (arg0: any) => void) {
        Browser.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes[key]) {
                handle(changes[key])
            }
        })
    }
}