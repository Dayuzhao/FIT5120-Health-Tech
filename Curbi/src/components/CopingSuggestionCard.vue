<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  duration: {
    type: String,
    default: '',
  },

  category: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['request-save'])
</script>

<template>
  <article class="suggestion-card">
    <div class="suggestion-top">
      <span class="suggestion-icon">🌿</span>

      <div>
        <p
          v-if="category"
          class="suggestion-category"
        >
          {{ category }}
        </p>

        <h3>{{ title }}</h3>
      </div>
    </div>

    <p class="suggestion-description">
      {{ description }}
    </p>

    <div
      v-if="duration"
      class="suggestion-duration"
    >
      {{ duration }}
    </div>

    <div class="suggestion-actions">
      <button
        type="button"
        class="try-button"
      >
        Try this
      </button>

      <button
        type="button"
        class="save-button"
        @click="emit('request-save')"
      >
        Save task
      </button>
    </div>
  </article>
</template>

<style scoped>
.suggestion-card {
  width: 100%;
  max-width: 285px;

  padding: 16px;

  border: 1px solid #d6e5d8;
  border-radius: 18px;

  background: #f8fbf8;
  color: #294535;

  box-shadow:
    0 8px 24px
    rgba(57, 84, 65, 0.08);
}

.suggestion-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.suggestion-icon {
  font-size: 20px;
}

.suggestion-category {
  margin: 0 0 3px;

  color: #718b78;

  font-size: 10px;
  font-weight: 700;

  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.suggestion-card h3 {
  margin: 0;

  color: #284834;

  font-size: 16px;
  font-weight: 650;
}

.suggestion-description {
  margin: 12px 0 0;

  color: #536d5b;

  font-size: 13px;
  line-height: 1.55;
}

.suggestion-duration {
  display: inline-block;

  margin-top: 12px;
  padding: 5px 9px;

  border-radius: 999px;

  background: #e7f0e8;
  color: #597461;

  font-size: 11px;
  font-weight: 600;
}

.suggestion-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  margin-top: 14px;
}

.try-button,
.save-button {
  padding: 10px 12px;

  border-radius: 999px;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
}

.try-button {
  border: 0;

  background: #47765a;
  color: white;
}

.try-button:hover {
  background: #3d674e;
}

.save-button {
  border: 1px solid #bcd2c1;

  background: #f8fbf8;
  color: #47765a;
}

.save-button:hover {
  background: #edf5ee;
}
</style>