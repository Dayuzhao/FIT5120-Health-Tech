<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const gameStarted = ref(false)
const gameComplete = ref(false)

const leafX = ref(62)
const leafY = ref(55)
const leafVisible = ref(true)

const tapCount = ref(0)
const targetTaps = 8

let leafTimer = null
let tapSound = null

const randomPosition = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const setNewLeafPosition = () => {
  leafX.value = randomPosition(20, 82)
  leafY.value = randomPosition(38, 82)
}

const startGame = () => {
  gameStarted.value = true
  gameComplete.value = false
  tapCount.value = 0
  leafVisible.value = true

  setNewLeafPosition()
}

const playTapSound = () => {
  if (!tapSound) {
    return
  }

  tapSound.currentTime = 0
  tapSound.play().catch(() => {})
}

const moveLeaf = () => {
  if (!leafVisible.value || gameComplete.value) {
    return
  }

  playTapSound()

  tapCount.value += 1
  leafVisible.value = false

  leafTimer = setTimeout(() => {
    if (tapCount.value >= targetTaps) {
      gameComplete.value = true
      return
    }

    setNewLeafPosition()
    leafVisible.value = true
  }, 140)
}

const playAgain = () => {
  startGame()
}

onMounted(() => {
  tapSound = new Audio('/audio/leaf-tap.mp3')
  tapSound.volume = 0.5
  tapSound.preload = 'auto'
})

onBeforeUnmount(() => {
  if (leafTimer) {
    clearTimeout(leafTimer)
  }

  if (tapSound) {
    tapSound.pause()
  }
})
</script>

<template>
  <main class="game-page">
    <section class="game-intro">
      <p class="eyebrow">QUICK BREAK</p>

      <h1>Take a small pause.</h1>

      <p class="intro">
        Tap into a short, low-pressure activity and give your attention
        somewhere else for a moment.
      </p>
    </section>

    <section class="game-area">
      <!-- Ready -->
      <div
        v-if="!gameStarted"
        class="game-card"
      >
        <div class="game-visual">
          <span class="leaf">🍃</span>
        </div>

        <div class="game-copy">
          <p class="game-label">LEAF TAP</p>

          <h2>A gentle distraction game</h2>

          <p>
            Tap leaves as they appear. There is no score,
            ranking or pressure to perform.
          </p>

          <button
            class="start-game-button"
            type="button"
            @click="startGame"
          >
            Start game
          </button>
        </div>
      </div>

      <!-- Playing / Complete -->
      <div
        v-else
        class="play-area"
      >
        <!-- Playing -->
        <template v-if="!gameComplete">
          <div class="play-message">
            <p class="game-label">LEAF TAP</p>

            <h2>Tap the leaves when they appear.</h2>

            <p>
              Take your time. There is nothing to win or lose.
            </p>
          </div>

          <button
            class="tap-leaf"
            :class="{ 'leaf-hidden': !leafVisible }"
            :style="{
              left: `${leafX}%`,
              top: `${leafY}%`,
            }"
            type="button"
            aria-label="Tap leaf"
            @click="moveLeaf"
          >
            🍃
          </button>
        </template>

        <!-- Complete -->
        <div
          v-else
          class="game-complete"
        >
          <p class="game-label">A SMALL PAUSE</p>

          <h2>You took a moment.</h2>

          <p>
            A few seconds of redirected attention can be enough.
            Continue when you feel ready.
          </p>

          <div class="complete-actions">
            <button
              class="start-game-button"
              type="button"
              @click="playAgain"
            >
              Play again
            </button>

            <RouterLink
              to="/"
              class="complete-link"
            >
              Back to home
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <RouterLink
      v-if="!gameComplete"
      to="/"
      class="back-link"
    >
      ← Back to home
    </RouterLink>
  </main>
</template>

<style scoped>
.game-complete {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 40px;

  text-align: center;
}

.game-complete h2 {
  margin: 0;

  color: #294433;

  font-size: clamp(32px, 4vw, 46px);
}

.game-complete > p:not(.game-label) {
  max-width: 520px;

  margin: 18px auto 0;

  color: #707c74;

  line-height: 1.7;
}

.complete-actions {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 20px;

  margin-top: 30px;
}

.complete-link {
  color: #47765a;

  font-weight: 600;
  text-decoration: none;
}

.complete-link:hover {
  text-decoration: underline;
}

