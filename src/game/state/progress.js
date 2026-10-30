import { LEVELS, getNextLevelId } from '../config/levels.js'

// Pure save-data helpers. Saved data is untrusted: only a valid, in-order prefix of the level list
// is kept (you can't have finished level 2 without level 1), unknown/duplicate ids are dropped.
export function sanitizeProgress(raw) {
  const saved = raw && typeof raw === 'object' && Array.isArray(raw.completedLevelIds) ? new Set(raw.completedLevelIds) : new Set()
  const completedLevelIds = []
  for (const level of LEVELS) {
    if (!saved.has(level.id)) break
    completedLevelIds.push(level.id)
  }
  return { completedLevelIds }
}

// Level a "Continue" button should start, or null if nothing was played or everything is finished.
export function getContinueLevelId(completedLevelIds) {
  if (completedLevelIds.length === 0) return null
  return getNextLevelId(completedLevelIds[completedLevelIds.length - 1])
}
