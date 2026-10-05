<script setup>
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import CopingSuggestionCard from './CopingSuggestionCard.vue'
import SaveSuggestionConfirm from './SaveSuggestionConfirm.vue'
import FeatureActionCard from './FeatureActionCard.vue'
import SafeRedirectCard from './SafeRedirectCard.vue'
import { sendCompanionMessage } from '../services/companion'

const props = defineProps({
  saveSuggestion: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['close'])

const inputMessage = ref('')
const personalities = [
  {
    id: 'gentle',
    name: 'Gentle friend',
    description: 'Warm, soft, and reassuring',
    icon: '🌿',
  },
  {
    id: 'playful',
    name: 'Playful buddy',
    description: 'Light-hearted and cheerful',
    icon: '☀️',
  },
  {
    id: 'calm',
    name: 'Calm guide',
    description: 'Steady, simple, and clear',
    icon: '🍃',
  },
  {
    id: 'encouraging',
    name: 'Encouraging pal',
    description: 'Positive, kind, and low-pressure',
    icon: '✨',
  },
  {
    id: 'custom',
    name: 'Make it yours',
    description: 'Choose a style in your own words',
    icon: '✏️',
  },
]
const savedPersonality = localStorage.getItem('curbi-companion-personality')
const savedCustomPersonality = localStorage.getItem('curbi-companion-custom-style')
const legacyCustomPersonality = localStorage.getItem('curbi-companion-instructions')
const initialCustomPersonality = savedCustomPersonality ?? legacyCustomPersonality ?? ''
if (savedCustomPersonality === null && legacyCustomPersonality !== null) {
  localStorage.setItem('curbi-companion-custom-style', legacyCustomPersonality)
  localStorage.removeItem('curbi-companion-instructions')
}
const initialPersonality = personalities.some(({ id }) => id === savedPersonality)
  ? savedPersonality
  : initialCustomPersonality
    ? 'custom'
    : 'gentle'
const selectedPersonality = ref(initialPersonality)
const customPersonalityDraft = ref(initialCustomPersonality)
const activeCustomPersonality = ref(initialCustomPersonality)
const showPersonalities = ref(false)
const pendingSuggestion = ref(null)
const isTyping = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const messageList = ref(null)
const conversationHistory = ref([])
const router = useRouter()

const selectPersonality = (personality) => {
  selectedPersonality.value = personality
  localStorage.setItem('curbi-companion-personality', personality)
}

const saveCustomPersonality = () => {
  const value = customPersonalityDraft.value.trim()
  activeCustomPersonality.value = value
  localStorage.setItem('curbi-companion-custom-style', value)
  localStorage.removeItem('curbi-companion-instructions')
}

const goToFeature = (route) => {
  router.push(route)
}

const goToHelpFinder = () => {
  router.push('/help')
}

const requestSaveSuggestion = (suggestion) => {
  saveError.value = ''
  pendingSuggestion.value = suggestion
}

const cancelSaveSuggestion = () => {
  pendingSuggestion.value = null
}

const confirmSaveSuggestion = async () => {
  if (!pendingSuggestion.value || isSaving.value) {
    return
  }

  isSaving.value = true
  saveError.value = ''

  try {
    await props.saveSuggestion(pendingSuggestion.value)
    pendingSuggestion.value = null
    messages.value.push({
      id: messageId++,
      type: 'status',
      role: 'assistant',
      text: 'Saved to My Tasks.',
    })
    await scrollToBottom()
  } catch {
    saveError.value = 'The task could not be saved. Please try again.'
  } finally {
    isSaving.value = false
  }
}

const messages = ref([
  {
    id: 1,
    type: 'text',
    role: 'assistant',
    text: "Hi, I'm Curbi. I'm here if you'd like a small idea or a quick distraction.",
  },
])

let messageId = 2

const scrollToBottom = async () => {
  await nextTick()

  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

const categoryLabels = {
  'body-checking': 'Physical reset',
  reassurance: 'Everyday reset',
  'info-searching': 'Screen break',
  general: 'General activity',
}

const durationLabel = (seconds) => {
  if (seconds < 60) return `${seconds} sec`
  return `${Math.round(seconds / 60)} min`
}

const appendReply = (reply) => {
  if (reply.type === 'suggestion' || reply.type === 'save-offer') {
    messages.value.push({
      id: messageId++,
      type: 'text',
      role: 'assistant',
      text: reply.message,
    })
    messages.value.push({
      id: messageId++,
      type: 'suggestion',
      role: 'assistant',
      suggestion: {
        ...reply.suggestion,
        description: reply.suggestion.body,
        duration: durationLabel(reply.suggestion.durationSeconds),
        categoryLabel: reply.suggestion.categories.length
          ? categoryLabels[reply.suggestion.categories[0]]
          : categoryLabels.general,
      },
    })
    return
  }

  if (reply.type === 'feature-action') {
    messages.value.push({ id: messageId++, type: 'text', role: 'assistant', text: reply.message })
    messages.value.push({
      id: messageId++,
      type: 'feature-action',
      role: 'assistant',
      action: reply.action,
    })
    return
  }

  if (reply.type === 'safe-redirect') {
    messages.value.push({
      id: messageId++,
      type: 'safe-redirect',
      role: 'assistant',
      text: reply.message,
      action: reply.action,
    })
    return
  }

  messages.value.push({ id: messageId++, type: 'text', role: 'assistant', text: reply.message })
}

const sendMessage = async () => {
  const text = inputMessage.value.trim()

  if (!text || isTyping.value) {
    return
  }

  messages.value.push({
    id: messageId++,
    type: 'text',
    role: 'user',
    text,
  })

  inputMessage.value = ''

  await scrollToBottom()

  isTyping.value = true

  try {
    const reply = await sendCompanionMessage(text, conversationHistory.value, {
      personality: selectedPersonality.value,
      customPersonality:
        selectedPersonality.value === 'custom' ? activeCustomPersonality.value : '',
    })
    appendReply(reply)

    if (!['safe-redirect', 'error'].includes(reply.type)) {
      conversationHistory.value = [
        ...conversationHistory.value,
        { role: 'user', content: text },
        { role: 'assistant', content: reply.message },
      ].slice(-8)
    }
  } catch {
    appendReply({
      type: 'error',
      message: 'Curbi is unavailable right now. Please try again shortly.',
    })
  } finally {
    isTyping.value = false
    await scrollToBottom()
  }
}
</script>

<template>
  <aside class="chat-panel" aria-label="Chat with Curbi">
    <header class="chat-header">
      <div>
        <p class="chat-label">CURBI COMPANION</p>
        <h2>Chat with Curbi</h2>
      </div>

      <button type="button" class="close-button" aria-label="Close chat" @click="emit('close')">
        ×
      </button>
    </header>

    <section class="personality-section">
      <button
        type="button"
        class="personality-toggle"
        :aria-expanded="showPersonalities"
        @click="showPersonalities = !showPersonalities"
      >
        <span>Your companion</span>
        <span class="personality-current">
          {{ personalities.find(({ id }) => id === selectedPersonality)?.name }}
        </span>
        <span aria-hidden="true">{{ showPersonalities ? '−' : '+' }}</span>
      </button>

      <div v-if="showPersonalities" class="personality-picker">
        <p class="personality-intro">Choose the kind of companion you would like to chat with.</p>
        <div class="personality-options" role="group" aria-label="Companion personality">
          <button
            v-for="personality in personalities"
            :key="personality.id"
            type="button"
            class="personality-option"
            :class="{ selected: selectedPersonality === personality.id }"
            :aria-pressed="selectedPersonality === personality.id"
            @click="selectPersonality(personality.id)"
          >
            <span class="personality-icon" aria-hidden="true">{{ personality.icon }}</span>
            <span class="personality-option-copy">
              <strong>{{ personality.name }}</strong>
              <small>{{ personality.description }}</small>
            </span>
            <span
              v-if="selectedPersonality === personality.id"
              class="personality-check"
              aria-label="Selected"
            >
              ✓
            </span>
          </button>
        </div>

        <div v-if="selectedPersonality === 'custom'" class="custom-personality">
          <label for="curbi-custom-personality">Describe the style you would enjoy</label>
          <textarea
            id="curbi-custom-personality"
            v-model="customPersonalityDraft"
            maxlength="500"
            rows="3"
            placeholder="For example: Be a cozy, gentle friend who keeps replies short."
          ></textarea>
          <p class="personality-safety-note">
            Custom styles change tone only. Curbi's wellbeing safety rules always stay in place.
          </p>
          <button
            type="button"
            class="save-personality-button"
            :disabled="customPersonalityDraft.trim() === activeCustomPersonality"
            @click="saveCustomPersonality"
          >
            {{ customPersonalityDraft.trim() === activeCustomPersonality ? 'Saved' : 'Save style' }}
          </button>
        </div>
        <p v-else class="personality-safety-note">
          Every personality follows the same wellbeing safety rules.
        </p>
      </div>
    </section>

    <div ref="messageList" class="message-list">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-row"
        :class="`message-${message.role}`"
      >
        <div
          v-if="message.type === 'text' || message.type === 'status'"
          class="message-bubble"
          :class="{ 'status-bubble': message.type === 'status' }"
          :role="message.type === 'status' ? 'status' : undefined"
          :aria-live="message.type === 'status' ? 'polite' : undefined"
        >
          {{ message.text }}
        </div>

        <CopingSuggestionCard
          v-else-if="message.type === 'suggestion'"
          :title="message.suggestion.title"
          :description="message.suggestion.description"
          :duration="message.suggestion.duration"
          :category="message.suggestion.categoryLabel"
          @request-save="requestSaveSuggestion(message.suggestion)"
        />

        <FeatureActionCard
          v-else-if="message.type === 'feature-action'"
          :title="message.action.title"
          :description="message.action.description"
          :label="message.action.label"
          :icon="message.action.icon"
          @select="goToFeature(message.action.route)"
        />

        <SafeRedirectCard
          v-else-if="message.type === 'safe-redirect'"
          :message="message.text"
          :label="message.action.label"
          @find-support="goToHelpFinder"
        />
      </div>

      <div v-if="isTyping" class="message-row message-assistant">
        <div class="message-bubble typing-bubble">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <form class="chat-input-row" @submit.prevent="sendMessage">
      <label for="curbi-chat-input" class="sr-only"> Message Curbi </label>

      <input
        id="curbi-chat-input"
        v-model="inputMessage"
        type="text"
        placeholder="Ask Curbi for a small idea..."
        autocomplete="off"
      />

      <button type="submit" class="send-button" :disabled="!inputMessage.trim() || isTyping">
        Send
      </button>
    </form>
    <SaveSuggestionConfirm
      v-if="pendingSuggestion"
      :suggestion="pendingSuggestion"
      :saving="isSaving"
      :error="saveError"
      @cancel="cancelSaveSuggestion"
      @confirm="confirmSaveSuggestion"
    />
  </aside>
</template>

<style scoped>
.chat-panel {
  position: fixed;
  right: 32px;
  bottom: 240px;
  z-index: 40;

  width: min(390px, calc(100vw - 40px));
  height: 520px;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border: 1px solid #d8e5da;
  border-radius: 24px;

  background: rgba(250, 253, 250, 0.98);

  box-shadow: 0 24px 70px rgba(41, 72, 52, 0.18);
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 20px 20px 16px;

  border-bottom: 1px solid #e3ece4;
}

.chat-label {
  margin: 0 0 4px;

  color: #6c8773;

  font-size: 10px;
  font-weight: 700;

  letter-spacing: 1.8px;
}

.chat-header h2 {
  margin: 0;

  color: #203b2b;

  font-size: 20px;
  font-weight: 600;
}

.personality-section {
  border-bottom: 1px solid #e3ece4;
}

.personality-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 0;
  background: #f5f9f5;
  color: #45624f;
  font-size: 12px;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}

.personality-toggle span:first-child {
  flex: 1;
}

.personality-current {
  padding: 2px 7px;
  border-radius: 999px;
  background: #e1eee3;
  color: #3d674e;
  font-size: 10px;
  text-transform: uppercase;
}

.personality-picker {
  padding: 12px 16px;
  background: #fbfdfb;
}

.personality-intro {
  margin: 0 0 9px;
  color: #536d5b;
  font-size: 12px;
}

.personality-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.personality-option {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px;
  border: 1px solid #d7e4d9;
  border-radius: 12px;
  background: #fff;
  color: #365640;
  text-align: left;
  cursor: pointer;
}

.personality-option.selected {
  border-color: #6f9479;
  background: #edf5ee;
  box-shadow: 0 0 0 1px #6f9479;
}

.personality-icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.personality-option-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.personality-option-copy strong {
  font-size: 11px;
}

.personality-option-copy small {
  color: #718b78;
  font-size: 9px;
  line-height: 1.3;
}

.personality-check {
  margin-left: auto;
  color: #47765a;
  font-weight: 700;
}

.custom-personality {
  margin-top: 10px;
}

.custom-personality label {
  display: block;
  margin-bottom: 6px;
  color: #536d5b;
  font-size: 12px;
}

.custom-personality textarea {
  width: 100%;
  resize: vertical;
  padding: 9px 11px;
  border: 1px solid #cfddd2;
  border-radius: 12px;
  color: #294535;
  font: inherit;
  font-size: 13px;
}

.personality-safety-note {
  margin: 9px 0 0;
  color: #718b78;
  font-size: 10px;
  line-height: 1.4;
}

.save-personality-button {
  display: block;
  margin: 8px 0 0 auto;
  padding: 5px 12px;
  border: 0;
  border-radius: 999px;
  background: #47765a;
  color: white;
  font-size: 11px;
  cursor: pointer;
}

.save-personality-button:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (max-width: 380px) {
  .personality-options {
    grid-template-columns: 1fr;
  }
}

.close-button {
  width: 36px;
  height: 36px;

  border: 0;
  border-radius: 50%;

  background: #edf4ee;
  color: #45624f;

  font-size: 24px;
  line-height: 1;

  cursor: pointer;
}

.close-button:hover {
  background: #e1ece3;
}

.message-list {
  flex: 1;

  display: flex;
  flex-direction: column;
  gap: 14px;

  overflow-y: auto;

  padding: 20px;
}

.message-row {
  display: flex;
}

.message-assistant {
  justify-content: flex-start;
}

.message-user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 82%;

  padding: 12px 15px;

  border-radius: 18px;

  font-size: 14px;
  line-height: 1.5;
}

