<script setup lang="ts">
import { computed } from 'vue';
import Fetching from './infoPage/Fetching.vue'
import Info from './infoPage/Info.vue'
import { useStore } from '../state'
const summary = useStore()

const components = {
    'FETCHING': Fetching,
    'INFO': Info
}
const currentComponent = computed(() => {
    const name = summary.summaryState === 'fetching' ? 'FETCHING' : 'INFO'
    return components[name as keyof typeof components]
})
</script>
<template>
    <div class="content markdown-body" v-html="summary.markdownContent" v-if="summary.isContent">
    </div>
    <div class="fetch" v-else>
        <component :is="currentComponent"></component>
    </div>
</template>

<style scoped lang="scss">
.fetch {
    display: flex;
    min-height: 300px;
    max-height: 500px;
    align-items: center;
    justify-content: center;
    flex-direction: column;



    .tips {
        user-select: none;
        margin-top: 30px;
        color: grey;
        width: 80%;
        text-align: center;
    }
}

.content {
    overflow: auto;
    min-height: 300px;
    max-height: 500px;
    font-size: larger;
    margin: 5px;
}
</style>