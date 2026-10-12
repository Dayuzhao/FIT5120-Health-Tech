<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useMusicPlayer } from '@/composables/useMusicPlayer'

const {
  currentTrack,
  shuffleOn,
  isPlaying,
  muted,
  volume,
  failed,
  audioEl,
  loadTracks,
  initializeAudioEffects,
  togglePlay,
  goNext,
  goPrevious,
  toggleShuffle,
  toggleMute,
  setVolume,
} = useMusicPlayer()

const audioElRef = ref(null)
const volumeOpen = ref(false)

// Usability finding: tapping the track area opens the Atmosphere settings from
// any page. On /atmosphere itself the link would go nowhere, so it renders as a
// plain block there. The transport buttons stay outside the link so they keep
// controlling playback instead of navigating.
const route = useRoute()
const onAtmosphere = computed(() => route.path === '/atmosphere')
const linkLabel = computed(() => {
  const status = isPlaying.value ? 'Playing' : 'Paused'
  return currentTrack.value
    ? `${status}: ${currentTrack.value.name}. Open atmosphere settings`
    : 'Open atmosphere settings'
})

onMounted(() => {
  audioEl.value = audioElRef.value
  initializeAudioEffects()
  loadTracks()
})
</script>

<template>
  <div class="music-player">
    <audio
      ref="audioElRef"
      :src="currentTrack?.audioUrl"
      :muted="muted"
      crossorigin="anonymous"
      @ended="goNext"
    ></audio>

    <component
      :is="onAtmosphere ? 'div' : RouterLink"
      :to="onAtmosphere ? undefined : '/atmosphere'"
      :aria-label="onAtmosphere ? undefined : linkLabel"
      class="track-info"
      :class="{ 'is-link': !onAtmosphere }"
    >
      <img v-if="currentTrack" :src="currentTrack.albumImageUrl" alt="" class="album-art" />
      <div v-else class="album-art album-art-placeholder">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      <p class="track-name">
        <template v-if="currentTrack"
          >{{ currentTrack.name }} · {{ currentTrack.artistName }}</template
        >
        <template v-else>{{ failed ? 'Music unavailable' : 'Loading music…' }}</template>
      </p>

      <svg
        v-if="!onAtmosphere"
        class="link-chevron"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </component>

    <div class="controls">
      <button
        class="icon-button"
        type="button"
        :disabled="!currentTrack"
        aria-label="Previous track"
        @click="goPrevious"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <rect x="5" y="5" width="2" height="14" />
          <path d="M18 5v14L8 12z" />
        </svg>
      </button>

      <button
        class="icon-button play-button"
        type="button"
        :disabled="!currentTrack"
        :aria-label="isPlaying ? 'Pause' : 'Play'"
        @click="togglePlay"
      >
        <svg v-if="!isPlaying" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" />
          <rect x="14" y="5" width="4" height="14" />
        </svg>
      </button>

      <button
        class="icon-button"
        type="button"
        :disabled="!currentTrack"
        aria-label="Next track"
        @click="goNext"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <rect x="17" y="5" width="2" height="14" />
          <path d="M6 5v14l10-7z" />
        </svg>
      </button>

      <button
        class="icon-button"
        type="button"
        :class="{ active: shuffleOn }"
        :disabled="!currentTrack"
        aria-label="Toggle shuffle"
        @click="toggleShuffle"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      </button>

      <button
        class="icon-button"
        type="button"
        :disabled="!currentTrack"
        :aria-label="muted ? 'Unmute' : 'Mute'"
        @click="toggleMute"
      >
        <svg
          v-if="!muted"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
          <path d="M14.5 8.5a4.5 4.5 0 0 1 0 7" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
          <line x1="16" y1="9" x2="21" y2="15" />
          <line x1="21" y1="9" x2="16" y2="15" />
        </svg>
      </button>
    </div>

    <button
      class="icon-button volume-toggle"
      type="button"
      :aria-expanded="volumeOpen"
      :aria-label="volumeOpen ? 'Hide volume slider' : 'Show volume slider'"
      @click="volumeOpen = !volumeOpen"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M3 9v6h4l5 4V5L7 9H3z" />
        <path d="M16 9a5 5 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
    </button>

    <label v-if="volumeOpen" class="volume-control">
      <span class="sr-only">Music volume</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="volume"
        aria-label="Music volume"
        @input="setVolume($event.target.value)"
      />
      <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
    </label>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: min(360px, calc(100vw - 32px));

  background: #2f714a;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(32, 57, 42, 0.32);

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  box-sizing: border-box;
}

.track-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.track-info.is-link {
  padding: 3px 6px 3px 3px;
  margin: -3px 0 -3px -3px;
  border-radius: 14px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: background 180ms ease;
}

.track-info.is-link:hover {
  background: rgba(255, 255, 255, 0.14);
}

.track-info.is-link:focus-visible {
  outline: 2px solid white;
  outline-offset: 1px;
}

.link-chevron {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.75);
}

.album-art {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  object-fit: cover;
  flex-shrink: 0;
}

.album-art-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.track-name {
  margin: 0;
  color: white;
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.volume-control {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  width: min(190px, calc(100vw - 32px));
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #2f714a;
  box-shadow: 0 8px 22px rgba(32, 57, 42, 0.28);
  color: rgba(255, 255, 255, 0.9);
}

.volume-control input {
  flex: 1;
  min-width: 0;
  height: 16px;
  margin: 0;
  accent-color: white;
  cursor: pointer;
}

.volume-value {
  min-width: 32px;
  font-size: 10px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.icon-button {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 180ms ease;
}

.icon-button:hover:not(:disabled):not(.active) {
  background: rgba(255, 255, 255, 0.3);
}

.icon-button.active {
  background: white;
  color: #2f714a;
}

.icon-button.active:hover:not(:disabled) {
  background: #eef4ef;
}

.icon-button:disabled {
  opacity: 0.45;
  cursor: default;
}

.play-button {
  width: 32px;
  height: 32px;
  background: white;
  color: #2f714a;
}

.play-button:hover:not(:disabled) {
  background: #eef4ef;
}

@media (max-width: 700px) {
  .music-player {
    bottom: 12px;
    padding: 7px 9px;
  }

  .track-name {
    font-size: 11.5px;
  }
}
</style>
