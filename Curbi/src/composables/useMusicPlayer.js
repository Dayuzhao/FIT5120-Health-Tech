// Shared background-music player state (Epic 6 / US6). A module-level
// singleton, not Pinia — the mini-player (MusicPlayer.vue, mounted once in
// App.vue above <RouterView>) and the "Set the atmosphere" picker page both
// need to control the same playback session, and this is the smallest thing
// that lets two separate places on the component tree agree on "what's
// playing right now" without introducing a state library.

import { ref, computed, nextTick } from 'vue'
import { fetchTracks } from '@/services/musicPlayer'

const tracks = ref([])
const activeCategory = ref(null) // 'chillout' | 'ambient' | 'lounge' | null (null = all tracks)
const currentIndex = ref(0) // index into `pool`, not into `tracks`
const shuffleOn = ref(false)
const bag = ref([]) // shuffle mode: indices (into pool) not yet played this round
const history = ref([]) // indices (into pool) played so far, for shuffle-mode "previous"
const isPlaying = ref(false)
const muted = ref(false)
const loading = ref(false)
const failed = ref(false)
const audioEl = ref(null) // the single <audio> element, assigned by MusicPlayer.vue

const BASE_VOLUME = 0.7
const GAME_VOLUME = 0.85
const NORMAL_FILTER_FREQUENCY = 6000
const MUFFLED_FILTER_FREQUENCY = 900

let audioContext = null
let sourceNode = null
let filterNode = null
let gainNode = null
let gameMode = false
let modulationTimer = null

const pool = computed(() =>
  activeCategory.value ? tracks.value.filter((t) => t.matchedTag === activeCategory.value) : tracks.value,
)
const currentTrack = computed(() => pool.value[currentIndex.value] ?? null)

function shuffleArray(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Excludes the current track so shuffle mode can't immediately repeat it.
function refillBag() {
  bag.value = shuffleArray(pool.value.map((_, i) => i).filter((i) => i !== currentIndex.value))
}

function ensureAudioGraph() {
  if (!audioEl.value || typeof window === 'undefined') return false

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return false

    audioContext = new AudioContextClass()
    sourceNode = audioContext.createMediaElementSource(audioEl.value)
    filterNode = audioContext.createBiquadFilter()
    gainNode = audioContext.createGain()

    // A low-pass filter keeps the music soft without making it sound thin.
    filterNode.type = 'lowpass'
    filterNode.frequency.value = NORMAL_FILTER_FREQUENCY
    filterNode.Q.value = 0.5
    gainNode.gain.value = BASE_VOLUME
    sourceNode.connect(filterNode).connect(gainNode).connect(audioContext.destination)
  }

  return true
}

function applyAudioMode() {
  if (!ensureAudioGraph()) return

  const now = audioContext.currentTime
  const targetVolume = gameMode ? GAME_VOLUME : BASE_VOLUME
  filterNode.frequency.cancelScheduledValues(now)
  filterNode.frequency.linearRampToValueAtTime(NORMAL_FILTER_FREQUENCY, now + 0.2)
  gainNode.gain.cancelScheduledValues(now)
  gainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.2)
}

function setGameMode(enabled) {
  gameMode = enabled
  applyAudioMode()
}

function modulateAudio(duration = 360) {
  if (!ensureAudioGraph()) return

  const now = audioContext.currentTime
  filterNode.frequency.cancelScheduledValues(now)
  filterNode.frequency.linearRampToValueAtTime(MUFFLED_FILTER_FREQUENCY, now + 0.05)
  clearTimeout(modulationTimer)
  modulationTimer = setTimeout(() => applyAudioMode(), duration)
}

async function loadTracks() {
  if (tracks.value.length > 0 || loading.value) return
  loading.value = true
  failed.value = false
  try {
    tracks.value = await fetchTracks()
    currentIndex.value = tracks.value.length ? Math.floor(Math.random() * tracks.value.length) : 0
    if (tracks.value.length > 0) {
      await nextTick()
      play()
    }
  } catch (error) {
    console.error('Unable to load tracks:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

function play() {
  ensureAudioGraph()
  if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {})
  applyAudioMode()
  isPlaying.value = true
  audioEl.value?.play().catch(() => {
    isPlaying.value = false
  })
}

function pause() {
  isPlaying.value = false
  audioEl.value?.pause()
}

function togglePlay() {
  if (isPlaying.value) pause()
  else play()
}

// Changing `src` on the <audio> element resets playback, so resuming after a
// track change needs an explicit play() call once Vue has applied the new
// `:src` binding (hence `await nextTick()`).
async function goNext() {
  if (pool.value.length === 0) return
  history.value.push(currentIndex.value)
  if (shuffleOn.value) {
    if (bag.value.length === 0) refillBag()
    currentIndex.value = bag.value.pop()
  } else {
    currentIndex.value = (currentIndex.value + 1) % pool.value.length
  }
  if (isPlaying.value) {
    await nextTick()
    audioEl.value?.play().catch(() => {})
  }
}

async function goPrevious() {
  if (pool.value.length === 0) return
  if (shuffleOn.value) {
    // Empty history (e.g. right after opening the app) is a no-op edge case.
    if (history.value.length > 0) currentIndex.value = history.value.pop()
  } else {
    currentIndex.value = (currentIndex.value - 1 + pool.value.length) % pool.value.length
  }
  if (isPlaying.value) {
    await nextTick()
    audioEl.value?.play().catch(() => {})
  }
}

// Switching mood/category always starts playback immediately (unlike
// toggling shuffle, which never interrupts what's already playing) — picking
// a card is a deliberate "play this now" action.
async function playCategory(tag) {
  activeCategory.value = tag
  history.value = []
  bag.value = []
  currentIndex.value = pool.value.length ? Math.floor(Math.random() * pool.value.length) : 0
  await nextTick()
  play()
}

function toggleShuffle() {
  shuffleOn.value = !shuffleOn.value
}

function toggleMute() {
  muted.value = !muted.value
}

export function useMusicPlayer() {
  return {
    tracks,
    activeCategory,
    pool,
    currentTrack,
    shuffleOn,
    isPlaying,
    muted,
    loading,
    failed,
    audioEl,
    loadTracks,
    play,
    pause,
    togglePlay,
    goNext,
    goPrevious,
    playCategory,
    toggleShuffle,
    toggleMute,
    setGameMode,
    modulateAudio,
  }
}
