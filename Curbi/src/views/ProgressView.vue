<script setup>
import { computed, onMounted, ref } from 'vue'
import { getCompletionCount } from '@/services/progress'

// Progress is just a count of pauses taken, read from this device. There is
// deliberately no score, streak, rating or comparison with other people.
const count = ref(0)
const loading = ref(true)
const failed = ref(false)

const hasPauses = computed(() => count.value > 0)

onMounted(async () => {
  try {
    count.value = await getCompletionCount()
  } catch (error) {
    console.error('Unable to read progress:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="progress-page">
    <section class="progress-card">
      <p class="eyebrow">YOUR PROGRESS</p>

      <div v-if="loading" class="state-message">
        <div class="loading-circle"></div>
        <p>Looking at your pauses…</p>
      </div>

      <div v-else-if="failed" class="state-message">
        <p>
          We could not read your progress on this device right now. It is
          still saved — please try again in a moment.
        </p>
      </div>

      <!-- Encouraging empty state: no bare zero, and a hint on the first one. -->
      <template v-else-if="!hasPauses">
        <h1>Your first pause is waiting</h1>

        <p class="intro">
          There is nothing to chase here. Finish one short task, or one round
          of Leaf Tap, and it will show up on this page.
        </p>

        <div class="actions">
          <RouterLink to="/urge" class="primary-button">Try a short task</RouterLink>
          <RouterLink to="/play" class="secondary-button">Play Leaf Tap</RouterLink>
        </div>
      </template>

      <template v-else>
        <h1>Every pause counts</h1>

        <div class="count-block" aria-live="polite">
          <span class="count-number">{{ count }}</span>
          <span class="count-label">{{ count === 1 ? 'pause taken' : 'pauses taken' }}</span>
        </div>

        <p class="intro">
          Each one is a moment you chose to give your attention somewhere else.
        </p>

        <p class="note">
          Finished tasks and finished rounds of Leaf Tap both count.
        </p>
      </template>

      <RouterLink v-if="!loading && !failed" to="/collection" class="collection-link">
        View my collection →
      </RouterLink>

      <p class="privacy">
        Saved on this device only. No account needed.
      </p>
    </section>
  </main>
</template>

<style scoped>
.progress-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.progress-card {
  max-width: 640px;
  margin: 0 auto;
  padding: 44px;
  border: 1px solid #e2e9e4;
  border-radius: 24px;
  background: white;
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
  font-size: clamp(32px, 4vw, 44px);
  line-height: 1.15;
}

.intro {
  max-width: 460px;
  margin: 18px auto 0;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.count-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 28px 0 4px;
  padding: 26px 20px;
  border-radius: 20px;
  background: #f3f7f4;
}

.count-number {
  color: #2f714a;
  font-size: clamp(56px, 12vw, 80px);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.count-label {
  margin-top: 8px;
  color: #5d856a;
  font-size: 16px;
  font-weight: 600;
}

.note {
  margin: 14px 0 0;
  color: #879088;
  font-size: 14px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 28px;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 13px 24px;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.primary-button:hover {
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
.secondary-button:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 4px;
}

.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin: 8px 0 0;
  color: #68736c;
  line-height: 1.6;
}

.state-message p {
  margin: 0;
}

.loading-circle {
  width: 34px;
  height: 34px;
  border: 3px solid #dce7df;
  border-top-color: #5d856a;
  border-radius: 50%;
  animation: spin 900ms linear infinite;
}

.collection-link {
  display: inline-block;
  margin-top: 22px;
  color: #47765a;
  font-weight: 600;
  text-decoration: none;
}

.collection-link:hover {
  text-decoration: underline;
}

.collection-link:focus-visible {
  outline: 3px solid #789982;
  outline-offset: 4px;
}

.privacy {
  margin: 30px 0 0;
  padding-top: 22px;
  border-top: 1px solid #e6ebe7;
  color: #879088;
  font-size: 13px;
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

  .primary-button {
    transition: none;
  }
}

@media (max-width: 700px) {
  .progress-page {
    padding: 42px 20px 32px;
  }

  .progress-card {
    padding: 32px 22px;
    border-radius: 20px;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
