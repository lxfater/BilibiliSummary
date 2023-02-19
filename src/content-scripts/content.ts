import { createApp } from "vue";
import App from "./App.vue";
import { Icon } from 'vant';
import { Loading } from 'vant';
const app = createApp(App)
import 'vant/lib/index.css';
app.use(Icon);
app.use(Loading);


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