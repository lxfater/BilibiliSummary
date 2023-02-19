<script setup lang="ts">
import { SubTitle, Body } from '../types'
import { ref, onMounted, computed } from 'vue'
import Browser from 'webextension-polyfill'
const port = Browser.runtime.connect({name: 'BilibiliSUMMARY'})
const content = ref('点击总结按钮开始总结')
const subtitle = ref<Body[]>([])
const contentStyle = ref('tips');

const startSubtitle = () => {
  const el = document.querySelector('#bilibili-player > div > div > div.bpx-player-primary-area > div.bpx-player-video-area > div.bpx-player-control-wrap > div.bpx-player-control-entity > div.bpx-player-control-bottom > div.bpx-player-control-bottom-right > div.bpx-player-ctrl-btn.bpx-player-ctrl-subtitle > div.bpx-player-ctrl-btn-icon > span')
  //@ts-ignore
  el.click()
  setTimeout(() => {
    //@ts-ignore
    el.click()
  },500)
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
    startSubtitle()
  }, 1000)
})

const summary = () => {
  content.value = '取消之前的任务，正在总结中...'
  contentStyle.value = 'tips'
  startSubtitle()
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
.summary-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  justify-content: space-between;
  align-items: center;
  width: auto;
  background-color: #f1f2f3;
  border-radius: 6px;
  user-select: none;
  .header {
    display: flex;
    height: 52px;
    width: 100%;
    flex-direction: column;
    align-content: center;
    justify-content: space-between;
    align-items: center;
    
    .main {
      display: flex;
      width: 100%;
      height: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      .brand {
      padding-left: 16px;
      font-size: 16px;
      font-weight: 500;
      color: #18191c;

      }
      .actions {
        padding-right: 17px;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        .action {
          //button-small-primary
          display: flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          width: 50px;
          border-radius: 4px;
          background-color: #1f7fde;
          margin-left: 16px;
          font-size: 14px;
          font-weight: 500;
          color: #eeeff2;
          cursor: pointer;
          
        }
      }
    }

  }
  .warning {
      color: red;
      font-size: 7px;
      text-align: center;
      width: 100%;
      padding: 2px;
      background-color: #fff;
  }
  .content {
    display: flex;
    width: 100%;
    min-height: 50px;
    max-height: 650px;
    background-color: #fff;
    overflow-y: auto;
    .summary {
      display: flex;
      flex-direction: column;
      padding: 10px;
      width: 100%;
      height: 100%;
      font-size: 14px;
      font-weight: 500;
      color: #18191c;
      overflow-y: auto;
    }
    .tips {
      display: flex;
      flex-direction: column;
      padding: 10px;
      width: 100%;
      height: 100%;
      font-size: 18px;
      font-weight: 700;
      color: #18191c;
      text-align: center;
    }

  }

}
</style>