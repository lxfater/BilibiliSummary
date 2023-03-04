<script setup lang="ts">
import { useStore } from '../../state';
const store = useStore()
const options = [{
  value: 'gpt-3.5-turbo',
  label: 'gpt-3.5-turbo'
}, {
  value: 'gpt-3.5-turbo-0301',
  label: 'gpt-3.5-turbo-0301'
}, {
  value: 'text-davinci-003',
  label: 'text-davinci-003'
}]
</script>
<template>
    <el-form label-width="200px" label-position="left">
      <el-form-item label="APIKEY">
        <el-input v-model="store.meta.OpenaiSetting.apiKey" @change="store.changeOpenaiApikey"/>
      </el-form-item>
      <el-form-item label="模型列表">
        <el-select v-model="store.meta.OpenaiSetting.model" placeholder="当前接入方式" size="large" @change="store.changeOpenaiModel" >
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="最大token数">
        <el-input v-model="store.meta.OpenaiSetting.maxTokens" @change="store.changeOpenaiMaxTokens" />
      </el-form-item>
    </el-form>
</template>

<style scoped lang="scss">
</style>