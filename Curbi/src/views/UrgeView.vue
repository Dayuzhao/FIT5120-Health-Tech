<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/db'

const router = useRouter()

const selectedUrge = ref(null)
const starting = ref(false)
const startError = ref('')

const urges = [
  {
    id: 'search-symptoms',
    icon: '🔍',
    title: 'Search symptoms online',
    description: 'I feel like Googling my symptoms again.',
  },
  {
    id: 'check-body',
    icon: '❤️',
    title: 'Check my pulse or body',
    description: 'I want to repeatedly check a physical sensation.',
  },
  {
    id: 'check-change',
    icon: '🪞',
    title: 'Look at a physical change again',
    description: 'I want to keep checking the same spot or body area.',
  },
  {
    id: 'reassurance',
    icon: '💬',
    title: 'Ask someone for reassurance',
    description: 'I want someone else to tell me that everything is okay.',
  },
  {
    id: 'reread-health-info',
    icon: '📄',
    title: 'Re-read health information',
    description: 'I want to check an old result, report or health page again.',
  },
]

const canStart = computed(() => selectedUrge.value !== null)

function selectUrge(urge) {
  selectedUrge.value = urge
  startError.value = ''
}

async function beginTask() {
  if (starting.value) return

  starting.value = true
  startError.value = ''

  try {
    const now = Date.now()

    const urgeEventId = await db.urgeEvents.add({
      startedAt: now,
      endedAt: null,
      taskId: null,
      outcome: null,
      urgeType: selectedUrge.value?.id ?? null,
    })

    await router.push({
      name: 'task',
      query: {
        urgeEventId: String(urgeEventId),
      },
    })
  } catch (error) {
    console.error('Unable to start urge event:', error)
    startError.value = 'We could not start the task right now. Please try again.'
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <main class="urge-page">
    <section class="urge-card">
      <p class="eyebrow">CHECKING URGE</p>

      <h1>What are you feeling the urge to do?</h1>

      <p class="intro">
        Choose the checking behaviour that best matches what you are experiencing
        right now.
      </p>

      <div class="urge-options">
        <button
          v-for="urge in urges"
          :key="urge.id"
          class="urge-option"
          :class="{ selected: selectedUrge?.id === urge.id }"
          type="button"
          @click="selectUrge(urge)"
        >
          <span class="option-icon">{{ urge.icon }}</span>

          <div>
            <h2>{{ urge.title }}</h2>
            <p>{{ urge.description }}</p>
          </div>
        </button>
      </div>

      <button
        class="primary-button"
        type="button"
        :disabled="!canStart || starting"
        @click="beginTask"
      >
        {{ starting ? 'Starting…' : 'Find a task for me' }}
      </button>

      <p v-if="startError" class="error-text" role="alert">
        {{ startError }}
      </p>

      <RouterLink to="/help" class="support-link">
        Find nearby support services
      </RouterLink>

      <RouterLink to="/home" class="secondary-link">
        Not right now
      </RouterLink>

      <p class="privacy-text">
        No login or account is required. Your urge selection stays on this
        device.
      </p>
    </section>
  </main>
</template>

<style scoped>
.support-link {
  display: block;
  margin-top: 16px;
  padding: 13px 20px;
  border: 1px solid #c9d8cd;
  border-radius: 10px;
  color: #4f765a;
  text-align: center;
  font-weight: 600;
  text-decoration: none;
  transition:
    background 180ms ease,
    border-color 180ms ease;
}

.support-link:hover {
  border-color: #9fb9a7;
  background: #f3f7f4;
}

.urge-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 64px 32px 48px;
}

.urge-card {
  max-width: 760px;
  margin: 0 auto;
}

.eyebrow {
  margin-bottom: 12px;
  color: #5d856a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  color: #20392a;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.15;
}

.intro {
  max-width: 620px;
  margin: 18px 0 30px;
  color: #68736c;
  font-size: 17px;
  line-height: 1.7;
}

.urge-options {
  display: grid;
  gap: 14px;
}

.urge-option {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e1e8e3;
  border-radius: 16px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.urge-option:hover {
  transform: translateY(-2px);
  border-color: #9cb7a4;
  background: #f7faf8;
}

.urge-option.selected {
  border-color: #5d856a;
  background: #eef4ef;
}

.option-icon {
  font-size: 26px;
}

.urge-option h2 {
  margin: 0 0 6px;
  color: #294433;
  font-size: 16px;
}

.urge-option p {
  margin: 0;
  color: #727c75;
  font-size: 14px;
  line-height: 1.5;
}

.primary-button {
  width: 100%;
  display: block;
  margin-top: 28px;
  padding: 15px 22px;
  border: 0;
  border-radius: 10px;
  background: #4f815f;
  color: white;
  text-align: center;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 180ms ease,
    background 180ms ease;
}

.primary-button:hover:not(:disabled) {
  background: #416f50;
  transform: translateY(-2px);
}

.primary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.error-text {
  margin: 12px 0 0;
  color: #9a5d5d;
  font-size: 14px;
  text-align: center;
}

.secondary-link {
  display: block;
  margin-top: 16px;
  color: #6f7972;
  text-align: center;
  text-decoration: none;
}

.privacy-text {
  margin-top: 24px;
  color: #889189;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 700px) {
  .urge-page {
    padding: 42px 20px 32px;
  }

  .urge-option {
    padding: 17px;
  }
}
</style>