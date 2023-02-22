import { defineStore } from 'pinia'
import { Body } from '../types';

import MarkdownIt from "markdown-it";
const markdown = new MarkdownIt();
import { titleMap } from './lang'
import {  getBVid, port } from './utils';

type State = {
    videoId: string,
    subtitle: Body[],
    summaryState: SummaryState,
    summary: string
}
type SummaryState = 'fetchable' | 'fetching' | 'unfetchable' | 'fetched' | 'tooManyRequests' | 'unauthorized' | 'notFound' | 'unknown' | 'cloudFlare' | 'onlyOne' | 'timeout' | 'canced'

export const useStore = defineStore('store', {
    state: (): State => ({
        videoId: '',
        subtitle: [],
        summary: '',
        summaryState: 'fetchable'
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
                    'tips': `点击获取${titleMap['Summary']}`,
                    'action': 'getSummary',
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
                    'tips': `需要重新登录chatgpt才能获取${titleMap['Summary']}`,
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
                    'tips': `获取超时5分钟,点击图标重试获取${titleMap['Summary']}`,
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
            const videoId = getBVid(window.location.href)
            try {
                port.postMessage({
                    type,
                    videoId,
                    title: document.title
                })
            } catch (error) {
                console.error(error)
                this.summaryState  = 'unfetchable'
            }
        },
        async forceSummary (){
            await this.summaryWithType('forceSummary')
        },
        async login(){
            window.open('https://chat.openai.com/chat', '_blank')
            this.summaryState= 'fetchable'
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
        }
        
    }
})




