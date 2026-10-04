<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CollectibleUnlockDialog from '@/components/CollectibleUnlockDialog.vue'
import { drawOwedCollectibles } from '@/services/collectibles'
import { recordGameCompletion } from '@/services/progress'
import NatureMatchGame from '@/components/NatureMatchGame.vue'

const gameStarted = ref(false)
const gameComplete = ref(false)
const selectedGame = ref(null)

// Collectible earned by finishing this round, if it reached a milestone.
const unlock = ref({ drawn: [], pending: 0 })
const hasUnlock = computed(() => unlock.value.drawn.length > 0 || unlock.value.pending > 0)

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

const startLeafTap = () => {
  selectedGame.value = 'leaf-tap'

  gameStarted.value = true
  gameComplete.value = false

  unlock.value = {
    drawn: [],
    pending: 0,
  }

  tapCount.value = 0
  leafVisible.value = true

  setNewLeafPosition()
}

const openNatureMatch = () => {
  selectedGame.value = 'nature-match'

  gameStarted.value = false
  gameComplete.value = false

  unlock.value = {
    drawn: [],
    pending: 0,
  }
}

const backToGameSelection = () => {
  selectedGame.value = null

  gameStarted.value = false
  gameComplete.value = false

  if (leafTimer) {
    clearTimeout(leafTimer)
    leafTimer = null
  }
}

const playTapSound = () => {
  if (!tapSound) {
    return
  }

  tapSound.currentTime = 0
  tapSound.play().catch(() => {})
}

const handleGameCompletion = () => {
  unlock.value = {
    drawn: [],
    pending: 0,
  }

  recordGameCompletion()
    .then(drawOwedCollectibles)
    .then((result) => {
      unlock.value = result
    })
    .catch((error) => {
      console.error(
        'Unable to record game completion:',
        error,
      )
    })
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

      handleGameCompletion()

      return
    }

    setNewLeafPosition()
    leafVisible.value = true
  }, 140)
}

const playAgain = () => {
  startLeafTap()
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
      <!-- Game selection -->
      <div
        v-if="!selectedGame"
        class="game-selection"
      >
        <!-- Leaf Tap -->
        <article class="game-option-card">
          <div class="game-option-visual leaf-option">
            <span aria-hidden="true">
              🍃
            </span>
          </div>

          <div class="game-option-copy">
            <p class="game-label">
              LEAF TAP
            </p>

            <h2>
              A gentle distraction
            </h2>

            <p>
              Tap leaves as they appear. There is no score,
              ranking or pressure to perform.
            </p>

            <button
              class="start-game-button"
              type="button"
              @click="startLeafTap"
            >
              Start Leaf Tap
            </button>
          </div>
        </article>

        <!-- Nature Match -->
        <article class="game-option-card">
          <div class="game-option-visual match-option">
            <div
              class="match-preview"
              aria-hidden="true"
            >
              <span>🌿</span>
              <span>🌸</span>
              <span>🍄</span>
              <span>🍃</span>
            </div>
          </div>

          <div class="game-option-copy">
            <p class="game-label">
              NATURE MATCH
            </p>

            <h2>
              Find the matching pairs
            </h2>

            <p>
              Turn over simple nature cards and find each pair.
              Take your time — there is nothing to win or lose.
            </p>

            <button
              class="start-game-button"
              type="button"
              @click="openNatureMatch"
            >
              Start Nature Match
            </button>
          </div>
        </article>
      </div>

      <!-- Leaf Tap -->
      <div
        v-else-if="selectedGame === 'leaf-tap'"
        class="play-area"
      >
        <!-- Playing -->
        <template v-if="!gameComplete">
          <div class="play-message">
            <p class="game-label">
              LEAF TAP
            </p>

            <h2>
              Tap the leaves when they appear.
            </h2>

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
          <p class="game-label">
            A SMALL PAUSE
          </p>

          <h2>
            You took a moment.
          </h2>

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

      <!-- Nature Match placeholder -->
      <NatureMatchGame
        v-else
        @back="backToGameSelection"
        @complete="handleGameCompletion"
      />

      <CollectibleUnlockDialog
        v-if="selectedGame && hasUnlock"
        class="game-unlock"
        :drawn="unlock.drawn"
        :pending="unlock.pending"
      />
    </section>

    <RouterLink
      v-if="!selectedGame"
      to="/"
      class="back-link"
    >
      ← Back to home
    </RouterLink>

    <button
      v-else-if="
        selectedGame === 'leaf-tap' &&
        !gameComplete
      "
      type="button"
      class="back-link back-button"
      @click="backToGameSelection"
    >
      ← Back to games
    </button>
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

.game-unlock {
  max-width: 560px;
  margin: 24px auto 0;
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

.game-selection {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 24px;
}

.game-option-card {
  overflow: hidden;

  border: 1px solid rgba(74, 111, 83, 0.12);
  border-radius: 28px;

  background: rgba(255, 255, 255, 0.88);

  box-shadow:
    0 20px 48px
    rgba(53, 78, 60, 0.07);
}

.game-option-visual {
  min-height: 210px;

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

.game-option-visual > span {
  font-size: 76px;
}

.game-option-copy {
  padding: 34px;
}

.game-option-copy h2 {
  margin: 0 0 14px;

  color: #294433;

  font-size: 25px;
}

.game-option-copy > p:not(.game-label) {
  min-height: 82px;

  margin: 0 0 24px;

  color: #707c74;

  line-height: 1.7;
}

.match-preview {
  display: grid;
  grid-template-columns: repeat(2, 64px);

  gap: 10px;
}

.match-preview span {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 64px;
  height: 64px;

  border: 1px solid rgba(71, 118, 90, 0.12);
  border-radius: 16px;

  background: rgba(255, 255, 255, 0.74);

  font-size: 30px;

  box-shadow:
    0 8px 20px
    rgba(53, 78, 60, 0.06);
}

.nature-placeholder {
  min-height: 430px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 40px;

  border: 1px solid rgba(74, 111, 83, 0.12);
  border-radius: 30px;

  background: rgba(255, 255, 255, 0.88);

  text-align: center;

  box-shadow:
    0 24px 60px
    rgba(53, 78, 60, 0.08);
}

.nature-placeholder h2 {
  margin: 0;

  color: #294433;

  font-size: 32px;
}

.nature-placeholder > p:not(.game-label) {
  max-width: 480px;

  margin: 16px auto 26px;

  color: #707c74;

  line-height: 1.7;
}

.back-button {
  padding: 0;

  border: 0;

  background: transparent;

  cursor: pointer;

  text-align: left;
}

@media (max-width: 760px) {
  .game-selection {
    grid-template-columns: 1fr;
  }

  .game-option-copy > p:not(.game-label) {
    min-height: 0;
  }

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