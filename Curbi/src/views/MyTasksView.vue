<script setup>
import { computed, onMounted, ref } from 'vue'
import { db, ensureSeeded } from '@/db'
import TaskEditor from '@/components/TaskEditor.vue'

const tasks = ref([])
const loading = ref(true)
const error = ref('')
const editorOpen = ref(false)
const editingTask = ref(null)

const userTasks = computed(() =>
  tasks.value.filter(
    (task) => task.source === 'user' && task.active === true,
  ),
)

async function loadTasks() {
  loading.value = true
  error.value = ''

  try {
    await ensureSeeded()

    const storedTasks = await db.tasks.toArray()

    tasks.value = storedTasks.filter((task) => task.active === true)
  } catch (loadError) {
    console.error('Unable to load tasks:', loadError)
    error.value = 'We could not load your tasks right now.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingTask.value = null
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  editingTask.value = null
}

async function saveTask(changes) {
  error.value = ''

  try {
    await db.tasks.add({
    title: changes.title,
    body: changes.body,
    categories: changes.categories,
    durationSeconds: changes.durationSeconds,
    source: 'user',
    active: true,
    createdAt: Date.now(),
    })

    closeEditor()
    await loadTasks()
  } catch (saveError) {
    console.error('Unable to save task:', saveError)
    error.value = 'We could not save that task. Please try again.'
  }
}

onMounted(loadTasks)
</script>

<template>
  <main class="tasks-page">
    <section class="hero">
      <div>
        <p class="eyebrow">YOUR TASKS</p>
        <h1>Build a list that feels like yours.</h1>
        <p class="intro">
          Add coping activities you already know work for you.
          Your personal tasks stay on this device.
        </p>
      </div>

      <button type="button" class="primary-button" @click="openCreate">
        + Add personal task
      </button>
    </section>

    <p v-if="error" class="error-banner" role="alert">
      {{ error }}
    </p>

    <section v-if="loading" class="state-card">
      <p>Loading your tasks...</p>
    </section>

    <section v-else class="task-section">
      <div class="section-heading">
        <h2>My personal tasks</h2>
        <span>{{ userTasks.length }}</span>
      </div>

      <div v-if="userTasks.length === 0" class="empty-card">
        <h3>No personal tasks yet</h3>
        <p>Add one of your own short activities.</p>

        <button type="button" class="primary-button" @click="openCreate">
          Add your first task
        </button>
      </div>

      <div v-else class="task-grid">
        <article
          v-for="task in userTasks"
          :key="task.id"
          class="task-card"
        >
          <p class="source-pill">My task</p>

          <h3>{{ task.title }}</h3>
          <p>{{ task.body }}</p>
        </article>
      </div>
    </section>

    <TaskEditor
      v-if="editorOpen"
      :task="editingTask"
      @save="saveTask"
      @cancel="closeEditor"
    />
  </main>
</template>

<style scoped>
.tasks-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 28px;
  margin-bottom: 34px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  max-width: 700px;
  margin: 0;
  color: #20392a;
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.12;
}

.intro {
  max-width: 680px;
  margin: 18px 0 0;
  color: #68736c;
  line-height: 1.7;
}

.primary-button {
  padding: 13px 20px;
  border: 0;
  border-radius: 999px;
  background: #4f815f;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.error-banner {
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff4f2;
  color: #965d5d;
}

.state-card,
.empty-card,
.task-card {
  border: 1px solid #e2e9e4;
  border-radius: 20px;
  background: white;
}

.state-card,
.empty-card {
  padding: 30px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0;
  color: #20392a;
  font-size: 29px;
}

.empty-card {
  text-align: center;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.task-card {
  padding: 24px;
}

.source-pill {
  display: inline-flex;
  margin: 0;
  padding: 5px 9px;
  border-radius: 999px;
  background: #eaf2ec;
  color: #477256;
  font-size: 12px;
  font-weight: 700;
}

.task-card h3 {
  margin: 18px 0 8px;
  color: #284332;
}

.task-card p:last-child {
  color: #627067;
  line-height: 1.65;
}

@media (max-width: 820px) {
  .hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .task-grid {
    grid-template-columns: 1fr;
  }
}
</style>