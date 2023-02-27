<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Setting from './pages/Setting.vue';
import Help from './pages/Help.vue';
import Subtitle from './pages/Subtitle.vue';
import Summary from './pages/Summary.vue';
import { titleMap } from './lang'
import { getBVid, urlChange } from './utils'
import { useStore } from './state';
import { port } from './utils';
import Browser from 'webextension-polyfill';
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

const store = useStore();
urlChange(() => {
  store.summaryState = 'fetchable'
})
const handleBackgroundMessage = (result: { type: any; content: any; }) => {
  const { type, content} = result;
  if (type === 'summary') {
    const videoId = getBVid(window.location.href)
    if(videoId !== content.videoId) {
      return;
    }
    store.summaryState = 'fetched'
    store.summary = content.message;
  } else if (type === 'error') {
    store.summaryState = content
  }
}
onMounted(async () => {
  port.onMessage.addListener(handleBackgroundMessage)

  let result = await Browser.storage.local.get(['options'])
  let autoFetch = true;
  let summaryToken = 0.5;
  if(result['options']) {
      autoFetch = result['options'].autoFetch === true ? true : false;
      summaryToken = result['options'].summaryToken ? result['options'].summaryToken : 20;
      store.settings.autoFetch = autoFetch;
      store.settings.summaryToken = summaryToken;
  }

  if (autoFetch) {
    store.forceSummary()
  }

})
</script>
<template>
  <div>
    <van-nav-bar :left-text="title" class="navbar" :clickable="false">
      <template #right>
        <div class="action">
          <van-icon name="exchange" size="22" :color="`${iconColor('Summary')}`" @click="to('Summary')" />
          <van-icon name="setting-o" size="22" :color="`${iconColor('Setting')}`" @click="to('Setting')" />
          <van-icon name="question-o" size="22" :color="`${iconColor('Help')}`" @click="to('Help')" />
        </div>
      </template>
    </van-nav-bar>
    <div class="container">
      <component :is="components[curretView as keyof typeof components]"></component>
    </div>
  </div>
</template>

<style scoped lang="scss">
.navbar {
  border: 2px solid #e5e5e5;
  border-radius: 4px 4px 0 0;

  .action {
    display: flex;
    width: 100px;
    justify-content: space-evenly;
  }
}

.container {
  padding: 10px;
  border-bottom: 2px solid #e5e5e5;
  border-right: 2px solid #e5e5e5;
  border-left: 2px solid #e5e5e5;
  border-radius: 0 0 4px 4px;
  min-height: 300px;
  max-height: 500px;
  margin-bottom: 10px;
}
</style>