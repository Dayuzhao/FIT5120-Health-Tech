import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/500.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'

const app = createApp(App)

app.use(router)

app.mount('#app')