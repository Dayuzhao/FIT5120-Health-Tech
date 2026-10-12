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
const volume = ref(1)
const loading = ref(false)
const failed = ref(false)
const audioEl = ref(null) // the single <audio> element, assigned by MusicPlayer.vue
let audioContext = null
let lowPassFilter = null
let lowShelfFilter = null
let highShelfFilter = null
let outputGain = null
let interactionTimer = null
let typingTimer = null
let activeScene = 'default'

const sceneSettings = {
  default: { lowPass: 20000, lowShelf: 0, highShelf: 0, gain: 1 },
  game: { lowPass: 20000, lowShelf: 0, highShelf: 0, gain: 1.06 },
  urge: { lowPass: 20000, lowShelf: 0, highShelf: -3, gain: 1 },
}

function setAudioParam(param, value) {
  if (!param || !audioContext) return
  const now = audioContext.currentTime
  param.cancelScheduledValues(now)
  param.setTargetAtTime(value, now, 0.08)
}

function applyScene() {
  const settings = sceneSettings[activeScene] ?? sceneSettings.default
  setAudioParam(lowPassFilter?.frequency, settings.lowPass)
  setAudioParam(lowShelfFilter?.gain, settings.lowShelf)
  setAudioParam(highShelfFilter?.gain, settings.highShelf)
  setAudioParam(outputGain?.gain, settings.gain)
}

function initializeAudioEffects() {
  if (!audioEl.value || audioContext || typeof window === 'undefined') return
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  audioContext = new AudioContextClass()
  const source = audioContext.createMediaElementSource(audioEl.value)
  lowPassFilter = audioContext.createBiquadFilter()
  lowPassFilter.type = 'lowpass'
  lowPassFilter.frequency.value = 20000
  lowShelfFilter = audioContext.createBiquadFilter()
  lowShelfFilter.type = 'lowshelf'
  lowShelfFilter.frequency.value = 180
  highShelfFilter = audioContext.createBiquadFilter()
  highShelfFilter.type = 'highshelf'
  highShelfFilter.frequency.value = 3500
  outputGain = audioContext.createGain()

  source
    .connect(lowPassFilter)
    .connect(lowShelfFilter)
    .connect(highShelfFilter)
    .connect(outputGain)
    .connect(audioContext.destination)
  audioEl.value.volume = volume.value
  applyScene()
}

function setAudioScene(scene) {
  activeScene = scene
  clearTimeout(interactionTimer)
  clearTimeout(typingTimer)
  applyScene()
}

function modulateClick() {
  if (!lowPassFilter) return
  clearTimeout(interactionTimer)
  setAudioParam(lowPassFilter.frequency, 1900)
  interactionTimer = setTimeout(() => {
    const settings = sceneSettings[activeScene] ?? sceneSettings.default
    setAudioParam(lowPassFilter.frequency, settings.lowPass)
  }, 650)
}

function modulateTyping() {
  if (!lowShelfFilter) return
  clearTimeout(typingTimer)
  setAudioParam(lowShelfFilter.gain, -2.5)
  typingTimer = setTimeout(() => {
    const settings = sceneSettings[activeScene] ?? sceneSettings.default
    setAudioParam(lowShelfFilter.gain, settings.lowShelf)
  }, 350)
}

function setVolume(value) {
  volume.value = Number(value)
  if (audioEl.value) audioEl.value.volume = volume.value
}

const pool = computed(() =>
  activeCategory.value
    ? tracks.value.filter((t) => t.matchedTag === activeCategory.value)
    : tracks.value,
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

async function loadTracks() {
  if (tracks.value.length > 0 || loading.value) return
  loading.value = true
  failed.value = false
  try {
    tracks.value = await fetchTracks()
  } catch (error) {
    console.error('Unable to load tracks:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

function play() {
  isPlaying.value = true
  initializeAudioEffects()
  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch((error) => {
      console.error('Unable to resume music audio effects:', error)
    })
  }
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
    volume,
    loading,
    failed,
    audioEl,
    initializeAudioEffects,
    setAudioScene,
    modulateClick,
    modulateTyping,
    setVolume,
    loadTracks,
    play,
    pause,
    togglePlay,
    goNext,
    goPrevious,
    playCategory,
    toggleShuffle,
    toggleMute,
  }
}
