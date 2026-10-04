<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PhotoCredit from '@/components/PhotoCredit.vue'
import UnlockProgress from '@/components/UnlockProgress.vue'
import { drawOwedCollectibles, listCollectibles } from '@/services/collectibles'
import { getCompletionCount } from '@/services/progress'
import { fetchSpecies, imagePosition, imageUrl, licenseLabel } from '@/services/species'

// One page for "how am I doing" and "what have I collected".
//
// The summary (pauses taken + progress to the next collectible) reads only this
// device, so it renders offline. The collection needs the species list from the
// hosted database for names, photos and facts, so it loads on its own and shows
// its own message when it cannot — which kind of collectibles the user has stays
// safe on the device either way. There is deliberately no score, streak, rating
// or comparison with other people anywhere on this page.

// ---------- summary ----------
const count = ref(0)
const loading = ref(true)
const failed = ref(false)

const hasPauses = computed(() => count.value > 0)

async function loadSummary() {
  try {
    count.value = await getCompletionCount()
  } catch (error) {
    console.error('Unable to read progress:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

// ---------- collection ----------
const status = ref('loading') // 'loading' | 'ready' | 'unavailable' | 'error'
const total = ref(0)
const unlocked = ref([]) // species objects, newest unlock first
const savedCount = ref(null)

const selected = ref(null)
const brokenImages = ref({})
const closeButton = ref(null)
const dialog = ref(null)
let opener = null

const lockedCount = computed(() => Math.max(0, total.value - unlocked.value.length))
const allCollected = computed(
  () => status.value === 'ready' && total.value > 0 && unlocked.value.length >= total.value,
)

async function loadCollection() {
  status.value = 'loading'

  let species

  try {
    species = await fetchSpecies()
  } catch (error) {
    // Expected and handled (offline, or the API not deployed yet): a warning, not an error.
    console.warn('Unable to load the species list:', error)

    try {
      savedCount.value = (await listCollectibles()).length
    } catch {
      savedCount.value = null
    }

    status.value = 'unavailable'
    return
  }

  try {
    // Top up anything owed that could not be drawn while offline.
    await drawOwedCollectibles()

    const bySpecies = new Map(species.map((item) => [item.scientificName, item]))
    const rows = await listCollectibles()

    unlocked.value = rows.map((row) => bySpecies.get(row.scientificName)).filter(Boolean)
    total.value = species.length
    status.value = 'ready'
  } catch (error) {
    console.error('Unable to read the collection:', error)
    status.value = 'error'
  }
}

function openDetail(species, event) {
  opener = event.currentTarget
  selected.value = species
  document.body.style.overflow = 'hidden'
  nextTick(() => closeButton.value?.focus())
}

function closeDetail() {
  selected.value = null
  document.body.style.overflow = ''
  opener?.focus()
  opener = null
}

// Keep Tab inside the open dialog.
function trapFocus(event) {
  if (event.key !== 'Tab' || !dialog.value) return

  const focusable = dialog.value.querySelectorAll('button, a[href]')
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  loadSummary()
  loadCollection()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <main class="progress-page">
    <header class="progress-header">
      <p class="eyebrow">YOUR PROGRESS</p>
      <h1 v-if="!loading && !failed">
        {{ hasPauses ? 'Every pause counts' : 'Your first pause is waiting' }}
      </h1>
    </header>

    <div class="summary-grid" :class="{ 'is-aligned': hasPauses }">
      <div v-if="loading" class="stat-card stat-wide state-message">
        <div class="loading-circle"></div>
        <p>Looking at your pauses…</p>
      </div>

      <div v-else-if="failed" class="stat-card stat-wide state-message">
        <p>
          We could not read your progress on this device right now. It is
          still saved — please try again in a moment.
        </p>
      </div>

      <template v-else>
        <!-- Pauses taken. With none yet: an encouraging message and a hint, not a bare zero. -->
        <article class="stat-card">
          <template v-if="hasPauses">
            <div class="count-block" aria-live="polite">
              <span class="count-number">{{ count }}</span>
              <span class="count-label">{{ count === 1 ? 'pause taken' : 'pauses taken' }}</span>
            </div>

            <p class="note">
              Finished tasks and finished rounds of Leaf Tap both count.
            </p>
          </template>

          <template v-else>
            <p class="intro">
              There is nothing to chase here. Finish one short task, or one
              round of Leaf Tap, and it will show up on this page.
            </p>

            <div class="actions">
              <RouterLink to="/urge" class="primary-button">Try a short task</RouterLink>
              <RouterLink to="/play" class="secondary-button">Play Leaf Tap</RouterLink>
            </div>
          </template>
        </article>

        <!-- How close the next collectible is. -->
        <article class="stat-card">
          <UnlockProgress :pauses="count" :all-collected="allCollected" />
        </article>
      </template>
    </div>

    <section class="collection" aria-labelledby="collection-title">
      <h2 id="collection-title">Your collection</h2>
      <p class="collection-intro">
        Animals you unlock by taking pauses. They stay yours, whatever happens next.
      </p>
      <p v-if="status === 'ready'" class="count-line">
        <template v-if="unlocked.length > 0">{{ unlocked.length }} of {{ total }} collected</template>
        <template v-else>{{ total }} animals are waiting to be met</template>
      </p>

      <div v-if="status === 'loading'" class="state-card">
        <div class="loading-circle"></div>
        <p>Opening your collection…</p>
      </div>

      <div v-else-if="status === 'unavailable'" class="state-card" role="status">
        <p>
          The collection needs a connection to load. Your collectibles are safe
          on this device<template v-if="savedCount"> ({{ savedCount }} saved)</template>.
        </p>
        <button type="button" class="retry-button" @click="loadCollection">Try again</button>
      </div>

      <div v-else-if="status === 'error'" class="state-card" role="status">
        <p>We could not read your collection on this device right now.</p>
        <button type="button" class="retry-button" @click="loadCollection">Try again</button>
      </div>

      <template v-else>
        <ul v-if="unlocked.length > 0" class="grid">
          <li v-for="species in unlocked" :key="species.scientificName">
            <button type="button" class="tile" @click="openDetail(species, $event)">
              <img
                v-if="!brokenImages[species.scientificName]"
                class="tile-photo"
                :src="imageUrl(species.image, 'small')"
                :style="{ objectPosition: imagePosition(species.image) }"
                :alt="species.commonName"
                loading="lazy"
                @error="brokenImages[species.scientificName] = true"
              />
              <span v-else class="tile-photo tile-photo-missing" aria-hidden="true">🍃</span>
              <span class="tile-name">{{ species.commonName }}</span>
            </button>
          </li>

        </ul>

        <!-- Small on purpose: 61 full-size slots would make this page several screens long. -->
        <ul v-if="lockedCount > 0" class="locked-grid" aria-hidden="true">
          <li v-for="n in lockedCount" :key="`locked-${n}`">
            <div class="tile-locked">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
          </li>
        </ul>

        <p v-if="lockedCount > 0" class="visually-hidden">
          {{ lockedCount }} more collectibles to discover.
        </p>

        <p v-if="unlocked.length > 0" class="grid-credit">
          Open a collectible to see its photo credit and the source of its fact.
        </p>
      </template>
    </section>

    <!-- Detail of one unlocked collectible -->
    <div
      v-if="selected"
      class="overlay"
      @click.self="closeDetail"
      @keydown.esc="closeDetail"
      @keydown="trapFocus"
    >
      <div
        ref="dialog"
        class="dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="selected.commonName"
      >
        <button ref="closeButton" type="button" class="close-button" @click="closeDetail">
          Close
        </button>

        <img
          v-if="!brokenImages[selected.scientificName]"
          class="dialog-photo"
          :src="imageUrl(selected.image, 'medium')"
          :style="{ objectPosition: imagePosition(selected.image) }"
          :alt="selected.commonName"
          @error="brokenImages[selected.scientificName] = true"
        />
        <div v-else class="dialog-photo tile-photo-missing" aria-hidden="true">🍃</div>

        <h2>{{ selected.commonName }}</h2>
        <p class="scientific">{{ selected.scientificName }}</p>

        <p class="fact">{{ selected.fact.text }}</p>
        <p class="fact-credit">
          Adapted from
          <a :href="selected.fact.sourceUrl" target="_blank" rel="noopener">Wikipedia</a>
          ·
          <a :href="selected.fact.licenseUrl" target="_blank" rel="noopener">{{ licenseLabel(selected.fact.licenseUrl) }}</a>
        </p>

        <PhotoCredit :image="selected.image" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.progress-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

/* ---------- summary: two cards side by side ---------- */
.progress-header {
  margin-bottom: 22px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 12px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.15;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 26px 28px;
  border: 1px solid #e2e9e4;
  border-radius: 22px;
  background: white;
  text-align: center;
}

.stat-wide {
  grid-column: 1 / -1;
}

/* With numbers in both cards, line the numbers up instead of centring each card's content. */
.is-aligned .stat-card {
  justify-content: flex-start;
}

.intro {
  max-width: 360px;
  margin: 0;
  color: #68736c;
  font-size: 16px;
  line-height: 1.65;
}

.count-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.count-number {
  color: #2f714a;
  font-size: clamp(52px, 8vw, 68px);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.count-label {
  margin-top: 10px;
  color: #5d856a;
  font-size: 16px;
  font-weight: 600;
}

.note {
  margin: 12px 0 0;
  color: #879088;
  font-size: 13px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 18px;
}

/* ---------- collection ---------- */
.collection {
  margin-top: 48px;
}

.collection h2 {
  margin: 0;
  color: #20392a;
  font-size: clamp(26px, 3.4vw, 34px);
  line-height: 1.2;
}

.collection-intro {
  margin: 10px 0 0;
  color: #68736c;
  font-size: 16px;
  line-height: 1.6;
}

.count-line {
  margin: 12px 0 18px;
  color: #2f714a;
  font-size: 15px;
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e9e4;
  border-radius: 16px;
  background: white;
  color: #20392a;
  font: inherit;
  text-align: left;
}

button.tile {
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease;
}

button.tile:hover {
  border-color: #b8cdbd;
  transform: translateY(-2px);
}

.tile-photo {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  background: #e5ece6;
  object-fit: cover;
}

.tile-photo-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
}

.tile-name {
  padding: 8px 2px 2px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

/* Neutral on purpose: no silhouette or name that would hint at what is locked. */
.locked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.grid + .locked-grid {
  margin-top: 16px;
}

.tile-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 1px dashed #d5e0d8;
  border-radius: 12px;
  background: #eef3ef;
  color: #a7b5ab;
}

.grid-credit {
  margin: 20px 0 0;
  color: #879088;
  font-size: 13px;
}

/* ---------- states ---------- */
.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: #68736c;
  line-height: 1.6;
}

.state-message p {
  margin: 0;
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
  padding: 22px;
  border: 1px solid #e2e9e4;
  border-radius: 18px;
  background: white;
  color: #68736c;
  line-height: 1.6;
}

.state-card p {
  margin: 0;
}

.loading-circle {
  width: 30px;
  height: 30px;
  border: 3px solid #dce7df;
  border-top-color: #5d856a;
  border-radius: 50%;
  animation: spin 900ms linear infinite;
}

/* ---------- buttons ---------- */
.primary-button,
.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 12px 24px;
  border: 0;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.primary-button:hover,
.retry-button:hover {
  background: #386548;
  transform: translateY(-1px);
}

.secondary-button {
  color: #47765a;
  font-weight: 600;
  text-decoration: none;
}

.secondary-button:hover {
  text-decoration: underline;
}

.primary-button:focus-visible,
.secondary-button:focus-visible,
.retry-button:focus-visible,
.tile:focus-visible,
.close-button:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 3px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---------- detail dialog ---------- */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(32, 57, 42, 0.55);
}

.dialog {
  position: relative;
  width: 100%;
  max-width: 460px;
  max-height: 100%;
  padding: 20px 20px 22px;
  overflow-y: auto;
  border-radius: 22px;
  background: white;
}

.close-button {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 8px 16px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #20392a;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(32, 57, 42, 0.2);
  cursor: pointer;
}

.dialog-photo {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  background: #e5ece6;
  object-fit: cover;
}

.dialog h2 {
  margin: 16px 0 0;
  color: #20392a;
  font-size: 24px;
}

.scientific {
  margin: 2px 0 12px;
  color: #6b7c71;
  font-size: 14px;
  font-style: italic;
}

.fact {
  margin: 0 0 6px;
  color: #3f5547;
  font-size: 16px;
  line-height: 1.65;
}

.fact-credit {
  margin: 0 0 12px;
  color: #879088;
  font-size: 12px;
}

.fact-credit a {
  color: #5d856a;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-circle {
    animation: none;
  }

  .primary-button,
  .retry-button,
  button.tile {
    transition: none;
  }
}

@media (max-width: 700px) {
  .progress-page {
    padding: 42px 20px 32px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .stat-card {
    padding: 22px 20px;
    border-radius: 20px;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .collection {
    margin-top: 36px;
  }

  .grid {
    gap: 10px;
  }
}
</style>
