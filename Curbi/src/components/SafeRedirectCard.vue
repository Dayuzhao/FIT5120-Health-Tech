<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: 'Open Help Finder',
  },
})

const emit = defineEmits(['find-support'])
</script>

<template>
  <article class="redirect-card">
    <div class="redirect-heading">
      <span class="redirect-icon" aria-hidden="true"> 🌿 </span>

      <div>
        <p class="redirect-label">SUPPORT</p>

        <h3>Finding the right support</h3>
      </div>
    </div>

    <p class="redirect-message">
      {{ message }}
    </p>

    <button type="button" class="support-button" @click="emit('find-support')">
      {{ label }}
      <span aria-hidden="true">→</span>
    </button>
  </article>
</template>

<style scoped>
.redirect-card {
  width: 100%;
  max-width: 285px;

  padding: 16px;

  border: 1px solid #d6e5d8;
  border-radius: 18px;

  background: #f8fbf8;
  color: #294535;

  box-shadow: 0 8px 24px rgba(57, 84, 65, 0.08);
}

.redirect-heading {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.redirect-icon {
  font-size: 20px;
}

.redirect-label {
  margin: 0 0 3px;

  color: #718b78;

  font-size: 10px;
  font-weight: 700;

  letter-spacing: 1.2px;
}

.redirect-card h3 {
  margin: 0;

  color: #284834;

  font-size: 16px;
  font-weight: 650;
}

.redirect-message {
  margin: 12px 0 0;

  color: #536d5b;

  font-size: 13px;
  line-height: 1.6;
}

.support-button {
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

.support-button:hover {
  background: #3d674e;
}

.support-button:focus-visible {
  outline: 3px solid rgba(71, 118, 90, 0.25);
  outline-offset: 2px;
}
</style>
