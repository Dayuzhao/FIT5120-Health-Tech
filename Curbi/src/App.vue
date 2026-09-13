<script setup>
import { RouterView } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import MusicPlayer from './components/MusicPlayer.vue'
</script>

<template>
  <AppNavbar />

  <div class="page-content">
    <RouterView />
  </div>

  <MusicPlayer />
</template>

<style scoped>
.page-content {
  /* Leaves room for the floating MusicPlayer pill (bottom: 18px + its own
     height) so it never covers the bottom of a page's own content. */
  padding-bottom: 90px;
}
</style>
