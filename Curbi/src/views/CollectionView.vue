<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import PhotoCredit from '@/components/PhotoCredit.vue'
import { drawOwedCollectibles, listCollectibles } from '@/services/collectibles'
import { fetchSpecies, imageUrl, licenseLabel } from '@/services/species'

// The collection needs the species list from the hosted database to show names,
// photos and facts, so it requires a connection. Which collectibles the user has
// lives on this device and is safe either way.
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

async function load() {
  status.value = 'loading'

  let species

  try {
    species = await fetchSpecies()
  } catch (error) {
    console.error('Unable to load the species list:', error)

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

onMounted(load)
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <main class="collection-page">
    <RouterLink to="/progress" class="back-link">← My progress</RouterLink>

    <section class="collection-hero">
      <p class="eyebrow">YOUR COLLECTION</p>
      <h1>Collectibles</h1>
      <p class="intro">
        Animals you have unlocked by taking pauses. They stay yours, whatever
        happens next.
      </p>
      <p v-if="status === 'ready'" class="count-line">
        {{ unlocked.length }} of {{ total }} collected
      </p>
    </section>

    <div v-if="status === 'loading'" class="state-card">
      <div class="loading-circle"></div>
      <p>Opening your collection…</p>
    </div>

    <div v-else-if="status === 'unavailable'" class="state-card" role="status">
      <p>
        The collection needs a connection to load. Your collectibles are safe
        on this device<template v-if="savedCount"> ({{ savedCount }} saved)</template>.
      </p>
      <button type="button" class="retry-button" @click="load">Try again</button>
    </div>

    <div v-else-if="status === 'error'" class="state-card" role="status">
      <p>We could not read your collection on this device right now.</p>
      <button type="button" class="retry-button" @click="load">Try again</button>
    </div>

    <template v-else>
      <div v-if="unlocked.length === 0" class="state-card">
        <p>
          Your collection starts with your first pause. Finish a short task or
          a round of Leaf Tap and your first animal will be waiting here.
        </p>
        <div class="empty-actions">
          <RouterLink to="/urge" class="retry-button">Try a short task</RouterLink>
          <RouterLink to="/play" class="text-link">Play Leaf Tap</RouterLink>
        </div>
      </div>

      <ul class="grid">
        <li v-for="species in unlocked" :key="species.scientificName">
          <button type="button" class="tile" @click="openDetail(species, $event)">
            <img
              v-if="!brokenImages[species.scientificName]"
              class="tile-photo"
              :src="imageUrl(species.image, 'small')"
              :alt="species.commonName"
              loading="lazy"
              @error="brokenImages[species.scientificName] = true"
            />
            <span v-else class="tile-photo tile-photo-missing" aria-hidden="true">🍃</span>
            <span class="tile-name">{{ species.commonName }}</span>
          </button>
        </li>

        <li v-for="n in lockedCount" :key="`locked-${n}`" aria-hidden="true">
          <div class="tile tile-locked">
            <span class="tile-photo tile-photo-locked">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
          </div>
        </li>
      </ul>

      <p v-if="lockedCount > 0" class="visually-hidden">
        {{ lockedCount }} more collectibles to discover.
      </p>

      <p class="grid-credit">
        Open a collectible to see its photo credit and the source of its fact.
      </p>
    </template>

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
.collection-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 56px 32px 52px;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #47765a;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.collection-hero {
  max-width: 640px;
  margin-bottom: 28px;
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
  font-size: clamp(34px, 4vw, 46px);
  line-height: 1.15;
}

.intro {
  margin: 14px 0 0;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.count-line {
  margin: 14px 0 0;
  color: #2f714a;
  font-size: 15px;
  font-weight: 700;
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

.empty-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
}

.retry-button {
  display: inline-block;
  padding: 11px 22px;
  border: 0;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.retry-button:hover {
  background: #386548;
}

.text-link {
  color: #47765a;
  font-weight: 600;
  text-decoration: none;
}

.text-link:hover {
  text-decoration: underline;
}

.retry-button:focus-visible,
.text-link:focus-visible,
.back-link:focus-visible,
.tile:focus-visible,
.close-button:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 3px;
}

.loading-circle {
  width: 30px;
  height: 30px;
  border: 3px solid #dce7df;
  border-top-color: #5d856a;
  border-radius: 50%;
  animation: spin 900ms linear infinite;
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
.tile-locked {
  border-style: dashed;
  background: #f1f5f2;
}

.tile-photo-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8eee9;
  color: #a7b5ab;
}

.grid-credit {
  margin: 20px 0 0;
  color: #879088;
  font-size: 13px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

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

  button.tile {
    transition: none;
  }
}

@media (max-width: 700px) {
  .collection-page {
    padding: 40px 20px 36px;
  }

  .grid {
    gap: 10px;
  }
}
</style>
