<script setup>
import { computed, onMounted } from 'vue'

import { useMusicPlayer } from '@/composables/useMusicPlayer'

// Entry point: the homepage's "CALM BACKGROUND / Set the atmosphere" card
// (HomeView.vue, support-points grid) links here since us3-home-guidance-ui
// merged into iteration-2 and was pulled into this branch (2026-09-13).

const { tracks, activeCategory, loading, failed, loadTracks, playCategory } = useMusicPlayer()

// Order matters here: it's the display order of the mood cards.
const CATEGORY_META = [
  { key: 'chillout', label: 'Chillout', description: 'Slow electronic textures to unwind to' },
  { key: 'solopiano', label: 'Solo Piano', description: 'Calm piano pieces to sit with' },
  { key: 'lounge', label: 'Lounge', description: 'Relaxed café-style tunes' },
]

const moods = computed(() => {
  const cards = CATEGORY_META.map((meta) => {
    const inCategory = tracks.value.filter((t) => t.matchedTag === meta.key)
    return {
      key: meta.key,
      label: meta.label,
      description: meta.description,
      count: inCategory.length,
      image: inCategory[0]?.albumImageUrl ?? null,
    }
  })
  cards.push({
    key: null,
    label: 'Mix',
    description: 'A shuffled mix of every track',
    count: tracks.value.length,
    image: null,
  })
  return cards
})

onMounted(() => {
  loadTracks()
})
</script>

<template>
  <main class="atmosphere-page">
    <section class="atmosphere-hero">
      <p class="eyebrow">CALM BACKGROUND</p>

      <h1>Set the atmosphere</h1>

      <p class="intro">
        Pick a mood and Curbi keeps it playing in the mini-player while you move around the app.
      </p>
    </section>

    <div v-if="loading" class="data-loading">
      <div class="loading-spinner"></div>
      <p>Loading the music library…</p>
    </div>

    <div v-else-if="failed" class="data-error">
      <p>Music is unavailable right now — try again in a moment.</p>
    </div>

    <section v-else class="mood-grid">
      <button
        v-for="mood in moods"
        :key="mood.key ?? 'mix'"
        type="button"
        class="mood-card"
        :class="{ active: activeCategory === mood.key, 'mood-card-mix': !mood.image }"
        :style="mood.image ? { backgroundImage: `url(${mood.image})` } : null"
        @click="playCategory(mood.key)"
      >
        <span class="mood-card-overlay"></span>
        <span class="mood-card-content">
          <span v-if="!mood.image" class="mood-icon">🌿</span>
          <span class="mood-name">{{ mood.label }}</span>
          <span class="mood-desc">{{ mood.description }}</span>
          <span class="mood-count">{{ mood.count }} tracks</span>
        </span>
      </button>
    </section>

    <p class="credit">
      Music via <a href="https://www.jamendo.com/" target="_blank" rel="noopener">Jamendo</a>,
      Creative Commons licensed.
    </p>
  </main>
</template>

<style scoped>
.atmosphere-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 72px 32px 52px;
}

.atmosphere-hero {
  max-width: 680px;
}

.eyebrow {
  margin: 0 0 14px;
  color: #5d856a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(40px, 5vw, 60px);
  line-height: 1.08;
}

.intro {
  max-width: 560px;
  margin: 22px 0 0;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.data-loading,
.data-error {
  margin-top: 48px;
  padding: 34px;
  border-radius: 18px;
  background: #fafbf9;
  color: #68736c;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  margin-bottom: 12px;
  border: 3px solid #e7ece8;
  border-top-color: #5d856a;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 44px;
}

.mood-card {
  position: relative;
  aspect-ratio: 4 / 5;
  border: none;
  border-radius: 24px;
  overflow: hidden;
  background-color: #2f714a;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: transform 180ms ease;
}

.mood-card:hover {
  transform: translateY(-2px);
}

.mood-card.active {
  outline: 3px solid #4f815f;
  outline-offset: 3px;
}

.mood-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(32, 57, 42, 0) 40%, rgba(20, 35, 26, 0.88) 100%);
}

.mood-card-mix .mood-card-overlay {
  background: none;
}

.mood-card-content {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mood-card-mix .mood-card-content {
  top: 20px;
  align-items: flex-start;
}

.mood-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.mood-name {
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.mood-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  line-height: 1.4;
}

.mood-count {
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 4px;
}

.credit {
  margin-top: 40px;
  color: #7b867e;
  font-size: 13px;
}

.credit a {
  color: #4f765a;
}

@media (max-width: 700px) {
  .atmosphere-page {
    padding: 46px 20px 34px;
  }

  .mood-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}
</style>
