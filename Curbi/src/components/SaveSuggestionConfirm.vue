<script setup>
defineProps({
  suggestion: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cancel', 'confirm'])
</script>

<template>
  <div
    class="save-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="save-suggestion-title"
  >
    <div class="save-dialog">
      <p class="save-label">
        SAVE ACTIVITY
      </p>

      <h3 id="save-suggestion-title">
        Save this activity?
      </h3>

      <div class="task-preview">
        <strong>{{ suggestion.title }}</strong>

        <p>
          {{ suggestion.description }}
        </p>

        <span v-if="suggestion.duration">
          {{ suggestion.duration }}
        </span>
      </div>

      <p class="save-helper">
        This activity can be added to your personal tasks so you can
        return to it later.
      </p>

      <div class="save-actions">
        <button
          type="button"
          class="cancel-button"
          @click="emit('cancel')"
        >
          Cancel
        </button>

        <button
          type="button"
          class="confirm-button"
          @click="emit('confirm')"
        >
          Save task
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.save-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(30, 52, 39, 0.18);

  backdrop-filter: blur(3px);
}

.save-dialog {
  width: 100%;
  max-width: 330px;

  padding: 22px;

  border: 1px solid #d6e5d8;
  border-radius: 22px;

  background: #fbfdfb;

  box-shadow:
    0 22px 60px
    rgba(38, 64, 46, 0.18);
}

.save-label {
  margin: 0 0 5px;

  color: #728c79;

  font-size: 10px;
  font-weight: 700;

  letter-spacing: 1.6px;
}

.save-dialog h3 {
  margin: 0;

  color: #294535;

  font-size: 20px;
  font-weight: 650;
}

.task-preview {
  margin-top: 18px;
  padding: 14px;

  border-radius: 16px;

  background: #edf5ee;
  color: #365640;
}

.task-preview strong {
  font-size: 15px;
}

.task-preview p {
  margin: 7px 0 10px;

  font-size: 13px;
  line-height: 1.5;
}

.task-preview span {
  display: inline-block;

  padding: 4px 8px;

  border-radius: 999px;

  background: #dfece1;

  font-size: 11px;
}

.save-helper {
  margin: 15px 0 0;

  color: #687d6d;

  font-size: 12px;
  line-height: 1.5;
}

.save-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  margin-top: 18px;
}

.cancel-button,
.confirm-button {
  padding: 10px;

  border-radius: 999px;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;
}

.cancel-button {
  border: 1px solid #cadacd;

  background: transparent;
  color: #55705d;
}

.confirm-button {
  border: 0;

  background: #47765a;
  color: white;
}

.cancel-button:hover {
  background: #f0f5f1;
}

.confirm-button:hover {
  background: #3d674e;
}
</style>