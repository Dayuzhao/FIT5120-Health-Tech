import { db } from '@/db'

const ALLOWED_CATEGORIES = new Set(['body-checking', 'reassurance', 'info-searching'])

export async function saveAiSuggestedTask(suggestion) {
  const title = String(suggestion?.title ?? '').trim()
  const body = String(suggestion?.body ?? suggestion?.description ?? '').trim()
  const durationSeconds = Number(suggestion?.durationSeconds)
  const categories = suggestion?.categories

  if (!title || !body || !Number.isInteger(durationSeconds)) {
    throw new Error('The suggestion is incomplete')
  }

  if (durationSeconds < 30 || durationSeconds > 900) {
    throw new Error('The suggestion duration is outside the allowed range')
  }

  if (
    !Array.isArray(categories) ||
    categories.length > 2 ||
    categories.some((category) => !ALLOWED_CATEGORIES.has(category))
  ) {
    throw new Error('The suggestion category is not allowed')
  }

  return db.tasks.add({
    title,
    body,
    categories: [...categories],
    durationSeconds,
    source: 'ai-suggested',
    active: true,
    createdAt: Date.now(),
  })
}
