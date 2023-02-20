<script setup lang="ts">
import { SubTitle, Body } from '../types'
import { ref, onMounted, computed } from 'vue'
import Browser from 'webextension-polyfill'
const port = Browser.runtime.connect({name: 'BilibiliSUMMARY'})
const content = ref('点击总结按钮开始总结')
const subtitle = ref<Body[]>([])
const contentStyle = ref('tips');

const fetchBilibiliSubtitle = () => {
  const selector = '#bilibili-player > div > div > div.bpx-player-primary-area > div.bpx-player-video-area > div.bpx-player-control-wrap > div.bpx-player-control-entity > div.bpx-player-control-bottom > div.bpx-player-control-bottom-right > div.bpx-player-ctrl-btn.bpx-player-ctrl-subtitle > div.bpx-player-ctrl-btn-icon > span'
  const el = document.querySelector(selector)
  return new Promise(() => {
    if(el) {
        //@ts-ignore
      el.click()
      setTimeout(() => {
        //@ts-ignore
        el.click()
        return true
      },1000)
    } else {
      return false
    }
  })

}
onMounted(() => {
  window.addEventListener('message', function(event) {
    console.log('content-scripts', event.data)
    if (event.data.type === 'getSummary') {
       let data = JSON.parse(event.data.content) as SubTitle
       subtitle.value = data.body
    }
  });
  port.onMessage.addListener((result) => {
    const { type, content: answer} = result;
    if (type === 'summary') {
      content.value = answer;
      contentStyle.value = 'summary'
    } else if( type === 'error') {
      contentStyle.value = 'tips'
      content.value = '发生错误，可能是一下情况。无api权限, 需要登录chatgpt,然后刷新页面;chatgpt限制了50次/hour,需要等待。'
    }
  })

  setTimeout(() => {
    fetchBilibiliSubtitle()
  }, 1000)
})

const summary = async () => {
  content.value = '取消之前的任务，正在总结中...'
  contentStyle.value = 'tips'
  let result = fetchBilibiliSubtitle();
  setTimeout(() => {
    port.postMessage({
      type: 'getSummary',
      content: subtitle.value,
      title: document.title
    })
  }, 1000)
}
</script>
<template>
  <div class="summary-container">
    <div class="header">
      <div class="main">
        <div class="brand">
          视频总结
        </div>
        <div class="actions">
          <div class="action" @click="summary">总结</div>
        </div>
      </div>
    </div>
    <div class="warning">本功能频繁使用可能导致账户封禁，自己玩脱了,概不负责。怕的话用小号</div>
    <div class="content">
      <div :class="contentStyle">
          {{ content }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>