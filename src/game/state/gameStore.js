import { create } from 'zustand'
import { GAME_STATES as S } from '../core/GameConfig.js'
import { canTransition } from '../core/GameLifecycle.js'
import { getFirstLevelId, getNextLevelId, isValidLevelId } from '../config/levels.js'

// Low-frequency, shared game state only. No per-frame values here.
export const createGameStore = () =>
  create((set, get) => ({
    status: S.MAIN_MENU,
    levelId: null,
    objective: '',
    corruptionStage: 0,
    completedPuzzles: [],
    runId: 0, // increments on every (re)start so level scenes remount from pristine state

    // Returns true if the transition happened; invalid ones are ignored.
    transitionTo: (next) => {
      if (!canTransition(get().status, next)) return false
      set({ status: next })
      return true
    },

    startGame: (levelId = getFirstLevelId()) => {
      if (!isValidLevelId(levelId)) return false
      const { transitionTo } = get()
      if (!transitionTo(S.TRANSITIONING)) return false
      set({ levelId, corruptionStage: 0, completedPuzzles: [], runId: get().runId + 1 })
      return true
    },
    // Restart the current level from pause or the completion screen.
    restartLevel: () => {
      const { status, levelId } = get()
      if (!levelId || (status !== S.PAUSED && status !== S.LEVEL_COMPLETE)) return false
      if (!get().transitionTo(S.TRANSITIONING)) return false
      set({ objective: '', completedPuzzles: [], runId: get().runId + 1 })
      return true
    },
    // Advance after completing a level. False on the last level or outside the completion screen.
    nextLevel: () => {
      const { status, levelId } = get()
      const next = getNextLevelId(levelId)
      if (status !== S.LEVEL_COMPLETE || !next) return false
      if (!get().transitionTo(S.TRANSITIONING)) return false
      set({ levelId: next, objective: '', completedPuzzles: [], runId: get().runId + 1 })
      return true
    },
    // After the LAST level only: go to the ending. Guarded like every other transition.
    beginEnding: () => {
      const { status, levelId } = get()
      if (status !== S.LEVEL_COMPLETE || getNextLevelId(levelId)) return false
      return get().transitionTo(S.ENDING)
    },
    // Guarded: a level can only complete once per run.
    levelComplete: () => get().transitionTo(S.LEVEL_COMPLETE),
    // Called when the transition screen finishes.
    finishTransition: () => get().transitionTo(S.PLAYING),
    pause: () => get().transitionTo(S.PAUSED),
    resume: () => get().transitionTo(S.PLAYING),
    quitToMenu: () => {
      if (!get().transitionTo(S.MAIN_MENU)) return false
      set({ levelId: null, objective: '', corruptionStage: 0, completedPuzzles: [] })
      return true
    },
    setObjective: (objective) => set({ objective }),
    setCorruptionStage: (stage) => {
      const next = Math.max(0, Math.min(3, Math.trunc(stage) || 0))
      if (get().corruptionStage !== next) set({ corruptionStage: next })
    },
    // Idempotent: marking the same puzzle twice has no effect.
    markPuzzleComplete: (id) => {
      if (get().completedPuzzles.includes(id)) return false
      set({ completedPuzzles: [...get().completedPuzzles, id] })
      return true
    },
  }))

export const useGameStore = createGameStore()
