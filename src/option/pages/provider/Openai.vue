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
    <div class="overview">
      <h2>调参指导：调节下列参数然后查看这里理解运行过程</h2>
      <p>{{ `假设当前字幕是16000个字, 那么你的请求将会分为${Math.ceil(16000/store.meta.OpenaiSetting.stopCount)}次发送:16000/${store.meta.OpenaiSetting.stopCount}次。`}}</p>
      <p>{{ `每次时间间隔为${store.meta.OpenaiSetting.stopIntervalMs}毫秒。每次请求的${store.meta.OpenaiSetting.stopCount}汉字将会最多被压缩为${store.meta.OpenaiSetting.words}个汉字。`}}</p>
      <p>{{`生成${store.meta.OpenaiSetting.minCount}到${store.meta.OpenaiSetting.maxCount}个要点。`  }}</p>
      <p>{{`合并基准时间${store.meta.OpenaiSetting.baseTime}分钟，步长${store.meta.OpenaiSetting.step}分钟。每次压缩到${store.meta.OpenaiSetting.count}次就放弃压缩。`  }}</p>
      <p>{{`超时时间${store.meta.OpenaiSetting.timeout}分钟，自动取消请求。`  }}</p>
      <p>{{`最大token数${store.meta.OpenaiSetting.maxTokens}代表返回答案长度。`  }}</p>
      <p>需要输入apikey,选择模型使用。</p>
    </div>
    <el-form label-width="200px" label-position="left">
      <el-form-item label="APIKEY">
        <el-input v-model="store.meta.OpenaiSetting.apiKey" />
      </el-form-item>
      <el-form-item label="模型列表">
        <el-select v-model="store.meta.OpenaiSetting.model" placeholder="当前接入方式" size="large"  >
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="最大token数">
        <el-input v-model="store.meta.OpenaiSetting.maxTokens"  />
      </el-form-item>
      <el-form-item label="多少字触发一次发送">
        <el-input v-model="store.meta.OpenaiSetting.stopCount" />
      </el-form-item>
      <el-form-item label="间隔多少毫秒发送一次">
        <el-input v-model="store.meta.OpenaiSetting.stopIntervalMs" />
      </el-form-item>
      <el-form-item label="超时时间(分钟)">
        <el-input v-model="store.meta.OpenaiSetting.timeout" />
      </el-form-item>
      <el-form-item label="最大字符数">
        <el-input v-model="store.meta.OpenaiSetting.words" />
      </el-form-item>
      <el-form-item label="合并基准时间(秒)">
        <el-input v-model="store.meta.OpenaiSetting.baseTime" />
      </el-form-item>
      <el-form-item label="合并基准时间步长(秒)">
        <el-input v-model="store.meta.OpenaiSetting.step" />
      </el-form-item>
      <el-form-item label="最大要点数">
        <el-input v-model="store.meta.OpenaiSetting.maxCount" />
      </el-form-item>
      <el-form-item label="最小要点数">
        <el-input v-model="store.meta.OpenaiSetting.minCount" />
      </el-form-item>
      <el-form-item label="压缩次数">
        <el-input v-model="store.meta.OpenaiSetting.count" />
      </el-form-item>
    </el-form>
</template>

<style scoped lang="scss">
.overview {
  margin-bottom: 20px;
  p {
    margin-bottom: 10px;
    font-size: 20px;

  }
}
</style>