import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createRouter, createWebHashHistory } from 'vue-router'


import Setting from './pages/Setting.vue'
import About from './pages/About.vue'
import Summary from './pages/Summary.vue'
import Subtitle from './pages/Subtitle.vue'
import Help from './pages/Help.vue';
import ChatgptWeb from './pages/provider/ChatgptWeb.vue';
import Openai from './pages/provider/Openai.vue';
import { createPinia } from 'pinia'
const pinia = createPinia()
const routes = [
    { path: '/', component: Setting,
      children: [
        { path: 'ChatgptWeb', component: ChatgptWeb },
        { path: 'Openai', component: Openai },
      ] 
    },
    { path: '/summary', component: Summary },
    { path: '/subtitle', component: Subtitle },
    { path: '/help', component: Help },
    { path: '/about', component: About },
  ]
  
const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

createApp(App)
.use(pinia)
.use(router)
.use(ElementPlus)
.mount('#app')