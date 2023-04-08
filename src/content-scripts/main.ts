import { createApp } from "vue";
import App from "./App.vue";
import { NavBar,Col, Row,Icon, Button, Switch,Field, Slider } from 'vant';
import 'vant/lib/index.css';
import { createPinia } from 'pinia'
const app = createApp(App)
const pinia = createPinia()
app
.use(Slider)
.use(Field)
.use(Switch)
.use(Button)
.use(pinia)
.use(NavBar)
.use(Col)
.use(Row)
.use(Icon);

setTimeout(() => {
  const el = document.querySelector('#danmukuBox');
  if (el) {
    el.insertAdjacentHTML(
      'beforebegin',
      '<div id="summary-app-dkfjslkf" style="pointer-events:all" ></div>',
    );
    app.mount('#summary-app-dkfjslkf');
  } else {
    console.error('element not found');
  }
},800)