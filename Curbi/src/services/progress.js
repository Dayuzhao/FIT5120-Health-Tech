// Objective completion progress (Epic 8), read from the on-device Dexie
// database only. Nothing here looks at how the user feels, and nothing is sent
// to the server.

import { db } from '@/db'

// A finished task and a finished round of Leaf Tap each count as one "pause".
// The same total drives the progress page and, later, the milestone unlocks.
export async function getCompletionCount() {
  const [tasks, games] = await Promise.all([
    db.taskCompletions.count(),
    db.gameCompletions.count(),
  ])

  return tasks + games
}

export function recordGameCompletion() {
  return db.gameCompletions.add({ completedAt: Date.now() })
}
