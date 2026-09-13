<script setup>
import { onBeforeUnmount, ref } from 'vue'
import '@google/model-viewer'

const clickViewer = ref(null)

const isPlaying = ref(false)
const clickReady = ref(false)

let animationTimer = null

const playAnimation = () => {
  if (isPlaying.value || !clickReady.value) {
    return
  }

  isPlaying.value = true

  const viewer = clickViewer.value

  // start from the first frame of the animation
  viewer.currentTime = 0

  // play once
  viewer.play({
    repetitions: 1,
  })

  // Switch back to idle based on animation duration
  animationTimer = setTimeout(() => {
    returnToIdle()
  }, viewer.duration * 1000 + 100)
}

const returnToIdle = () => {
  isPlaying.value = false
}

onBeforeUnmount(() => {
  if (animationTimer) {
    clearTimeout(animationTimer)
  }
})
</script>

<template>
  <div
    class="companion-wrapper"
    @click="playAnimation"
  >
    <model-viewer
      class="companion-model"
      :class="{ hidden: isPlaying }"
      src="/models/curbi-idle.glb"
      alt="Curbi companion"
      loading="eager"
      interaction-prompt="none"
      shadow-intensity="0"
    ></model-viewer>

    <model-viewer
      ref="clickViewer"
      class="companion-model animated-model"
      :class="{ visible: isPlaying }"
      src="/models/curbi-click.glb"
      alt="Curbi companion animation"
      loading="eager"
      interaction-prompt="none"
      shadow-intensity="0"
      @load="clickReady = true"
    ></model-viewer>
  </div>
</template>

<style scoped>
.companion-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  cursor: pointer;
  transition: transform 180ms ease;
}

.companion-wrapper:hover {
  transform: translateY(-4px);
}

.companion-model {
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  background: transparent;
  opacity: 1;

  transition: opacity 120ms ease;

  --poster-color: transparent;
}

.companion-model.hidden {
  opacity: 0;
}

.animated-model {
  opacity: 0;
  pointer-events: none;
}

.animated-model.visible {
  opacity: 1;
}

@media (max-width: 700px) {
  .companion-wrapper {
    height: 160px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .companion-wrapper,
  .companion-model {
    transition: none;
  }

  .companion-wrapper:hover {
    transform: none;
  }
}
</style>