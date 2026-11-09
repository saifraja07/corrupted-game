import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LEVELS, getNextLevelId } from '../../src/game/config/levels.js'
import { GAME_STATES as S } from '../../src/game/core/GameConfig.js'
import { createLevelCallbacks } from '../../src/game/levels/levelCallbacks.js'
import { useGameStore } from '../../src/game/state/gameStore.js'
import { useProgressStore } from '../../src/game/state/progressStore.js'
import { useDialogueStore } from '../../src/game/state/dialogueStore.js'
import { getContinueLevelId } from '../../src/game/state/progress.js'
import { registerMetaExit, triggerMetaExit } from '../../src/game/state/metaExit.js'
import { resetCorruption } from '../../src/game/state/corruptionController.js'
import { FACTORIES, SOLVERS } from '../helpers/levelSolvers.js'

const game = () => useGameStore.getState()
const progress = () => useProgressStore.getState()
const FAKE_END = LEVELS.find((l) => l.fakeEnding).id
const FINAL = LEVELS[LEVELS.length - 1].id

function reset() {
  game().quitToMenu()
  progress().resetProgress()
  resetCorruption()
  useDialogueStore.getState().setMessage(null)
}
beforeEach(() => {
  vi.useFakeTimers()
  reset()
})
afterEach(() => {
  reset()
  vi.useRealTimers()
})

// A real player reaches the finale having finished every level before it (the save only accepts that order).
const finishedEarlierLevels = (id) => {
  for (const level of LEVELS) {
    if (level.id === id) break
    progress().completeLevel(level.id)
  }
}

// Start a level the way the game does and return its running logic.
function enter(id) {
  if (game().status === S.MAIN_MENU) game().startGame(id)
  game().finishTransition()
  const logic = FACTORIES[id](createLevelCallbacks(id))
  logic.start()
  return logic
}

describe('the false ending in the real game flow', () => {
  it('finishing the false-ending level shows a fake ending, then the game carries on to the next level', () => {
    // Level 1 .. up to the false-ending level, quickly, through the real stores.
    game().startGame(LEVELS[0].id)
    for (const level of LEVELS) {
      const logic = enter(level.id)
      expect(SOLVERS[level.id](logic)).toBe(true)
      vi.advanceTimersByTime(5000)
      expect(game().status).toBe(S.LEVEL_COMPLETE)
      logic.dispose()
      if (level.id === FAKE_END) break
      expect(game().nextLevel()).toBe(true)
    }
    expect(game().levelId).toBe(FAKE_END)
    expect(progress().completedLevelIds).toContain(FAKE_END) // the level really was completed and saved
    expect(game().beginEnding()).toBe(false) // it is NOT the true ending
    expect(game().beginFakeEnding()).toBe(true)
    expect(game().status).toBe(S.FAKE_ENDING)
    expect(game().endFakeEnding()).toBe(true) // "Restart"
    expect(game().levelId).toBe(getNextLevelId(FAKE_END))
    expect(game().status).toBe(S.TRANSITIONING)
    // "Continue" on the main menu would now go to the level after the false ending
    game().finishTransition()
    game().quitToMenu()
    expect(getContinueLevelId(progress().completedLevelIds)).toBe(getNextLevelId(FAKE_END))
  })
})

describe('the true finale in the real game flow', () => {
  it('pause, take the pause menu EXIT, resume, and the level completes: then the real ending', () => {
    finishedEarlierLevels(FINAL)
    game().startGame(FINAL)
    const logic = enter(FINAL)
    const off = registerMetaExit(() => logic.useMetaExit()) // what the level scene does on mount

    game().pause() // Escape
    expect(game().status).toBe(S.PAUSED)
    expect(triggerMetaExit()).toBe(true) // the EXIT button
    expect(game().resume()).toBe(true) // the app returns you to the game ...
    vi.advanceTimersByTime(5000) // ... where the level plays out its completion
    expect(game().status).toBe(S.LEVEL_COMPLETE)
    expect(progress().completedLevelIds).toContain(FINAL)
    expect(game().fakeComplete).toBe(false)

    expect(game().beginFakeEnding()).toBe(false) // the final level has no false ending
    expect(game().beginEnding()).toBe(true)
    expect(game().status).toBe(S.ENDING)
    expect(game().quitToMenu()).toBe(true)
    off()
    logic.dispose()
  })

  it('even if the player pauses again while it completes, the level still completes and is saved exactly once', () => {
    finishedEarlierLevels(FINAL)
    game().startGame(FINAL)
    const logic = enter(FINAL)
    const off = registerMetaExit(() => logic.useMetaExit())
    game().pause()
    triggerMetaExit()
    // stays paused: the completion timer still fires and takes the game to the completion screen
    vi.advanceTimersByTime(5000)
    expect(game().status).toBe(S.LEVEL_COMPLETE)
    expect(progress().completedLevelIds.filter((id) => id === FINAL)).toHaveLength(1)
    off()
    logic.dispose()
  })

  it('the save refuses to record the finale if earlier levels were skipped (so progress cannot be faked)', () => {
    game().startGame(FINAL)
    const logic = enter(FINAL)
    logic.useMetaExit()
    vi.advanceTimersByTime(5000)
    expect(game().status).toBe(S.LEVEL_COMPLETE) // the screen still shows ...
    expect(progress().completedLevelIds).toEqual([]) // ... but an out-of-order save is not written
    logic.dispose()
  })

  it('leaving the level removes the EXIT button, so it never shows up in other levels', () => {
    const logic = FACTORIES[FINAL]({})
    logic.start()
    const off = registerMetaExit(() => logic.useMetaExit())
    off() // the scene unmounted
    logic.dispose()
    expect(triggerMetaExit()).toBe(false)
  })
})
