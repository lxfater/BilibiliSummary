<script setup lang="ts">
import Browser from 'webextension-polyfill'
import { onMounted, ref } from 'vue';
import { useStore } from '../state';
const summary = useStore()

const autoFetch = ref(true)
const tokens = ref(50)
const timeout = ref(5)
const changeToken = (value: number) => {
  Browser.storage.local.set({ tokens: value })
}
const changeTimeout = (value: number) => {
  Browser.storage.local.set({ timeout: value })
}
onMounted(() => {
  
})

</script>
<template>
  <div>
    <van-field name="switch" label="自动获取" >
      <template #input>
        <van-switch v-model="summary.settings.autoFetch" @change="summary.changeAutoFetch"/>
      </template>
    </van-field>
    <van-field name="slider" label="生成质量">
      <template #input>
        <van-slider v-model="summary.settings.summaryToken" integer @change="summary.changeSummaryToken"/>
      </template>
    </van-field>
    <van-field v-model="summary.settings.fetchTimeout" type="digit" label="超时时间(分钟)" @change="summary.changeFetchTimeout"/>
    <van-field name="slider" label="清空当前缓存">
      <template #input>
        <van-button type="danger" plain size="mini" @click="summary.clearCurrentCache">清空</van-button>
      </template>
    </van-field>
    <van-field name="slider" label="清空全部缓存">
      <template #input>
        <van-button type="danger" plain size="mini" @click="summary.clearCache()">清空</van-button>
      </template>
    </van-field>
  </div>
</template>

<style scoped lang="scss"></style>