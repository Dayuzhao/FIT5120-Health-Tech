<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { imageUrl, licenseLabel } from '@/services/species'

// Pop-up shown right after a completion that earned a collectible.
//
// `drawn` are the species unlocked just now; `pending` counts collectibles owed
// but not drawn yet because the species list could not be fetched (offline) —
// the user keeps them and meets them in the collection later.
//
// Deliberately short and calm: a photo, a congratulation and the name. The fact
// and the full photo credit live in the collection's detail view. A short fade,
// no spinning/flipping/shaking reveal, no rarity styling, no sound. The draw
// already happened before this opens, so the dialog only reports the result. A
// few slow leaves drift past as decoration and are switched off for users who
// prefer reduced motion.
const props = defineProps({
  drawn: { type: Array, default: () => [] },
  pending: { type: Number, default: 0 },
})

const dialog = ref(null)
const index = ref(0)
const closed = ref(false)
const brokenImages = ref({})

const species = computed(() => props.drawn[index.value] ?? null)
const hasMore = computed(() => index.value < props.drawn.length - 1)

const noteText = computed(() => {
  if (props.drawn.length === 1) return `New collectible: ${props.drawn[0].commonName}`
  if (props.drawn.length > 1) return `${props.drawn.length} new collectibles`
  return 'A collectible is waiting for you'
})

function lockScroll(locked) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

function open() {
  const el = dialog.value

  if (!el) return

  // Native modal dialog: traps focus, closes on Escape, and makes the page
  // behind it inert. The attribute is a fallback for browsers without showModal.
  if (typeof el.showModal === 'function') {
    el.showModal()
  } else {
    el.setAttribute('open', '')
  }

  lockScroll(true)
}

function close() {
  dialog.value?.close()
}

// Runs for every way of closing (button, Escape, backdrop). The browser returns
// focus to the element that had it before the dialog opened.
function onClosed() {
  lockScroll(false)
  closed.value = true
}

// Clicks outside the panel land on the dialog element itself (its backdrop).
function onBackdropClick(event) {
  if (event.target === dialog.value) {
    close()
  }
}

onMounted(open)
onBeforeUnmount(() => lockScroll(false))
</script>

<template>
  <div class="unlock-root">
    <dialog
      ref="dialog"
      class="unlock-dialog"
      aria-labelledby="unlock-title"
      @close="onClosed"
      @click="onBackdropClick"
    >
      <div class="leaves" aria-hidden="true">
        <span v-for="n in 6" :key="n" class="leaf" :class="`leaf-${n}`">🍃</span>
      </div>

      <div class="panel">
        <button type="button" class="close-button" aria-label="Close" @click="close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <template v-if="species">
          <div class="photo-frame">
            <img
              v-if="!brokenImages[species.scientificName]"
              class="photo"
              :src="imageUrl(species.image, 'medium')"
              :alt="species.commonName"
              @error="brokenImages[species.scientificName] = true"
            />
            <div v-else class="photo photo-missing" aria-hidden="true">🍃</div>
          </div>

          <h2 id="unlock-title">Congratulations!</h2>
          <p class="species-name">{{ species.commonName }}</p>

          <!-- Smallest credit the photo licences allow: creator and licence, both linked. -->
          <p class="credit">
            Photo:
            <a :href="species.image.sourceUrl" target="_blank" rel="noopener">{{ species.image.creator }}</a>
            ·
            <a :href="species.image.licenseUrl" target="_blank" rel="noopener">{{ licenseLabel(species.image.licenseUrl) }}</a>
          </p>

          <p v-if="drawn.length > 1" class="counter">{{ index + 1 }} of {{ drawn.length }}</p>
        </template>

        <!-- Owed but not drawn yet (offline): nothing is lost, it is just waiting. -->
        <template v-else>
          <div class="photo-frame">
            <div class="photo photo-missing" aria-hidden="true">🍃</div>
          </div>

          <h2 id="unlock-title">Congratulations!</h2>
          <p class="species-name">A new collectible is yours</p>
          <p class="hint">Open your collection when you are online to meet it.</p>
        </template>

        <div class="actions">
          <button v-if="hasMore" type="button" class="primary-button" @click="index += 1">
            Next
          </button>
          <RouterLink v-else to="/collection" class="primary-button">See my collection</RouterLink>
        </div>
      </div>
    </dialog>

    <!-- After the dialog is dismissed, keep a way back to the collection. -->
    <RouterLink v-if="closed" to="/collection" class="unlock-note">
      <span aria-hidden="true">🍃</span>
      {{ noteText }} · See my collection
    </RouterLink>
  </div>
