import { create } from 'zustand'

// A bridge between the final level and the pause menu. The finale's (Level 18, id level12) exit is not in the 3D world at all: it is an
// extra EXIT button in the pause menu. The level registers a handler while it is loaded (and removes it when it
// unmounts), and the pause menu shows the button only while one is registered.
let handler = null
export const useMetaExitStore = create(() => ({ available: false }))

// Returns an unregister function. A newer registration replaces an older one; a stale unregister is ignored.
export function registerMetaExit(fn) {
  handler = fn
  useMetaExitStore.setState({ available: true })
  return () => {
    if (handler === fn) {
      handler = null
      useMetaExitStore.setState({ available: false })
    }
  }
}

// Called by the pause menu. Returns true if the level accepted it.
export function triggerMetaExit() {
  return handler ? Boolean(handler()) : false
}
