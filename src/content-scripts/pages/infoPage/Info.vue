<script setup lang="ts">
import { useStore } from '../../state'
const summary = useStore()
</script>
<template>
    <van-icon :class="`icon ${summary.otherComponentState.class}`" :name="summary.otherComponentState.icon" size="60" @click="summary[summary.otherComponentState.action]()"/>
    <div class="tips" style="margin-top:5px">{{ summary.otherComponentState.tips }}</div>
</template>

<style scoped lang="scss">
.icon {
    cursor: pointer;
    &:hover {
        color: #1989fa;
    }
}
</style>