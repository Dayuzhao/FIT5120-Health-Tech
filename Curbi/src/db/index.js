// Curbi on-device database (IndexedDB via Dexie).
//
// Everything Curbi stores lives in the visitor's own browser — there is no
// account and no server. This module owns the single database instance and the
// full schema; other parts of the app should `import { db } from '@/db'` and read
// or write, never declare their own Dexie instance.
//
// All four tables are declared in version(1) even though the first stories only
// use some of them, so adding a feature later does not force a schema migration.

import Dexie from 'dexie'
import { seedTasks } from './seed'

export const db = new Dexie('curbi')

db.version(1).stores({
  // Alternative tasks offered when the user wants to redirect a checking urge.
  // { title, body, source: 'seed' | 'user', active: boolean, createdAt: number }
  tasks: '++id, active',

  // One row each time the user opens the app to redirect an urge (Epic 1).
  // { startedAt, endedAt, taskId, outcome: 'completed' | 'skipped' | 'abandoned' | null }
  urgeEvents: '++id, startedAt, taskId',

  // A completed task plus the hidden "did this help" rating (Epic 7).
  // reliefScore is 1..5, or null when the user skipped the rating.
  // { urgeEventId, taskId, completedAt, reliefScore }
  taskCompletions: '++id, taskId, urgeEventId, completedAt',

  // Internal per-task effectiveness summary, one row per task (Epic 7).
  // Maintained from taskCompletions; never shown to the user, and in iteration 1
  // it does not change which task is offered or the task order.
  // { avgScore, sampleCount, updatedAt }
  taskScores: 'taskId',
})

// Populate the starter task list on first run. Safe to call on every app start —
// it does nothing once tasks already exist. The app should call this once during
// startup, before the task screens read `tasks`.
export async function ensureSeeded() {
  const count = await db.tasks.count()
  if (count > 0) return
  const now = Date.now()
  await db.tasks.bulkAdd(
    seedTasks.map((t) => ({ ...t, source: 'seed', active: true, createdAt: now })),
  )
}
