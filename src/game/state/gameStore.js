import { create } from 'zustand'
import { GAME_STATES as S } from '../core/GameConfig.js'
import { canTransition } from '../core/GameLifecycle.js'
import { getFirstLevelId, getNextLevelId, hasFakeEnding, isValidLevelId } from '../config/levels.js'
import { MAX_INTENSITY } from '../config/corruption.js'

// Low-frequency, shared game state only. No per-frame values here.
export const createGameStore = () =>
  create((set, get) => ({
    status: S.MAIN_MENU,
    levelId: null,
    objective: '',
    corruptionStage: 0,
    corruptionIntensity: 0, // past stage 3 (0..MAX_INTENSITY); only matters at stage 3
    completedPuzzles: [],
    fakeComplete: false, // a FAKE level-complete screen is showing (see fakeLevelComplete)
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
      set({ levelId, corruptionStage: 0, corruptionIntensity: 0, completedPuzzles: [], fakeComplete: false, runId: get().runId + 1 })
      return true
    },
    // Restart the current level from pause or the completion screen.
    restartLevel: () => {
      const { status, levelId } = get()
      if (!levelId || (status !== S.PAUSED && status !== S.LEVEL_COMPLETE)) return false
      if (!get().transitionTo(S.TRANSITIONING)) return false
      set({ objective: '', completedPuzzles: [], fakeComplete: false, runId: get().runId + 1 })
      return true
    },
    // Advance after completing a level. False on the last level or outside the completion screen.
    nextLevel: () => {
      const { status, levelId, fakeComplete } = get()
      const next = getNextLevelId(levelId)
      if (status !== S.LEVEL_COMPLETE || fakeComplete || !next) return false
      if (!get().transitionTo(S.TRANSITIONING)) return false
      set({ levelId: next, objective: '', completedPuzzles: [], runId: get().runId + 1 })
      return true
    },
    // After the LAST level only: go to the ending. Guarded like every other transition.
    beginEnding: () => {
      const { status, levelId, fakeComplete } = get()
      if (status !== S.LEVEL_COMPLETE || fakeComplete || getNextLevelId(levelId)) return false
      return get().transitionTo(S.ENDING)
    },
    // The FALSE ending: only after a level flagged fakeEnding (and that has a next level to carry on to).
    beginFakeEnding: () => {
      const { status, levelId, fakeComplete } = get()
      if (status !== S.LEVEL_COMPLETE || fakeComplete || !hasFakeEnding(levelId) || !getNextLevelId(levelId)) return false
      return get().transitionTo(S.FAKE_ENDING)
    },
    // ...and the game carries on to the next level after all.
    endFakeEnding: () => {
      const { status, levelId } = get()
      const next = getNextLevelId(levelId)
      if (status !== S.FAKE_ENDING || !next) return false
      if (!get().transitionTo(S.TRANSITIONING)) return false
      set({ levelId: next, objective: '', completedPuzzles: [], fakeComplete: false, runId: get().runId + 1 })
      return true
    },
    // A fake "Level complete" screen: shows the real completion UI but records NOTHING and is undone by
    // resumeFromFake(). Real progress is never touched.
    fakeLevelComplete: () => {
      if (get().status !== S.PLAYING || !get().transitionTo(S.LEVEL_COMPLETE)) return false
      set({ fakeComplete: true })
      return true
    },
    resumeFromFake: () => {
      if (get().status !== S.LEVEL_COMPLETE || !get().fakeComplete) return false
      if (!get().transitionTo(S.PLAYING)) return false
      set({ fakeComplete: false })
      return true
    },
    // Guarded: a level can only complete once per run.
    levelComplete: () => {
      if (!get().transitionTo(S.LEVEL_COMPLETE)) return false
      set({ fakeComplete: false })
      return true
    },
    // Called when the transition screen finishes.
    finishTransition: () => get().transitionTo(S.PLAYING),
    pause: () => get().transitionTo(S.PAUSED),
    resume: () => get().transitionTo(S.PLAYING),
    quitToMenu: () => {
      if (!get().transitionTo(S.MAIN_MENU)) return false
      set({ levelId: null, objective: '', corruptionStage: 0, corruptionIntensity: 0, completedPuzzles: [], fakeComplete: false })
      return true
    },
    setObjective: (objective) => set({ objective }),
    setCorruptionIntensity: (value) => {
      const next = Math.max(0, Math.min(MAX_INTENSITY, Math.trunc(value) || 0))
      if (get().corruptionIntensity !== next) set({ corruptionIntensity: next })
    },
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
