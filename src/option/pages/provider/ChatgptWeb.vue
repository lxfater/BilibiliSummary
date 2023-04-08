<script setup lang="ts">
import { useStore } from '../../state';
const store = useStore()
</script>
<template>
    <div class="overview">
      <h2>调参指导：调节下列参数然后查看这里理解运行过程</h2>
      <p>{{ `假设当前字幕是16000个字, 那么你的请求将会分为${Math.ceil(16000/store.meta.ChatgptWebSetting.stopCount)}次发送:16000/${store.meta.ChatgptWebSetting.stopCount}次。`}}</p>
      <p>{{ `每次时间间隔为${store.meta.ChatgptWebSetting.stopIntervalMs}毫秒。每次请求的${store.meta.ChatgptWebSetting.stopCount}汉字将会最多被压缩为${store.meta.ChatgptWebSetting.words}个汉字。`}}</p>
      <p>{{`生成${store.meta.ChatgptWebSetting.minCount}到${store.meta.ChatgptWebSetting.maxCount}个要点。`  }}</p>
      <p>{{`合并基准时间${store.meta.ChatgptWebSetting.baseTime}分钟，步长${store.meta.ChatgptWebSetting.step}分钟。每次压缩到${store.meta.ChatgptWebSetting.count}次就放弃压缩。`  }}</p>
      <p>{{`超时时间${store.meta.ChatgptWebSetting.timeout}分钟，自动取消请求。`  }}</p>
      <p><span style="color:red;">一个小时内有限额，用超需要等一个小时，我不能排除封号危险，建议使用小号。</span></p>
    </div>
     <el-form label-width="200px" label-position="left">
      <el-form-item label="多少个字触发一次发送">
        <el-input v-model="store.meta.ChatgptWebSetting.stopCount" />
      </el-form-item>
      <el-form-item label="间隔多少毫秒发送一次">
        <el-input v-model="store.meta.ChatgptWebSetting.stopIntervalMs" />
      </el-form-item>
        <el-form-item label="超时时间(分钟)">
        <el-input v-model="store.meta.ChatgptWebSetting.timeout" />
      </el-form-item>
      <el-form-item label="最大字符数">
        <el-input v-model="store.meta.ChatgptWebSetting.words" />
      </el-form-item>
      <el-form-item label="合并基准时间(秒)">
        <el-input v-model="store.meta.ChatgptWebSetting.baseTime"/>
      </el-form-item>
      <el-form-item label="合并基准时间步长(秒)">
        <el-input v-model="store.meta.ChatgptWebSetting.step"/>
      </el-form-item>
      <el-form-item label="最大要点数">
        <el-input v-model="store.meta.ChatgptWebSetting.maxCount"/>
      </el-form-item>
      <el-form-item label="最小要点数">
        <el-input v-model="store.meta.ChatgptWebSetting.minCount"/>
      </el-form-item>
      <el-form-item label="压缩次数">
        <el-input v-model="store.meta.ChatgptWebSetting.count"/>
      </el-form-item>
    </el-form>
</template>

<style scoped lang="scss">
.overview {
  margin-bottom: 20px;
  p {
    margin-bottom: 10px;
    font-size: 14px;

  }
}
</style>