.message-assistant .message-bubble {
  border-bottom-left-radius: 6px;

  background: #e8f2e9;
  color: #294535;
}

.message-user .message-bubble {
  border-bottom-right-radius: 6px;

  background: #47765a;
  color: white;
}

.message-assistant .status-bubble {
  border: 1px solid #bcd6c2;
  background: #f4faf5;
  font-weight: 650;
}

.chat-input-row {
  display: flex;
  gap: 10px;

  padding: 16px;

  border-top: 1px solid #e3ece4;

  background: #fbfdfb;
}

.chat-input-row input {
  flex: 1;
  min-width: 0;

  padding: 11px 14px;

  border: 1px solid #cfddd2;
  border-radius: 999px;

  background: white;
  color: #294535;

  outline: none;
}

.chat-input-row input:focus {
  border-color: #6f9479;

  box-shadow: 0 0 0 3px rgba(111, 148, 121, 0.14);
}

.send-button {
  min-width: 64px;

  padding: 10px 16px;

  border: 0;
  border-radius: 999px;

  background: #47765a;
  color: white;

  font-weight: 600;

  cursor: pointer;
}

.send-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;

  min-width: 54px;
}

.typing-bubble span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #789381;

  animation: typing-dot 1s infinite ease-in-out;
}

.typing-bubble span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-bubble span:nth-child(3) {
  animation-delay: 0.3s;
}

.sr-only {
  position: absolute;

  width: 1px;
  height: 1px;

  padding: 0;
  margin: -1px;

  overflow: hidden;
  clip: rect(0, 0, 0, 0);

  white-space: nowrap;

  border: 0;
}

@keyframes typing-dot {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (max-width: 700px) {
  .chat-panel {
    right: 12px;
    bottom: 184px;

    width: calc(100vw - 24px);
    height: min(520px, calc(100vh - 220px));

    border-radius: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-bubble span {
    animation: none;
  }
}
</style>
