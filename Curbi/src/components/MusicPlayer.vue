<script setup>
import { onMounted, ref } from 'vue'
import { useMusicPlayer } from '@/composables/useMusicPlayer'

const {
  currentTrack,
  shuffleOn,
  isPlaying,
  muted,
  failed,
  audioEl,
  loadTracks,
  togglePlay,
  goNext,
  goPrevious,
  toggleShuffle,
  toggleMute,
} = useMusicPlayer()

const audioElRef = ref(null)

onMounted(() => {
  audioEl.value = audioElRef.value
  loadTracks()
})
</script>

<template>
  <div class="music-player">
    <audio ref="audioElRef" :src="currentTrack?.audioUrl" crossorigin="anonymous" :muted="muted" @ended="goNext"></audio>

    <div class="track-info">
      <img v-if="currentTrack" :src="currentTrack.albumImageUrl" alt="" class="album-art" />
      <div v-else class="album-art album-art-placeholder">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
      </div>

      <p class="track-name">
        <template v-if="currentTrack">{{ currentTrack.name }} · {{ currentTrack.artistName }}</template>
        <template v-else>{{ failed ? 'Music unavailable' : 'Loading music…' }}</template>
      </p>
    </div>

    <div class="controls">
      <button class="icon-button" type="button" :disabled="!currentTrack" aria-label="Previous track" @click="goPrevious">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="5" y="5" width="2" height="14" /><path d="M18 5v14L8 12z" /></svg>
      </button>

      <button class="icon-button play-button" type="button" :disabled="!currentTrack" :aria-label="isPlaying ? 'Pause' : 'Play'" @click="togglePlay">
        <svg v-if="!isPlaying" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
      </button>

      <button class="icon-button" type="button" :disabled="!currentTrack" aria-label="Next track" @click="goNext">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="17" y="5" width="2" height="14" /><path d="M6 5v14l10-7z" /></svg>
      </button>

      <button
        class="icon-button"
        type="button"
        :class="{ active: shuffleOn }"
        :disabled="!currentTrack"
        aria-label="Toggle shuffle"
        @click="toggleShuffle"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
      </button>

      <button class="icon-button" type="button" :disabled="!currentTrack" :aria-label="muted ? 'Unmute' : 'Mute'" @click="toggleMute">
        <svg v-if="!muted" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
          <path d="M14.5 8.5a4.5 4.5 0 0 1 0 7" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
          <line x1="16" y1="9" x2="21" y2="15" />
          <line x1="21" y1="9" x2="16" y2="15" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: min(340px, calc(100vw - 32px));

  background: #2f714a;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(32, 57, 42, 0.32);

  display: flex;
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
