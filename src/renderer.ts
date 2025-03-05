import { createApp } from 'vue';
import App from './App.vue';
import ToastPlugin from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';

const vueApp = createApp(App)
vueApp.use(ToastPlugin)
vueApp.mount('#app');

 