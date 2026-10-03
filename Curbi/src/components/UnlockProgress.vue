<script setup>
import { computed } from 'vue'
import { collectibleProgress } from '@/services/collectibles'

// How far the user is from their next collectible, counted in pauses: the number
// still to go, large, and a cumulative bar under it ("3 / 5"). It only reads the
// completion count — a "nearly there" hint, never a streak or a warning about
// losing something.
const props = defineProps({
  pauses: { type: Number, required: true },
  allCollected: { type: Boolean, default: false },
})

const progress = computed(() => collectibleProgress(props.pauses))
const percent = computed(() => Math.round(progress.value.fraction * 100))

const which = computed(() => (props.pauses === 0 ? 'first' : 'next'))
const label = computed(
  () => `${progress.value.remaining === 1 ? 'more pause' : 'more pauses'} until your ${which.value} collectible`,
)
</script>

<template>
  <div class="unlock-progress">
    <template v-if="allCollected">
      <span class="done-mark" aria-hidden="true">🍃</span>
      <p class="caption">You have met every animal.</p>
    </template>

    <template v-else>
      <span class="remaining-number">{{ progress.remaining }}</span>
      <p class="caption">{{ label }}</p>

      <div class="bar-row">
        <div
          class="bar"
          role="progressbar"
          aria-label="Pauses taken out of the pauses needed for your next collectible"
          aria-valuemin="0"
          :aria-valuemax="progress.next"
          :aria-valuenow="pauses"
          :aria-valuetext="`${pauses} of ${progress.next} pauses. ${progress.remaining} ${label}`"
        >
          <span class="bar-fill" :style="{ width: `${percent}%` }"></span>
        </div>

        <!-- Not shown at 0: "0 / 1" would be a bare zero. -->
        <span v-if="pauses > 0" class="bar-count">{{ pauses }} / {{ progress.next }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.unlock-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.remaining-number {
  color: #2f714a;
  font-size: clamp(52px, 8vw, 68px);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.done-mark {
  font-size: 44px;
  line-height: 1;
}

.caption {
  margin: 10px 0 0;
  color: #5d856a;
  font-size: 16px;
  font-weight: 600;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 360px;
  margin-top: 16px;
}

.bar {
  flex: 1;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2ece4;
}

.bar-count {
  min-width: 3.4em;
  color: #5d856a;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #5d9a73;
  transition: width 400ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .bar-fill {
    transition: none;
  }
}
</style>
