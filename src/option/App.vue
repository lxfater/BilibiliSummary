<template>
  <el-menu default-active="/" router="true" mode="horizontal" :ellipsis="false"
    style="justify-content: center;">
    <el-menu-item index="0">
      <div class="icon">
        <img :src="Browser.runtime.getURL(logo)">
        <div class="text">Summary for Bilibili</div>
      </div>

    </el-menu-item>
    <div class="flex-grow" />
    <el-menu-item index="/">设置</el-menu-item>
    <!-- <el-menu-item index="/summary">总结</el-menu-item>
    <el-menu-item index="/subtitle">字幕</el-menu-item> -->
    <el-menu-item index="/help">帮助</el-menu-item>
    <el-menu-item index="/about">关于</el-menu-item>
  </el-menu>
  <div class="container">
    <router-view class="content"></router-view>
  </div>
</template>
  
<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useStore, storage } from './state';
import Browser from 'webextension-polyfill';
import logo from "../../logo.png"
onMounted(async () => {
  const store = useStore()
  store.$subscribe((mutation, state) => {
      storage.setMetaKey(state[storage.metaKey])
  })
  store.loadSettings()
})
</script>
  
<style scoped lang="scss">
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
.flex-grow {
  flex-basis: 600px;
}

.container {
  display: flex;
  justify-content: center;

  .content {
    width: 980px;
    padding: 10px;
  }
}
</style>