<script setup>
import { computed, ref } from 'vue'
import PhotoCredit from '@/components/PhotoCredit.vue'
import { imageUrl } from '@/services/species'

// Shown right after a completion when it earned a collectible. `drawn` are the
// species unlocked just now; `pending` counts collectibles owed but not drawn
// yet because the species list could not be fetched (offline) — the user keeps
// them and meets them in the collection later.
const props = defineProps({
  drawn: { type: Array, default: () => [] },
  pending: { type: Number, default: 0 },
})

const brokenImages = ref({})

const heading = computed(() =>
  props.drawn.length > 1
    ? `You unlocked ${props.drawn.length} new collectibles`
    : 'You unlocked a new collectible',
)
</script>

<template>
  <section class="unlock-card" aria-live="polite">
    <p class="eyebrow">NEW COLLECTIBLE</p>

    <template v-if="drawn.length">
      <h2>{{ heading }}</h2>

      <article v-for="species in drawn" :key="species.scientificName" class="unlock-item">
        <img
          v-if="!brokenImages[species.scientificName]"
          class="unlock-photo"
          :src="imageUrl(species.image, 'medium')"
          :alt="species.commonName"
          @error="brokenImages[species.scientificName] = true"
        />
        <div v-else class="unlock-photo unlock-photo-missing" aria-hidden="true">🍃</div>

        <div class="unlock-copy">
          <h3>{{ species.commonName }}</h3>
          <PhotoCredit :image="species.image" />
        </div>
      </article>
    </template>

    <template v-else-if="pending > 0">
      <h2>You unlocked a collectible</h2>
      <p class="pending-text">
        It is yours to keep. Open your collection when you are online to meet it.
      </p>
    </template>

    <RouterLink to="/collection" class="unlock-link">See my collection</RouterLink>
  </section>
</template>

<style scoped>
.unlock-card {
  margin-top: 30px;
  padding: 24px;
  border: 1px solid rgba(70, 115, 85, 0.16);
  border-radius: 20px;
  background: #eef6f0;
  text-align: center;
}

.eyebrow {
  margin: 0 0 8px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h2 {
  margin: 0 0 16px;
  color: #294433;
  font-size: 22px;
  line-height: 1.25;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 16px;
  background: white;
  text-align: left;
}

.unlock-photo {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 14px;
  background: #e5ece6;
  object-fit: cover;
}

.unlock-photo-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
}

.unlock-copy h3 {
  margin: 0 0 6px;
  color: #20392a;
  font-size: 19px;
}

.pending-text {
  max-width: 380px;
  margin: 0 auto 16px;
  color: #68736c;
  font-size: 15px;
  line-height: 1.6;
}

.unlock-link {
  display: inline-block;
  margin-top: 4px;
  padding: 12px 22px;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: background 160ms ease;
}

.unlock-link:hover {
  background: #386548;
}

.unlock-link:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 3px;
}

@media (max-width: 700px) {
  .unlock-photo {
    width: 80px;
    height: 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .unlock-link {
    transition: none;
  }
}
</style>