</template>

<style scoped>
.unlock-root {
  margin-top: 24px;
  text-align: center;
}

.unlock-dialog {
  position: fixed;
  inset: 0;
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 24px;
  background: #fbfdfb;
  color: #20392a;
  box-shadow: 0 24px 60px rgba(32, 57, 42, 0.35);
}

.unlock-dialog[open] {
  display: flex;
  animation: dialog-in 220ms ease-out;
}

.unlock-dialog::backdrop {
  background: rgba(32, 57, 42, 0.5);
  animation: backdrop-in 220ms ease-out;
}

.panel {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 18px 18px 22px;
  overflow-y: auto;
  text-align: center;
}

.close-button {
  position: absolute;
  top: 26px;
  right: 26px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #20392a;
  box-shadow: 0 2px 8px rgba(32, 57, 42, 0.22);
  cursor: pointer;
}

.photo-frame {
  padding: 6px;
  border-radius: 20px;
  background: linear-gradient(160deg, #e3efe6, #f3f8f1);
}

.photo {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 15px;
  background: #e5ece6;
  object-fit: cover;
}

.photo-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
}

h2 {
  margin: 18px 0 0;
  color: #20392a;
  font-size: 26px;
  line-height: 1.2;
}

.species-name {
  margin: 4px 0 0;
  color: #2f714a;
  font-size: 20px;
  font-weight: 700;
}

.hint {
  margin: 6px 0 0;
  color: #68736c;
  font-size: 14px;
  line-height: 1.5;
}

.credit {
  margin: 10px 0 0;
  color: #879088;
  font-size: 12px;
}

.credit a {
  color: #5d856a;
}

.counter {
  margin: 8px 0 0;
  color: #879088;
  font-size: 13px;
}

.actions {
  margin-top: 18px;
}

.primary-button {
  display: inline-block;
  padding: 12px 28px;
  border: 0;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 160ms ease;
}

.primary-button:hover {
  background: #386548;
}

.close-button:focus-visible,
.primary-button:focus-visible,
.unlock-note:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 3px;
}

.unlock-note {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 999px;
  background: #eaf3ec;
  color: #386548;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.unlock-note:hover {
  background: #dcebe0;
}

/* Decoration only: a few leaves drifting down very slowly behind the content. */
.leaves {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.leaf {
  position: absolute;
  top: -30px;
  font-size: 20px;
  opacity: 0.5;
  animation: drift 12s linear infinite;
}

.leaf-1 { left: 8%;  animation-duration: 13s; animation-delay: 0s; }
.leaf-2 { left: 24%; animation-duration: 16s; animation-delay: 3s; font-size: 16px; }
.leaf-3 { left: 42%; animation-duration: 14s; animation-delay: 6s; }
.leaf-4 { left: 60%; animation-duration: 17s; animation-delay: 1.5s; font-size: 16px; }
.leaf-5 { left: 76%; animation-duration: 15s; animation-delay: 4.5s; }
.leaf-6 { left: 90%; animation-duration: 18s; animation-delay: 8s; font-size: 14px; }

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes drift {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }

  50% {
    transform: translate(16px, 200px) rotate(120deg);
  }

  100% {
    transform: translate(-8px, 440px) rotate(240deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .unlock-dialog[open],
  .unlock-dialog::backdrop {
    animation: none;
  }

  .leaves {
    display: none;
  }

  .primary-button {
    transition: none;
  }
}

@media (max-width: 480px) {
  h2 {
    font-size: 24px;
  }
}
</style>
