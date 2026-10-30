import { create } from 'zustand'
import { sanitizeProgress } from './progress.js'
import { isValidLevelId } from '../config/levels.js'
import { LEGACY_STORAGE, STORAGE, readWithLegacyFallback } from '../core/storageKeys.js'

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const text = readWithLegacyFallback(storage, STORAGE.progress, LEGACY_STORAGE.progress)
    return sanitizeProgress(text ? JSON.parse(text) : null)
  } catch {
    return sanitizeProgress(null)
  }
}

function save(progress) {
  try {
    globalThis.localStorage?.setItem(STORAGE.progress, JSON.stringify(progress))
  } catch {
    /* storage unavailable; progress just won't persist */
  }
}

export const createProgressStore = (initial = loadProgress()) =>
  create((set, get) => ({
    ...initial,
    // Idempotent. Re-sanitizing keeps the list an in-order prefix.
    completeLevel: (id) => {
      if (!isValidLevelId(id) || get().completedLevelIds.includes(id)) return false
      const next = sanitizeProgress({ completedLevelIds: [...get().completedLevelIds, id] })
      if (next.completedLevelIds.length === get().completedLevelIds.length) return false // out of order
      set(next)
      save(next)
      return true
    },
    resetProgress: () => {
      const next = sanitizeProgress(null)
      set(next)
      save(next)
    },
  }))

export const useProgressStore = createProgressStore()
