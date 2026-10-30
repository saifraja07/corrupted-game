import { validatePuzzleDefinition } from './Puzzle.js'

// Maps puzzle id -> definition. New puzzles register themselves; nothing else needs editing.
export function createPuzzleRegistry() {
  const defs = new Map()
  return {
    register(def) {
      validatePuzzleDefinition(def)
      if (defs.has(def.id)) throw new Error(`Puzzle "${def.id}" is already registered`)
      defs.set(def.id, def)
      return def
    },
    get: (id) => defs.get(id),
    has: (id) => defs.has(id),
    ids: () => [...defs.keys()],
  }
}

export const puzzleRegistry = createPuzzleRegistry()
export const registerPuzzle = (def) => puzzleRegistry.register(def)
