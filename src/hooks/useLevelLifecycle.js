import { useEffect } from 'react'
import { useGameStore } from '../game/state/gameStore.js'

// Starts a level's logic on mount and fully disposes it on unmount (timers, subscriptions, puzzles,
// dialogue). Safe under StrictMode because start()/dispose() cycle cleanly.
export function useLevelLifecycle(logic, objective) {
  useEffect(() => {
    logic.start()
    useGameStore.getState().setObjective(objective)
    return () => {
      logic.dispose()
      useGameStore.getState().setObjective('')
    }
  }, [logic, objective])
}
