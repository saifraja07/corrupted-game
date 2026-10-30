import { createPuzzle, PUZZLE_STATUS } from './Puzzle.js'
import { puzzleRegistry } from './puzzleRegistry.js'

// Owns the live puzzle instances for the current level. Routes gameplay events to active puzzles,
// tracks which are complete, and tears everything down when a level unloads.
export function createPuzzleManager({ registry = puzzleRegistry, scheduler } = {}) {
  const instances = new Map()
  const completed = new Set()
  const subscribers = new Set()

  const publish = (event) => {
    for (const cb of [...subscribers]) {
      try {
        cb(event)
      } catch (err) {
        console.error('[puzzle-manager] subscriber error', err)
      }
    }
  }

  return {
    // Create + init + activate. Loading the same id twice returns the existing instance (no duplicates).
    load(id) {
      const existing = instances.get(id)
      if (existing) return existing
      const def = registry.get(id)
      if (!def) throw new Error(`Unknown puzzle "${id}"`)
      const puzzle = createPuzzle(def, { scheduler })
      puzzle.on('*', (type, payload) => {
        if (type === 'completed') {
          if (completed.has(id)) return // never announce the same completion twice
          completed.add(id)
          publish({ puzzleId: id, type: 'puzzleCompleted', payload })
        } else {
          publish({ puzzleId: id, type, payload })
        }
      })
      instances.set(id, puzzle)
      puzzle.init()
      puzzle.activate()
      return puzzle
    },
    get: (id) => instances.get(id),

    // Send a gameplay event to every active puzzle. Returns how many handled it.
    dispatch(type, payload) {
      let handled = 0
      for (const p of [...instances.values()]) if (p.dispatch(type, payload)) handled++
      return handled
    },

    // Restore initial state and re-activate. Clears completion so it can be earned again.
    reset(id) {
      const p = instances.get(id)
      if (!p || !p.reset()) return false
      completed.delete(id)
      return p.activate()
    },
    resetAll() {
      for (const id of [...instances.keys()]) this.reset(id)
    },

    unload(id) {
      const p = instances.get(id)
      if (!p) return false
      p.cleanup()
      instances.delete(id)
      completed.delete(id)
      return true
    },
    // Level exit: nothing may stay active, subscribed or scheduled.
    unloadAll() {
      for (const p of instances.values()) p.cleanup()
      instances.clear()
      completed.clear()
    },

    isCompleted: (id) => completed.has(id),
    areAllCompleted: (ids) => ids.length > 0 && ids.every((id) => completed.has(id)),
    getCompleted: () => [...completed],
    activeIds: () => [...instances.values()].filter((p) => p.status === PUZZLE_STATUS.ACTIVE).map((p) => p.id),

    // cb({ puzzleId, type, payload }); returns unsubscribe. Types include puzzleCompleted, failed,
    // progress, reset and any custom event a puzzle emits (e.g. 'dialogue').
    subscribe(cb) {
      subscribers.add(cb)
      return () => subscribers.delete(cb)
    },
    dispose() {
      this.unloadAll()
      subscribers.clear()
    },
  }
}
