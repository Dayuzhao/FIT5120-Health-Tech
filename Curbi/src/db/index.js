// Curbi on-device database (IndexedDB via Dexie).
//
// Everything Curbi stores lives in the visitor's own browser — there is no
// account and no server. This module owns the single database instance and the
// full schema; other parts of the app should `import { db } from '@/db'` and read
// or write, never declare their own Dexie instance.
//
// Version 1 declared every table up front so later features would not force a
// migration; version 2 (Epic 8) adds the progress/collection tables and drops
// `taskScores`, which belonged to Epic 7 (dropped) and was never written to.

import Dexie from 'dexie'
import { seedTasks } from './seed'

export const db = new Dexie('curbi')

db.version(1).stores({
  // Alternative tasks offered when the user wants to redirect a checking urge.
  // { title, body, source: 'seed' | 'user' | 'ai-suggested', active: boolean, createdAt: number }
  tasks: '++id, active',

  // One row each time the user opens the app to redirect an urge (Epic 1).
  // { startedAt, endedAt, taskId, outcome: 'completed' | 'skipped' | 'abandoned' | null }
  urgeEvents: '++id, startedAt, taskId',

  // One row per completed task: purely objective, nothing about how the user
  // feels. Rows written before Epic 7 was dropped may carry `reliefScore: null`;
  // it is never read or written any more.
  // { urgeEventId, taskId, completedAt }
  taskCompletions: '++id, taskId, urgeEventId, completedAt',

  taskScores: 'taskId',
})

db.version(2).stores({
  tasks: '++id, active',
  urgeEvents: '++id, startedAt, taskId',
  taskCompletions: '++id, taskId, urgeEventId, completedAt',

  // `null` deletes the Epic 7 table.
  taskScores: null,

  // One row per finished round of Leaf Tap (Epic 8). A task completion and a
  // game completion both count as one "pause" toward progress and milestones.
  // { completedAt }
  gameCompletions: '++id, completedAt',

  // Species unlocked at a completion milestone (Epic 8). Keyed by scientific
  // name so a species can never be unlocked twice; rows are never deleted.
  // { scientificName, unlockedAt }
  collectibles: 'scientificName, unlockedAt',
})

// Populate the starter task list on first run. Safe to call on every app start —
// it does nothing once tasks already exist. The app should call this once during
// startup, before the task screens read `tasks`.
export async function ensureSeeded() {
  const count = await db.tasks.count()

  if (count > 0) {
    return
  }

  const now = Date.now()

  await db.tasks.bulkAdd(
    seedTasks.map((task) => ({
      ...task,
      source: 'seed',
      active: true,
      createdAt: now,
    })),
  )
}
