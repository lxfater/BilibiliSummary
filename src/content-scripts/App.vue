<script setup lang="ts">
import { SubTitle, Body } from '../types'
import { ref, onMounted, computed } from 'vue'
import Browser from 'webextension-polyfill'
const port = Browser.runtime.connect({name: 'BilibiliSUMMARY'})
const content = ref('')
const state = ref(0); 
const isSummary = ref(false)
const subtitle = ref<Body[]>([])
const hasSubtitle = computed(() => {
  return subtitle.value.length > 0
})
const hasSummary = ref(false);

// seconds to minutes with format 00:00 or 00:00:00 with round number
const secondToMinute = (seconds: number) => {
  const date = new Date(seconds * 1000)
  const hh = date.getUTCHours()
  const mm = date.getUTCMinutes()
  const ss = date.getSeconds()
  if (hh) {
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
  }
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

const startSubtitle = () => {
  console.log('startSubtitle')
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
      hasSummary.value = true;
    } else if( type === 'error') {
      content.value = '无api权限, 请登录openapi'
    }
  })

  setTimeout(() => {
    startSubtitle()
  }, 1000)
})

const summary = () => {
  isSummary.value = true
  if (!hasSummary.value) {
    port.postMessage({
      type: 'getSummary',
      content: subtitle.value,
      title: document.title
    })
  }
}

const handleSubtitle = () => {
  isSummary.value = false
}


</script>
<template>
  <div class="summary-container">
    <div class="header">
        <div class="brand">
        视频总结
      </div>
      <div class="actions">
        <div class="action" @click="summary">总结</div>
        <div class="action" @click="handleSubtitle">字幕</div>
      </div>
    </div>
    <div class="content">
      <div class="summary" v-if="isSummary">
          {{ content }}
      </div>
      <div class="subtitle" v-else >
        <div class="item" v-for="item in subtitle">
          <div class="time">{{ `${secondToMinute(item.from)}--${secondToMinute(item.to)}` }}</div>
          <div class="text">
            {{ item.content }}
          </div>
        </div>
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
  margin-bottom: 10px;
  border-radius: 6px;
  user-select: none;
  .header {
    display: flex;
    height: 44px;
    width: 100%;
    flex-direction: row;
    align-content: center;
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
        margin-left: 16px;
        font-size: 14px;
        font-weight: 500;
        color: #18191c;
        cursor: pointer;
        
      }
    }
  }
  .content {
    display: flex;
    width: 100%;
    min-height: 200px;
    max-height: 650px;
    background-color: #fff;
    overflow-y: auto;
    .subtitle {
      display: flex;
      flex-direction: column;
      width: 100%;
      .item {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 10px;
        width: 100%;
        .time {
          width: 130px;
          margin-left: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #18191c;
        }
        .text {
          font-size: 14px;
          font-weight: 500;
          color: #18191c;
        }
      }
      &:first-child {
        margin-top: 10px;
      }
    }
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

  }

}
</style>