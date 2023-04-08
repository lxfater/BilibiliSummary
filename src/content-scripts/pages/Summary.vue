<script setup lang="ts">
import { computed } from 'vue';
import Fetching from './infoPage/Fetching.vue'
import Info from './infoPage/Info.vue'
import { useStore } from '../state'
const summary = useStore()

const components = {
    'FETCHING': Fetching,
    'INFO': Info
}
const currentComponent = computed(() => {
    const name = summary.summaryState === 'fetching' ? 'FETCHING' : 'INFO'
    return components[name as keyof typeof components]
})
const goto = (time: string) => {
    window.postMessage({
        type: 'goto',
        content: time
    }, '*')
}
// number to 00:00:00
const formatTime = (time: number) => {
    const h = Math.floor(time / 3600)
    const m = Math.floor((time - h * 3600) / 60)
    const s = Math.floor(time - h * 3600 - m * 60)
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
}
</script>
<template>
    <div class="progress"></div>
    <div class="content markdown-body" v-if="summary.isContent">
        
        <div class="item" v-for="i in summary.list">
            <div class="link">
                <a @click="goto(i.time)">{{ formatTime(parseInt(i.time)) }}</a>
            </div>
            <div class="summary">
                {{ i.content }}
            </div>
        </div>
    </div>
    <div class="fetch" v-else>
        <component :is="currentComponent"></component>
    </div>
</template>

<style scoped lang="scss">
.content {
    display: flex;
    flex-direction: column;
    // nice progress bar with gredient animation
    .progress {
        height: 5px;
        background: linear-gradient(to right, #1794dd, #1794dd 50%, #f1f3f6 50%, #f1f3f6);
        background-size: 200% 100%;
        background-position: right bottom;
        animation: progress 2s linear infinite;
    }
    .item {
        display: flex;
        align-items: center;
        .link {
            width: 80px;
            a {
                color: #f1f3f6;
                text-decoration: none;
                cursor: pointer;
                background-color: #82898d;
                border-radius: 3px;
                padding: 2px 2px;
                &:hover {
                    background-color: #1794dd;
                }
            }
        }

        .summary {
            flex: 1;
            margin-left: 10px;
            padding: 5px;
            margin-bottom: 5px;
            background-color: #f1f3f6;
            border-radius: 5px;
            &:hover {
                background-color: #e5e5e5;
            }
        }
    }
    // nice scrollbar
    &::-webkit-scrollbar {
        width: 5px;
    }
    &::-webkit-scrollbar-track {
        background: #f1f3f6;
    }
    &::-webkit-scrollbar-thumb {
        background: #82898d;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: #1794dd;
    }


}

.fetch {
    display: flex;
    min-height: 300px;
    max-height: 500px;
    align-items: center;
    justify-content: center;
    flex-direction: column;



    .tips {
        user-select: none;
        margin-top: 30px;
        color: grey;
        width: 80%;
        text-align: center;
    }
}

.content {
    overflow: auto;
    min-height: 300px;
    max-height: 500px;
    font-size: larger;
    margin: 5px;
}
</style>