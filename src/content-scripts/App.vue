<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Setting from './pages/Setting.vue';
import Help from './pages/Help.vue';
import Subtitle from './pages/Subtitle.vue';
import Summary from './pages/Summary.vue';
import { titleMap } from './lang'
import { getBVid, urlChange } from './utils'
import { useStore, storage } from './state';
import { port } from './utils';
import Browser from 'webextension-polyfill';
import { SubTitle } from '../types';
import logo from "../../logo.png"
const components = {
  Summary,
  Setting,
  Help,
  Subtitle
}
const curretView = ref('Summary')
const to = (path: string) => {
  curretView.value = path
}
const store = useStore();


const title = computed(() => {
  return titleMap[curretView.value as keyof typeof titleMap]
})
const iconColor = (path: string) => {
  if (path === curretView.value) {
    return '#1989fa'
  } else {
    return '#000'
  }
}
const startSubtitle = () => {
  const el = document.querySelector('#bilibili-player > div > div > div.bpx-player-primary-area > div.bpx-player-video-area > div.bpx-player-control-wrap > div.bpx-player-control-entity > div.bpx-player-control-bottom > div.bpx-player-control-bottom-right > div.bpx-player-ctrl-btn.bpx-player-ctrl-subtitle > div.bpx-player-ctrl-btn-icon > span')
  if (el) {
    //@ts-ignore
    el.click() 
    setTimeout(() => {
      //@ts-ignore
      el.click()
    }, 500)
  }
}

urlChange(() => {
  store.summaryState = 'fetchable'
})

let preMessage = ''
const handleBackgroundMessage = (result: { type: any; content: any; }) => {
  const { type, content } = result;
  if (type === 'summary') {
    const videoId = getBVid(window.location.href)
    if (videoId !== content.videoId) {
      return;
    }
    store.summaryState = 'fetched'
    store.summary = preMessage + content.message
    console.log('content-message', content.message)
  } else if(type === 'summaryFinal') {
    const videoId = getBVid(window.location.href)
    if (videoId !== content.videoId) {
      return;
    }
    preMessage += content.message
  } else if (type === 'error') {
    store.summaryState = content
  }
}
const handleMessage = (event: { data: { type: string; content: string; }; }) => {
    console.log('content-scripts', event.data)
    if (event.data.type === 'getSummary') {
      let data = JSON.parse(event.data.content) as SubTitle
      store.subtitle= data.body
    }
}
onMounted(async () => {
  await store.loadMeta()
  storage.onMetaKeyChange((meta) => {
    //@ts-ignore
    store[storage.metaKey] = meta
  })
  port.onMessage.addListener(handleBackgroundMessage)
  window.addEventListener('message',handleMessage);
  if (await store.getClickSubtitle()) {
    setTimeout(() => {
      startSubtitle()
    }, 800)
  }
  //@ts-ignore
  if (store[storage.metaKey].autoFetch) {
    store.forceSummary()
  }
})

const openOptions = () => {
  port.postMessage({
    type: 'CommonService',
    content: {
      method:'openOptionsPage'
    }
  })
}
</script>
<template>
  <div>
    <div class="bar">
      <div class="icon">
        <img :src="Browser.runtime.getURL(logo)">
        <div class="text">Summary for Bilibili</div>
      </div>
      <div class="action">
        <van-icon name="exchange" size="22" :color="`${iconColor('Summary')}`" @click="to('Summary')" />
        <van-icon name="setting-o" size="22" :color="`${iconColor('Setting')}`" @click="openOptions" />
      </div>
    </div>
    <div class="container">
      <component :is="components[curretView as keyof typeof components]"></component>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bar {
  border: 2px solid #e5e5e5;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;

  .icon {
    display: flex;
    align-items: center;
    padding: 5px;

    img {
      width: 30px;
      height: 30px;
    }

    .text {
      font-size: 16px;
      margin-left: 5px;
      font-weight: 700;
    }
  }

  .action {
    display: flex;
    width: 100px;
    justify-content: space-evenly;
  }
}

.container {
  padding: 5px;
  border-bottom: 2px solid #e5e5e5;
  border-right: 2px solid #e5e5e5;
  border-left: 2px solid #e5e5e5;
  border-radius: 0 0 4px 4px;
  min-height: 300px;
  max-height: 500px;
  margin-bottom: 10px;
}</style>