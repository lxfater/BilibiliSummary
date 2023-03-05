<script setup lang="ts">

</script>
<template>
  <div class="container">
    <div class="card">
      前端程序员，技术涉猎比较广泛，目前小公司开发Electron应用，详细可以看我GitHub。希望35之前能构建好被动收入。为此努力学习投资，开发自己的产品。
    </div>
    <div class="card">
      <a href="https://github.com/lxfater" target="_blank">github地址，欢迎star</a>
    </div>
    <div class="card">
      <a href="https://twitter.com/lxfater" target="_blank">twitter地址</a>
    </div>
    <div class="card">
      <a href="https://juejin.cn/user/3034307822099031" target="_blank">掘金地址</a>
    </div>
    <div class="card">
      <a href="https://space.bilibili.com/1698450" target="_blank">Bilibili地址</a>
    </div>
    <div class="card">
      上面各种途径可以联系我，B站上也有视频，有测试群地址，可以加入测试群，有问题可以在群里提问。
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  .card {
    width: 80%;
    height: 45px;
    padding: 10px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    margin: 10px;
    font-size: larger;
    a {
      color: #1890ff;
      text-decoration: none;
      transition: color 0.3s;
      &:hover {
        color: #40a9ff;
      }
    }
    &:hover {
      box-shadow: 0 0 10px #e5e5e5;
    }
    
  }
}

</style>