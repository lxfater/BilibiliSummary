<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../state';
const store = useStore()
const router = useRouter()
const options = [{
  value: 'ChatgptWeb',
  label: 'ChatgptWeb'
}, {
  value: 'Openai',
  label: 'Openai'
}]

watch(() => store.meta.providerType, (val) => {
  router.push({
    path: `/${val}`
  })
})
const changeProviderType = (val: string) => {
  store.changeProviderType(val)
}
</script>
<template>
  <div class="settingContainer">
    <div class="common">
      <el-form label-width="200px" label-position="left">
        <el-form-item label="是否自动获取">
          <el-switch v-model="store.meta.autoFetch" size="large" @change="store.changeAutoFetch" />
        </el-form-item>
        <el-form-item label="强制触发字幕获取">
          <el-switch v-model="store.meta.clickSubtitle" size="large" @change="store.changeClickSubtitle" />
        </el-form-item>
        <el-form-item :label="`当前接入方式${store.meta.providerType}`">
          <el-select v-model="store.meta.providerType" placeholder="当前接入方式" size="large" @change="changeProviderType">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <router-view></router-view>
  </div>
</template>

<style scoped lang="scss">
.settingContainer {
  display: flex;
  flex-direction: column;

  .common {
    margin-bottom: 20px;
  }
}
</style>