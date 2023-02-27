import { defineStore } from 'pinia'
import { Body } from '../types';

import MarkdownIt from "markdown-it";
const markdown = new MarkdownIt();
import { titleMap } from './lang'
import {  getBVid, getSubtitle, port } from './utils';
import Browser from 'webextension-polyfill';

type State = {
    videoId: string,
    subtitle: Body[],
    summaryState: SummaryState,
    summary: string,
    optionKey: string,
    settings: {
        autoFetch: boolean,
        summaryToken: number,
        fetchTimeout: number,
    }
}
type SummaryState = 'reFetchable' | 'fetchable' | 'fetching' | 'unfetchable' | 'fetched' | 'tooManyRequests' | 'unauthorized' | 'notFound' | 'unknown' | 'cloudFlare' | 'onlyOne' | 'timeout' | 'canced'

export const useStore = defineStore('store', {
    state: (): State => ({
        videoId: '',
        subtitle: [],
        summary: '',
        summaryState: 'fetchable',
        settings: {
            autoFetch: false,
            summaryToken: 20,
            fetchTimeout: 8,
        },
        optionKey: 'options'
    }),
    getters: {
        markdownContent: (state) => {
            return markdown.render(state.summary);
        },
        isContent: (state) => {
            return state.summaryState === 'fetched'
        },
        otherComponentState: (state) => {
            const stateMap = {
                'unfetchable': {
                    'icon': 'warning-o',
                    'tips': '抱歉无法解析当前视频',
                    'action': 'getSummary',
                    'class': ''
                },
                'fetchable': {
                    'icon': 'guide-o',
                    'tips': `点击图标获取${titleMap['Summary']}`,
                    'action': 'getSummary',
                    'class': ''
                },
                'reFetchable': {
                    'icon': 'guide-o',
                    'tips': `再次点击图标获取${titleMap['Summary']}`,
                    'action': 'forceSummaryWithNewToken',
                    'class': ''
                },
                'fetched': {
                    'icon': 'comment-o',
                    'tips': `获取${titleMap['Summary']}成功`,
                    'action': 'getSummary',
                    'class': ''
                },
                'cloudFlare': {
                    'icon': 'link-o',
                    'tips': `需要进行人机验证,请点击图标`,
                    'action': 'login',
                    'class': ''
                },
                "onlyOne": {
                    'icon': 'warning-o',
                    'tips': `一次只能获取一个${titleMap['Summary']},再次点击强制中断之前的任务`,
                    'action': 'forceSummary',
                    'class': ''
                },
                "tooManyRequests": {
                    'icon': 'replay',
                    'tips': `请求过多,请稍后再图标重试`,
                    'action': 'getSummary',
                    'class': ''
                },
                'unauthorized': {
                    'icon': 'link-o',
                    'tips': `需要重新登录chatgpt才能获取${titleMap['Summary']},点击图标跳转登录`,
                    'action': 'login',
                    'class': ''
                },
                'notFound': {
                    'icon': 'replay',
                    'tips': `404,点击图标重试`,
                    'action':'forceSummary',
                    'class': ''
                },
                'unknown': {
                    'icon': 'replay',
                    'tips': `chatgpt未知错误,点击图标重试`,
                    'action':'forceSummary',
                    'class': ''
                },
                'timeout': {
                    'icon': 'replay',
                    'tips': `获取超时8分钟,点击图标重试获取${titleMap['Summary']}`,
                    'action': 'forceSummary',
                    'class': ''
                },
                'cancel': {
                    'icon': 'replay',
                    'tips': `取消成功,点击图标重试获取${titleMap['Summary']}`,
                    'action': 'forceSummary',
                    'class': ''
                }
            }
            return stateMap[state.summaryState as keyof typeof stateMap]
        }
    },
    actions: {
        async getSummary(){
            await this.summaryWithType('getSummary')
        },
        async summaryWithType(type:string) {
            console.log(type)
            const videoId = getBVid(window.location.href)
            const subtitle = await getSubtitle(videoId)
            if(!subtitle) { 
                this.summaryState = 'unfetchable'
                return 0;
            }
            try {
                port.postMessage({
                    type: 'getSummary',
                    videoId,
                    subtitle,
                    title: document.title,
                    refreshToken: type === 'forceSummaryWithNewToken' ? true : false,
                    timeout: this.settings.fetchTimeout,
                    summaryTokenNumber: this.settings.summaryToken,
                    force: (type === 'forceSummary') || (type === 'forceSummaryWithNewToken') ? true : false,
                })
                this.summaryState  = 'fetching'
            } catch (error) {
                console.error(error)
                this.summaryState  = 'unfetchable'
            }
        },
        async forceSummary (){
            await this.summaryWithType('forceSummary')
        },
        async forceSummaryWithNewToken() {
            await this.summaryWithType('forceSummaryWithNewToken')
        },
        async login(){
            port.postMessage({
                type: 'login',
            })
        },
        cancel() {
            port.postMessage({
                type: 'cancel'
            })
        },
        async getSubtitle(videoId:string){
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
        },
        async clearCurrentCache() {
            const videoId = getBVid(window.location.href)
            await Browser.storage.local.remove(videoId)
        },
        async clearCache() {
            await Browser.storage.local.clear()
            await Browser.storage.local.set({
                [this.optionKey]: this.settings
            })
        },
        async changeAutoFetch(value:boolean) {
            
            this.settings.autoFetch = value
            let result = await Browser.storage.local.get([this.optionKey])
            console.log(result, 'result')
            if(result[this.optionKey]) {
                result[this.optionKey].autoFetch = value
                await Browser.storage.local.set(result)
            } else {
                await Browser.storage.local.set({
                    [this.optionKey]: {
                        autoFetch: value
                    }
                })
            }
        },
        async changeSummaryToken(value:number) {
            this.settings.summaryToken = value
            let result = await Browser.storage.local.get([this.optionKey])
            if(result[this.optionKey]) {
                result[this.optionKey].summaryToken = value
                await Browser.storage.local.set(result)
            } else {
                await Browser.storage.local.set({
                    [this.optionKey]: {
                        summaryToken: value
                    }
                })
            }
        },
        async changeFetchTimeout(value:number) {
            console.log(value, 'value')
            this.settings.fetchTimeout = value
            let result = await Browser.storage.local.get([this.optionKey])
            if(result[this.optionKey]) {
                result[this.optionKey].fetchTimeout = value
                await Browser.storage.local.set(result)
            } else {
                await Browser.storage.local.set({
                    [this.optionKey]: {
                        fetchTimeout: value
                    }
                })
            }
        }
        
    }
})




