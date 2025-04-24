import { createApp } from 'vue';
import App from './App.vue';
import ToastPlugin from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';

import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import Onboarding from './components/Onboarding.vue';
import Home from './Home.vue';
import './index.css'
// import { round } from '@xenova/transformers';


const rotues = [
  {
    path: '/', component: App
  },
  {
    path: '/onboarding', component: Onboarding
  }
];

const router = createRouter ({
  routes: rotues,
  history: createWebHistory()
})


const vueApp = createApp(Home)
vueApp.use(router)
vueApp.use(ToastPlugin)
vueApp.mount('#app');

 