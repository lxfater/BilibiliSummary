<script setup lang="ts">
import { useStore } from '../../state'
const summary = useStore()
</script>
<template>
    <van-icon class="icon plane" name="guide-o" size="60" />
    <div class="tips" style="margin-top:5px">正在获取获取视频摘要</div>
    <van-button class="" plain hairline type="primary" size="mini" @click="summary.cancel"
        style="margin-top:5px">取消</van-button>
</template>

<style scoped lang="scss">
.icon {
    cursor: pointer;
    &:hover {
        color: #1989fa;
    }
}


.plane {
    z-index: 9999;
    color: #1989fa;
    position: absolute;
    offset-path: path("M -102 -3 Q -108 -57 -59 -69 Q -10 -69 -9 0 Q -19 45 23 70 Q 71 55 60 3 Q 61 -60 120 -63 Q 165 -62 171 -2");
    animation: flight 3s ease-out infinite;
}

@keyframes flight {
    100% {
        offset-distance: 100%;
    }
}
</style>