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

  label: {
    type: String,
    required: true,
  },

  icon: {
    type: String,
    default: '🌿',
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <article class="feature-card">
    <div class="feature-heading">
      <span
        class="feature-icon"
        aria-hidden="true"
      >
        {{ icon }}
      </span>

      <div>
        <p class="feature-label">
          CURBI FEATURE
        </p>

        <h3>
          {{ title }}
        </h3>
      </div>
    </div>

    <p class="feature-description">
      {{ description }}
    </p>

    <button
      type="button"
      class="feature-button"
      @click="emit('select')"
    >
      {{ label }}
      <span aria-hidden="true">→</span>
    </button>
  </article>
</template>

<style scoped>
.feature-card {
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

.feature-heading {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.feature-icon {
  font-size: 20px;
}

.feature-label {
  margin: 0 0 3px;

  color: #718b78;

  font-size: 10px;
  font-weight: 700;

  letter-spacing: 1.2px;
}

.feature-card h3 {
  margin: 0;

  color: #284834;

  font-size: 16px;
  font-weight: 650;
}

.feature-description {
  margin: 12px 0 0;

  color: #536d5b;

  font-size: 13px;
  line-height: 1.55;
}

.feature-button {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  margin-top: 14px;
  padding: 10px 14px;

  border: 0;
  border-radius: 999px;

  background: #47765a;
  color: white;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
}

.feature-button:hover {
  background: #3d674e;
}

.feature-button:focus-visible {
  outline: 3px solid rgba(71, 118, 90, 0.25);
  outline-offset: 2px;
}
</style>