<script setup>
import { ref, watch } from 'vue'
import {
  DEFAULT_TASK_DURATION_SECONDS,
} from '@/services/taskDefaults'

const props = defineProps({
  task: {
    type: Object,
    default: null,
  },
})

const durationMinutes = ref('')
const emit = defineEmits(['save', 'cancel'])

const title = ref('')
const body = ref('')
const error = ref('')

const TASK_URGE_TYPES = [
  {
    id: 'body-checking',
    label: 'Body checking',
  },
  {
    id: 'reassurance',
    label: 'Reassurance',
  },
  {
    id: 'info-searching',
    label: 'Information searching',
  },
]

const categories = ref([])

watch(
  () => props.task,
  (task) => {
    title.value = task?.title ?? ''
    body.value = task?.body ?? ''
    error.value = ''
    categories.value = Array.isArray(task?.categories)
  ? [...task.categories]
  : []

  if (task?.durationSeconds) {
  durationMinutes.value = String(
    task.durationSeconds / 60,
  )
} else {
durationMinutes.value = ''
}
  },
  { immediate: true },
)

function toggleCategory(categoryId) {
  if (categories.value.includes(categoryId)) {
    categories.value = categories.value.filter(
      (id) => id !== categoryId,
    )
  } else {
    categories.value = [...categories.value, categoryId]
  }
}

function saveTask() {
    let durationSeconds =
  DEFAULT_TASK_DURATION_SECONDS

    if (durationMinutes.value !== '') {
    const minutes = Number(durationMinutes.value)

    if (
        !Number.isInteger(minutes) ||
        minutes <= 0
    ) {
        error.value =
        'Duration must be a whole number of minutes.'

        return
    }

    durationSeconds = minutes * 60
    }

  const cleanTitle = title.value.trim()
  const cleanBody = body.value.trim()

  if (!cleanTitle || !cleanBody) {
    error.value = 'Please add a title and instructions.'
    return
  }

  emit('save', {
  title: cleanTitle,
  body: cleanBody,
  categories: [...categories.value],
  durationSeconds,
})
}
</script>

<template>
  <div class="editor-backdrop" @click.self="emit('cancel')">
    <section
      class="editor-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-editor-title"
    >
      <div class="editor-header">
        <div>
          <p class="eyebrow">{{ props.task ? 'EDIT TASK' : 'NEW TASK' }}</p>
          <h2 id="task-editor-title">
            {{ props.task ? 'Edit your task' : 'Create a personal task' }}
          </h2>
        </div>

        <button
          type="button"
          class="icon-button"
          aria-label="Close"
          @click="emit('cancel')"
        >
          ×
        </button>
      </div>

      <form @submit.prevent="saveTask">
        <label class="field">
        <span>Suggested duration (minutes)</span>

        <input
            v-model="durationMinutes"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="Leave blank for the default"
        />

        <small>
            Blank uses the app default of
            {{ DEFAULT_TASK_DURATION_SECONDS / 60 }} minutes.
        </small>
        </label>

        <label class="field">
          <span>Task name</span>
          <input
            v-model="title"
            type="text"
            placeholder="e.g. Make a cup of tea"
            autocomplete="off"
          />
        </label>

        <label class="field">
          <span>Instructions</span>
          <textarea
            v-model="body"
            rows="5"
            placeholder="Describe what you want to do..."
          ></textarea>
        </label>

        <fieldset class="field-group">
        <legend>Urge types</legend>

        <p class="field-help">
            Select the urges this task is a good fit for.
        </p>

        <label
            v-for="urgeType in TASK_URGE_TYPES"
            :key="urgeType.id"
            class="checkbox-row"
        >
            <input
            type="checkbox"
            :checked="categories.includes(urgeType.id)"
            @change="toggleCategory(urgeType.id)"
            />

            <span>{{ urgeType.label }}</span>
        </label>
        </fieldset>

        <p v-if="error" class="error-text" role="alert">
          {{ error }}
        </p>

        <div class="actions">
          <button type="button" class="secondary-button" @click="emit('cancel')">
            Cancel
          </button>

          <button type="submit" class="primary-button">
            Save task
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.editor-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(31, 51, 39, 0.34);
}

.editor-card {
  width: min(100%, 620px);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 30px;
  border: 1px solid #dfe8e1;
  border-radius: 22px;
  background: white;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h2 {
  margin: 0;
  color: #20392a;
  font-size: 28px;
  line-height: 1.2;
}

.icon-button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #eef4ef;
  color: #45634f;
  font-size: 25px;
  cursor: pointer;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
}

.field > span {
  color: #314c3a;
  font-size: 14px;
  font-weight: 700;
}

.field input,
.field textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ccd9cf;
  border-radius: 12px;
  background: #fbfdfb;
  color: #263d2e;
  font: inherit;
}

.field textarea {
  resize: vertical;
}

.error-text {
  color: #9a5d5d;
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-button,
.secondary-button {
  padding: 11px 18px;
  border-radius: 999px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #4f815f;
  color: white;
}

.secondary-button {
  border: 1px solid #ccd8cf;
  background: white;
  color: #496451;
}

.field-group {
  display: grid;
  gap: 10px;
  margin: 0 0 20px;
}

.field-group legend {
  color: #314c3a;
  font-size: 14px;
  font-weight: 700;
}

.field-help {
  margin: 0;
  color: #758078;
  font-size: 13px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4c6253;
}

.checkbox-row input {
  width: 17px;
  height: 17px;
}
</style>