.game-page {
  min-height: calc(100vh - 76px);
  padding: 80px 32px;

  background:
    radial-gradient(
      circle at 85% 18%,
      rgba(220, 235, 205, 0.7),
      transparent 28%
    ),
    #f7faf7;

  color: #20392a;
}

.game-intro,
.game-area,
.back-link {
  width: min(100%, 1050px);
  margin-left: auto;
  margin-right: auto;
}

.game-intro {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 52px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 16px;

  color: #66856f;

  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.2px;
}

h1 {
  margin: 0;

  font-size: clamp(44px, 6vw, 68px);
  font-weight: 600;
  line-height: 1.05;

  color: #20392a;
}

.intro {
  max-width: 620px;
  margin: 24px auto 0;

  color: #69766e;

  font-size: 17px;
  line-height: 1.7;
}

.game-card {
  display: grid;
  grid-template-columns: 1fr 1fr;

  min-height: 430px;

  overflow: hidden;

  border: 1px solid rgba(74, 111, 83, 0.12);
  border-radius: 30px;

  background: rgba(255, 255, 255, 0.88);

  box-shadow:
    0 24px 60px
    rgba(53, 78, 60, 0.08);
}

.game-visual {
  display: flex;
  align-items: center;
  justify-content: center;

  background:
    radial-gradient(
      circle,
      rgba(231, 241, 213, 0.95),
      rgba(224, 237, 226, 0.65)
    );
}

.leaf {
  font-size: 92px;
}

.game-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 54px;
}

.game-label {
  margin: 0 0 12px;

  color: #789082;

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

.game-copy h2 {
  margin: 0 0 18px;

  color: #294433;

  font-size: 30px;
}

.game-copy > p:not(.game-label) {
  margin: 0 0 28px;

  color: #707c74;

  line-height: 1.7;
}

.start-game-button {
  width: fit-content;

  padding: 14px 26px;

  border: none;
  border-radius: 999px;

  background: #47765a;
  color: white;

  font-size: 15px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.start-game-button:hover {
  background: #386548;

  transform: translateY(-2px);

  box-shadow:
    0 10px 24px
    rgba(54, 94, 68, 0.18);
}

.start-game-button:active {
  transform: translateY(0);
}

.start-game-button:focus-visible {
  outline: 3px solid rgba(71, 118, 90, 0.28);
  outline-offset: 4px;
}

.back-link {
  display: block;

  margin-top: 28px;

  color: #47765a;

  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

.play-area {
  position: relative;

  width: min(100%, 1050px);
  height: 520px;

  overflow: hidden;

  border: 1px solid rgba(74, 111, 83, 0.12);
  border-radius: 30px;

  background:
    radial-gradient(
      circle at 70% 20%,
      rgba(230, 241, 213, 0.72),
      transparent 30%
    ),
    rgba(255, 255, 255, 0.82);

  box-shadow:
    0 24px 60px
    rgba(53, 78, 60, 0.08);
}

.play-message {
  position: absolute;

  top: 34px;
  left: 40px;

  z-index: 2;

  max-width: 360px;
}

.play-message h2 {
  margin: 0 0 10px;

  color: #294433;

  font-size: 25px;
}

.play-message > p:not(.game-label) {
  margin: 0;

  color: #748078;

  line-height: 1.6;
}

.tap-leaf {
  position: absolute;

  border: none;
  padding: 0;

  background: transparent;

  font-size: 72px;

  cursor: pointer;

  transform:
    translate(-50%, -50%)
    scale(1);

  opacity: 1;

  transition:
    transform 140ms ease,
    opacity 140ms ease,
    filter 160ms ease;
}

.tap-leaf:hover {
  transform:
    translate(-50%, -50%)
    scale(1.08);

  filter:
    drop-shadow(
      0 8px 12px
      rgba(68, 107, 77, 0.16)
    );
}

.tap-leaf.leaf-hidden {
  opacity: 0;

  transform:
    translate(-50%, -50%)
    scale(0.72);

  pointer-events: none;
}

.tap-leaf:active {
  transform:
    translate(-50%, -50%)
    scale(0.94);
}

@media (max-width: 760px) {
  .game-page {
    padding: 55px 22px;
  }

  .game-card {
    grid-template-columns: 1fr;
  }

  .game-visual {
    min-height: 220px;
  }

  .game-copy {
    padding: 32px;
  }
}

@media (max-width: 600px) {
  .complete-actions {
    width: 100%;

    flex-direction: column;
  }

  .game-complete {
    padding: 28px;
  }
}
</style>