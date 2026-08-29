<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, ensureSeeded } from '@/db'

const route = useRoute()
const router = useRouter()

const tasks = ref([])
const currentTask = ref(null)
const urgeEventId = ref(null)

const loading = ref(true)
const error = ref('')
const switching = ref(false)
const completing = ref(false)

const hasTask = computed(() => currentTask.value !== null)

function chooseRandomTask(excludeId = null) {
  const candidates = tasks.value.filter((task) => task.id !== excludeId)

  if (candidates.length === 0) {
    return tasks.value[0] ?? null
  }

  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}

async function loadTask() {
  loading.value = true
  error.value = ''

  try {
    await ensureSeeded()

    tasks.value = (await db.tasks.toArray()).filter(
      (task) => task.active === true,
    )

    if (tasks.value.length === 0) {
      throw new Error('No active tasks available')
    }

    const routeEventId = Number(route.query.urgeEventId)

    if (Number.isInteger(routeEventId) && routeEventId > 0) {
      const existingEvent = await db.urgeEvents.get(routeEventId)

      if (existingEvent) {
        urgeEventId.value = existingEvent.id

        if (existingEvent.taskId) {
          const existingTask = tasks.value.find(
            (task) => task.id === existingEvent.taskId,
          )

          if (existingTask) {
            currentTask.value = existingTask
          }
        }
      }
    }

    if (!currentTask.value) {
      currentTask.value = chooseRandomTask()
    }

    if (urgeEventId.value && currentTask.value) {
      await db.urgeEvents.update(urgeEventId.value, {
        taskId: currentTask.value.id,
      })
    }
  } catch (loadError) {
    console.error('Unable to load task:', loadError)
    error.value = 'We could not load a task right now. Please try again.'
  } finally {
    loading.value = false
  }
}

async function switchTask() {
  if (switching.value || !currentTask.value) return

  switching.value = true
  error.value = ''

  try {
    const nextTask = chooseRandomTask(currentTask.value.id)

    if (!nextTask) {
      throw new Error('No alternative task available')
    }

    currentTask.value = nextTask

    if (urgeEventId.value) {
      await db.urgeEvents.update(urgeEventId.value, {
        taskId: nextTask.id,
      })
    }
  } catch (switchError) {
    console.error('Unable to switch task:', switchError)
    error.value = 'We could not switch tasks right now. Please try again.'
  } finally {
    switching.value = false
  }
}

async function completeTask() {
  if (completing.value || !currentTask.value) return

  completing.value = true
  error.value = ''

  try {
    let eventId = urgeEventId.value

    // Defensive fallback if someone reached /task directly.
    if (!eventId) {
      eventId = await db.urgeEvents.add({
        startedAt: Date.now(),
        endedAt: null,
        taskId: currentTask.value.id,
        outcome: null,
        urgeType: null,
      })

      urgeEventId.value = eventId
    }

    const completedAt = Date.now()

    await db.transaction(
      'rw',
      db.urgeEvents,
      db.taskCompletions,
      async () => {
        await db.urgeEvents.update(eventId, {
          endedAt: completedAt,
          taskId: currentTask.value.id,
          outcome: 'completed',
        })

        await db.taskCompletions.add({
          urgeEventId: eventId,
          taskId: currentTask.value.id,
          completedAt,
          reliefScore: null,
        })
      },
    )

    await router.push({
      name: 'complete',
    })
  } catch (completeError) {
    console.error('Unable to complete task:', completeError)
    error.value =
      'We could not record the completed task. Please try again.'
  } finally {
    completing.value = false
  }
}

onMounted(loadTask)
</script>

<template>
  <main class="task-page">
    <section class="task-card">
      <div v-if="loading" class="state-card">
        <div class="loading-circle"></div>

        <div>
          <h2>Finding a task</h2>
          <p>Curbi is choosing a short alternative activity for you.</p>
        </div>
      </div>

      <div v-else-if="error && !hasTask" class="state-card error-state">
        <div class="state-icon">!</div>

        <div>
          <h2>Something went wrong</h2>
          <p>{{ error }}</p>
        </div>
      </div>

      <template v-else-if="hasTask">
        <div class="task-icon">🌿</div>

        <p class="eyebrow">YOUR TASK</p>

        <h1>{{ currentTask.title }}</h1>

        <p class="intro">
          Step away from checking for a few minutes and give your attention
          somewhere else.
        </p>

        <div class="instructions">
          <h2>What to do</h2>

          <div class="instruction">
            <span class="step-number">1</span>
            <p>{{ currentTask.body }}</p>
          </div>
        </div>

        <button
          class="complete-button"
          type="button"
          :disabled="completing"
          @click="completeTask"
        >
          {{ completing ? 'Recording…' : "I've completed this task" }}
        </button>

        <button
          class="another-task"
          type="button"
          :disabled="switching || completing"
          @click="switchTask"
        >
          {{ switching ? 'Choosing another task…' : 'Choose another option' }}
        </button>

        <p v-if="error" class="error-text" role="alert">
          {{ error }}
        </p>

        <p class="support-note">
          You don't need to do this perfectly. The goal is simply to create a
          short pause from checking.
        </p>
      </template>
    </section>
  </main>
</template>

<style scoped>
.task-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.task-card {
  max-width: 680px;
  margin: 0 auto;
  padding: 44px;
  border: 1px solid #e2e9e4;
  border-radius: 24px;
  background: white;
}

.task-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  border-radius: 18px;
  background: #eef4ef;
  font-size: 30px;
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
  font-size: clamp(34px, 4vw, 46px);
  line-height: 1.15;
}

.intro {
  margin: 18px 0 28px;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.instructions {
  padding-top: 4px;
}

.instructions h2 {
  margin: 0 0 18px;
  color: #294433;
  font-size: 19px;
}

.instruction {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 18px;
}

.step-number {
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e7f0e9;
  color: #477256;
  font-size: 13px;
  font-weight: 700;
}

.instruction p {
  margin: 3px 0 0;
  color: #606d64;
  font-size: 15px;
  line-height: 1.6;
}

.complete-button {
  width: 100%;
  display: block;
  margin-top: 32px;
  padding: 15px 22px;
  border: 0;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  text-align: center;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.complete-button:hover:not(:disabled) {
  background: #416f50;
}

.complete-button:disabled,
.another-task:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.another-task {
  width: 100%;
  display: block;
  margin-top: 16px;
  padding: 10px;
  border: 0;
  background: transparent;
  color: #62766a;
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.another-task:hover:not(:disabled) {
  text-decoration: underline;
}

.support-note {
  margin: 28px 0 0;
  padding-top: 22px;
  border-top: 1px solid #e6ebe7;
  color: #879088;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.state-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border-radius: 16px;
  background: #f5f8f6;
}

.state-card h2 {
  margin: 0 0 6px;
  color: #294433;
  font-size: 18px;
}

.state-card p {
  margin: 0;
  color: #68736c;
  line-height: 1.5;
}

.state-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #e8eee9;
  color: #5f7766;
  font-weight: 700;
}

.loading-circle {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 3px solid #dce7df;
  border-top-color: #5d856a;
  border-radius: 50%;
  animation: spin 900ms linear infinite;
}

.error-text {
  margin: 14px 0 0;
  color: #9a5d5d;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .task-page {
    padding: 42px 20px 32px;
  }

  .task-card {
    padding: 30px 22px;
    border-radius: 20px;
  }
}
</style>