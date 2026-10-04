<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

const emit = defineEmits([
  'back',
  'complete',
])

const symbols = [
  '🌿',
  '🌸',
  '🍄',
  '🍃',
]

const cards = ref([])

const firstCard = ref(null)
const boardLocked = ref(false)

const matchedPairs = ref(0)

const totalPairs = symbols.length

let flipTimer = null
let tapSound = null

const playTapSound = () => {
  if (!tapSound) {
    return
  }

  tapSound.currentTime = 0

  tapSound.play().catch(() => {})
}

const shuffle = (items) => {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))

    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }

  return result
}

const createCards = () => {
  const pairCards = symbols.flatMap((symbol) => [
    {
      id: `${symbol}-1`,
      symbol,
      flipped: false,
      matched: false,
    },
    {
      id: `${symbol}-2`,
      symbol,
      flipped: false,
      matched: false,
    },
  ])

  cards.value = shuffle(pairCards)
}

const progressText = computed(() => {
  return `${matchedPairs.value} / ${totalPairs} pairs found`
})

const selectCard = (card) => {
  if (
    boardLocked.value ||
    card.flipped ||
    card.matched
  ) {
    return
  }

  playTapSound()
  card.flipped = true

  if (!firstCard.value) {
    firstCard.value = card
    return
}

const previousCard = firstCard.value

  if (previousCard.symbol === card.symbol) {
    previousCard.matched = true
    card.matched = true

    matchedPairs.value += 1
    firstCard.value = null

    if (matchedPairs.value === totalPairs) {
      emit('complete')
    }

    return
  }

  boardLocked.value = true

  flipTimer = setTimeout(() => {
    previousCard.flipped = false
    card.flipped = false

    firstCard.value = null
    boardLocked.value = false
  }, 700)
}

const resetGame = () => {
  if (flipTimer) {
    clearTimeout(flipTimer)
    flipTimer = null
  }

  firstCard.value = null
  boardLocked.value = false
  matchedPairs.value = 0

  createCards()
}

createCards()

onMounted(() => {
  tapSound = new Audio('/audio/leaf-tap.mp3')

  tapSound.volume = 0.5
  tapSound.preload = 'auto'
})

onBeforeUnmount(() => {
  if (flipTimer) {
    clearTimeout(flipTimer)
  }

  if (tapSound) {
    tapSound.pause()
  }
})
</script>

<template>
  <div class="nature-match">
    <div class="match-header">
      <div>
        <p class="game-label">
          NATURE MATCH
        </p>

        <h2>
          Find the matching pairs.
        </h2>

        <p>
          Turn over two cards at a time.
          Take your time — there is nothing to win or lose.
        </p>
      </div>

      <p class="pair-progress">
        {{ progressText }}
      </p>
    </div>

    <div
      class="match-grid"
      aria-label="Nature Match cards"
    >
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="match-card"
        :class="{
          'card-revealed': card.flipped || card.matched,
          'card-matched': card.matched,
        }"
        :aria-label="
          card.flipped || card.matched
            ? `Nature card ${card.symbol}`
            : 'Hidden nature card'
        "
        @click="selectCard(card)"
      >
        <span
          v-if="card.flipped || card.matched"
          class="card-symbol"
          aria-hidden="true"
        >
          {{ card.symbol }}
        </span>

        <span
          v-else
          class="card-back"
          aria-hidden="true"
        >
          ❧
        </span>
      </button>
    </div>

    <div class="match-actions">
      <button
        type="button"
        class="secondary-button"
        @click="emit('back')"
      >
        ← Back to games
      </button>

      <button
        type="button"
        class="secondary-button"
        @click="resetGame"
      >
        Shuffle again
      </button>
    </div>
  </div>
</template>

<style scoped>
.nature-match {
  min-height: 520px;

  padding: 36px 40px;

  border: 1px solid rgba(74, 111, 83, 0.12);
  border-radius: 30px;

  background:
    radial-gradient(
      circle at 80% 15%,
      rgba(230, 241, 213, 0.72),
      transparent 32%
    ),
    rgba(255, 255, 255, 0.88);

  box-shadow:
    0 24px 60px
    rgba(53, 78, 60, 0.08);
}

.match-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 30px;
}

.game-label {
  margin: 0 0 10px;

  color: #789082;

  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

.match-header h2 {
  margin: 0;

  color: #294433;

  font-size: 28px;
}

.match-header > div > p:not(.game-label) {
  max-width: 520px;

  margin: 12px 0 0;

  color: #707c74;

  line-height: 1.65;
}

.pair-progress {
  margin: 0;

  padding: 8px 13px;

  border-radius: 999px;

  background: #e7f0e8;
  color: #55705d;

  font-size: 13px;
  font-weight: 600;

  white-space: nowrap;
}

.match-grid {
  width: min(100%, 600px);

  display: grid;
  grid-template-columns: repeat(4, 1fr);

  gap: 14px;

  margin: 38px auto 0;
}

.match-card {
  aspect-ratio: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid rgba(71, 118, 90, 0.16);
  border-radius: 20px;

  background: #dfece1;
  color: #47765a;

  cursor: pointer;

  box-shadow:
    0 8px 20px
    rgba(53, 78, 60, 0.06);

  transition:
    transform 180ms ease,
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.match-card:hover {
  transform: translateY(-2px);

  box-shadow:
    0 12px 26px
    rgba(53, 78, 60, 0.1);
}

.match-card:focus-visible {
  outline: 3px solid rgba(71, 118, 90, 0.28);
  outline-offset: 3px;
}

.match-card.card-revealed {
  background: #ffffff;

  border-color: rgba(71, 118, 90, 0.24);
}

.match-card.card-matched {
  background: #f1f7ef;

  border-color: #bfd5c3;
}

.card-symbol {
  font-size: clamp(30px, 4vw, 44px);
}

.card-back {
  color: #789b81;

  font-size: 34px;
}

.match-actions {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 18px;

  margin-top: 30px;
}

.secondary-button {
  padding: 10px 18px;

  border: 1px solid #c6d9ca;
  border-radius: 999px;

  background: transparent;
  color: #47765a;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
}

.secondary-button:hover {
  background: #edf5ee;
}

@media (max-width: 700px) {
  .nature-match {
    min-height: auto;

    padding: 28px 20px;
  }

  .match-header {
    flex-direction: column;

    gap: 16px;
  }

  .match-grid {
    grid-template-columns: repeat(2, 1fr);

    max-width: 330px;
  }

  .match-actions {
    flex-direction: column;
  }

  .secondary-button {
    width: 100%;
  }
}
</style>