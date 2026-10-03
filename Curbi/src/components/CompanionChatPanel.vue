<script setup>
import { nextTick, ref } from 'vue'

const emit = defineEmits(['close'])

const inputMessage = ref('')
const isTyping = ref(false)
const messageList = ref(null)

const messages = ref([
  {
    id: 1,
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

const sendMessage = async () => {
  const text = inputMessage.value.trim()

  if (!text || isTyping.value) {
    return
  }

  messages.value.push({
    id: messageId++,
    role: 'user',
    text,
  })

  inputMessage.value = ''

  await scrollToBottom()

  isTyping.value = true

  setTimeout(async () => {
    messages.value.push({
      id: messageId++,
      role: 'assistant',
      text: "I'm here with you. We can find something small and manageable to do next.",
    })

    isTyping.value = false

    await scrollToBottom()
  }, 900)
}
</script>

<template>
  <aside class="chat-panel" aria-label="Chat with Curbi">
    <header class="chat-header">
      <div>
        <p class="chat-label">CURBI COMPANION</p>
        <h2>Chat with Curbi</h2>
      </div>

      <button
        type="button"
        class="close-button"
        aria-label="Close chat"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <div ref="messageList" class="message-list">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-row"
        :class="`message-${message.role}`"
      >
        <div class="message-bubble">
          {{ message.text }}
        </div>
      </div>

      <div
        v-if="isTyping"
        class="message-row message-assistant"
      >
        <div class="message-bubble typing-bubble">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <form class="chat-input-row" @submit.prevent="sendMessage">
      <label for="curbi-chat-input" class="sr-only">
        Message Curbi
      </label>

      <input
        id="curbi-chat-input"
        v-model="inputMessage"
        type="text"
        placeholder="Ask Curbi for a small idea..."
        autocomplete="off"
      />

      <button
        type="submit"
        class="send-button"
        :disabled="!inputMessage.trim() || isTyping"
      >
        Send
      </button>
    </form>
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

  box-shadow:
    0 24px 70px
    rgba(41, 72, 52, 0.18);
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

  box-shadow:
    0 0 0 3px
    rgba(111, 148, 121, 0.14);
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