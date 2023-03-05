import { defineStore } from 'pinia'
import { Body } from '../types';
import MarkdownIt from "markdown-it";
const markdown = new MarkdownIt();
import { titleMap } from './lang'
import {  getBVid, getSubtitle, port } from './utils';
import Browser from 'webextension-polyfill';
import { ExtensionStorage } from  '../store/index'
export const storage = new ExtensionStorage()
type SummaryState = 'reFetchable' | 'fetchable' | 'fetching' | 'unfetchable' | 'fetched' | 'tooManyRequests' | 'unauthorized' | 'notFound' | 'unknown' | 'cloudFlare' | 'onlyOne' | 'timeout' | 'canced'
type State = {
    free: boolean,
    preMessage: string,
    videoId: string,
    subtitle: Body[],
    summary: string,
    summaryState: SummaryState,
    [storage.metaKey]: ReturnType<typeof storage.getDefaultMetaKey>
}
export const useStore = defineStore('store', {
    state: () : State => ({
        free: true,
        preMessage: '',
        videoId: '',
        subtitle: [],
        summary: '',
        summaryState: 'fetchable',
        [storage.metaKey]: storage.getDefaultMetaKey(),
    }),
    getters: {
        markdownContent: (state) => {
            return markdown.render(state.summary);
        },
        list: (state) => {
            return state.summary.split('\n').map((item) => {
                let [time, content] = item.split(':');
                return {
                    time,
                    content
                }
            }).filter(x => x.time && x.content)
        },
        isContent: (state) => {
            return state.summaryState === 'fetched'
        },
        otherComponentState: (state) => {
            const stateMap = {
                'unfetchable': {
                    'icon': 'warning-o',
                    'tips': '抱歉,缺少字幕，无法解析当前视频',
                    'action': 'getSummary',
                    'class': ''
                },
                'fetchable': {
                    'icon': 'guide-o',
                    'tips': `点击图标获取${titleMap['Summary']}`,
                    'action':'getSummary',
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
                    'tips': `获取超时,点击图标重试获取${titleMap['Summary']}`,
                    'action': 'forceSummary',
                    'class': ''
                },
                'cancel': {
                    'icon': 'replay',
                    'tips': `取消成功,点击图标重试获取${titleMap['Summary']}`,
                    'action': 'forceSummary',
                    'class': ''
                },
                "rateLimit": {
                    'icon': 'warning-o',
                    'tips': `超出使用额度，请换号，或者过一段时间(1小时？)再试`,
                    'action':'e',
                    'class': ''
                }
            }
            return stateMap[state.summaryState as keyof typeof stateMap]
        }
    },
    actions: {
        async loadMeta() {
            let meta = await storage.getMetaKey();
            this[storage.metaKey] = Object.assign(this[storage.metaKey], meta)  
        },
        async getClickSubtitle() {
            //@ts-ignore
            return this[storage.metaKey].clickSubtitle
        },
        async getGpt3Summary(){
            const videoId = getBVid(window.location.href)
            this.videoId = videoId
            const subtitle = await getSubtitle(videoId)
            if(!subtitle) { 
                this.summaryState = 'unfetchable'
                return 0;
            }
            try {
                port.postMessage({
                    type: 'gtp3Summary',
                    videoId,
                    subtitle,
                    title: document.title,
                })
                this.summaryState  = 'fetching'
            } catch (error) {
                console.error(error)
                this.summaryState  = 'unfetchable'
            }
        },
        async getSummary(){
            await this.summaryWithType('getSummary')
        },
        async summaryWithType(type:string) {
            this.free = false;
            this.preMessage = ''
            const videoId = getBVid(window.location.href)
            this.videoId = videoId
            const subtitle = await this.getSubtitle(videoId)
            if(!subtitle || subtitle.length === 0) { 
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
            this.preMessage = ''
            port.postMessage({
                type: 'cancel'
            })
        },
        async getSubtitle(videoId:string){
            try {
                let result = await (await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`,{
                    credentials: 'include'
                })).json()
                if(result.data.subtitle.list.length > 0) {
                    let url = result.data.subtitle.list[0].subtitle_url.replace(/^http:/, 'https:')
                    let subtitle = await (await fetch(url)).json()
                    this.subtitle = subtitle;
                    return subtitle.body
                } else {
                    return this.subtitle
                }
            } catch (error) {
                console.error(error)
                return null
            }
        },
        async clearCurrentCache() {
            const videoId = getBVid(window.location.href)
            this.videoId = videoId
            await Browser.storage.local.remove(videoId)
        },
        e() {
            console.log('e')
        }
    }
})




