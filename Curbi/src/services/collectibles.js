// Collectibles unlocked at completion milestones (Epic 8), kept in the on-device
// Dexie database. What a user is owed depends only on how many pauses they have
// completed — never on a score, mood or streak — and a collectible, once
// unlocked, is never removed.

import { db } from '@/db'
import { fetchSpecies } from '@/services/species'

const FIRST_MILESTONES = [1, 3, 5, 10]
const REPEAT_EVERY = 5

// How many collectibles a user has earned after `pauses` completions:
// the 1st, 3rd, 5th and 10th, then one more every 5th (15, 20, 25, ...).
export function collectiblesEarned(pauses) {
  const fixed = FIRST_MILESTONES.filter((milestone) => pauses >= milestone).length
  const repeating = pauses > 10 ? Math.floor((pauses - 10) / REPEAT_EVERY) : 0

  return fixed + repeating
}

// How close the user is to their next collectible: { previous, next, remaining,
// fraction }. Used for the "3 / 5" bar, so it follows the same milestones as
// collectiblesEarned(). `fraction` is cumulative (pauses / next): it keeps
// growing as pauses are added and only drops when a milestone is reached and the
// target moves further away (5 / 5 becomes 5 / 10).
export function collectibleProgress(pauses) {
  const last = FIRST_MILESTONES[FIRST_MILESTONES.length - 1]
  let previous
  let next

  if (pauses < last) {
    previous = Math.max(0, ...FIRST_MILESTONES.filter((milestone) => milestone <= pauses))
    next = FIRST_MILESTONES.find((milestone) => milestone > pauses)
  } else {
    previous = last + Math.floor((pauses - last) / REPEAT_EVERY) * REPEAT_EVERY
    next = previous + REPEAT_EVERY
  }

  return {
    previous,
    next,
    remaining: next - pauses,
    fraction: pauses / next,
  }
}

async function countPauses() {
  const tasks = await db.taskCompletions.count()
  const games = await db.gameCompletions.count()

  return tasks + games
}

// Unlock whatever the user is owed, picking each species at random from the ones
// they do not have yet.
//
// What is owed comes from the completion count, so nothing is lost if the
// species list cannot be fetched (offline, API down): the entitlement stays, and
// the draw happens the next time this runs with a connection.
//
// Returns { drawn, pending }: `drawn` are the species unlocked just now, and
// `pending` is how many are owed but could not be drawn yet.
export async function drawOwedCollectibles() {
  const owedBefore = collectiblesEarned(await countPauses()) - (await db.collectibles.count())

  if (owedBefore <= 0) {
    return { drawn: [], pending: 0 }
  }

  let species

  try {
    // Short timeout: this runs right after a completion and must not hang it.
    species = await fetchSpecies({ timeoutMs: 3000 })
  } catch (error) {
    // Expected when offline: the collectible stays owed and is drawn later.
    console.warn('Unable to draw a collectible yet:', error)
    return { drawn: [], pending: owedBefore }
  }

  // Re-read the counts inside the transaction so two tabs finishing at once
  // cannot both draw for the same milestone.
  const drawn = await db.transaction(
    'rw',
    db.taskCompletions,
    db.gameCompletions,
    db.collectibles,
    async () => {
      const owned = await db.collectibles.toArray()
      const ownedNames = new Set(owned.map((row) => row.scientificName))
      const pool = species.filter((item) => !ownedNames.has(item.scientificName))

      let owed = collectiblesEarned(await countPauses()) - owned.length
      const picked = []

      // Once every species is collected there is nothing left to give; the
      // milestones keep passing without an error.
      while (owed > 0 && pool.length > 0) {
        const index = Math.floor(Math.random() * pool.length)
        picked.push(pool.splice(index, 1)[0])
        owed -= 1
      }

      const unlockedAt = Date.now()
      await db.collectibles.bulkAdd(
        picked.map((item) => ({ scientificName: item.scientificName, unlockedAt })),
      )

      return picked
    },
  )

  return { drawn, pending: 0 }
}

// Newest first, so the latest unlock is the first thing the collection shows.
export function listCollectibles() {
  return db.collectibles.orderBy('unlockedAt').reverse().toArray()
}
