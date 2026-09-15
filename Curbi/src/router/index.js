import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import UrgeView from '../views/UrgeView.vue'
import TaskView from '../views/TaskView.vue'
import CompleteView from '../views/CompleteView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import HelpFinderView from '../views/HelpFinderView.vue'
import GameView from '../views/GameView.vue'
import AtmosphereView from '../views/AtmosphereView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/home',
      redirect: '/',
    },
    {
      path: '/urge',
      name: 'urge',
      component: UrgeView,
    },
    {
      path: '/play',
      name: 'play',
      component: GameView,
    },
    {
      path: '/task',
      name: 'task',
      component: TaskView,
    },
    {
      path: '/complete',
      name: 'complete',
      component: CompleteView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
    },
    {
      path: '/help',
      name: 'help',
      component: HelpFinderView,
    },
    {
      path: '/atmosphere',
      name: 'atmosphere',
      component: AtmosphereView,
    },
  ],
})

export default router