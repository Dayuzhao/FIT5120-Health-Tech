const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function sendCompanionMessage(
  message,
  history = [],
  { personality = 'gentle', customPersonality = '', timeoutMs = 18000 } = {},
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/companion/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        personality,
        custom_personality: customPersonality,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Companion request failed with status ${response.status}`)
    }

    return response.json()
  } finally {
    clearTimeout(timer)
  }
}
