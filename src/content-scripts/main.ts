import { createApp } from "vue";
import App from "./App.vue";
const app = createApp(App)
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

app.use(ElementPlus)

window.onload = async () => {
  const el = document.querySelector('#danmukuBox');
  if (el) {
    el.insertAdjacentHTML(
      'beforebegin',
      '<div id="crx-app" style="pointer-events:all" ></div>',
    );
    
    app.mount('#crx-app');
  }
}