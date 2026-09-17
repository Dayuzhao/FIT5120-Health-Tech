<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import { useMusicPlayer } from './composables/useMusicPlayer'

const { modulateAudio } = useMusicPlayer()

function handleAudioInput(event) {
  if (event.target.closest('button, a')) modulateAudio()
}

onMounted(() => document.addEventListener('pointerdown', handleAudioInput, true))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleAudioInput, true))
</script>

<template>
  <AppNavbar />

  <div class="page-content">
    <RouterView />
  </div>

  <MusicPlayer />
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  min-width: 320px;
  background: #edf4ee;
}

html,
body,
button,
input,
textarea,
select {
  font-family:
    'Nunito',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

body {
  color: #2f4437;

  font-size: 16px;
  line-height: 1.6;

  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family:
    'Nunito',
    system-ui,
    sans-serif;

  color: #20392a;

  font-weight: 700;
}
</style>

<style scoped>
.page-content {
  /* Leaves room for the floating MusicPlayer pill (bottom: 18px + its own
     height) so it never covers the bottom of a page's own content. */
  padding-bottom: 90px;
}
</style>
