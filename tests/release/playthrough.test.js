import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LEVELS } from '../../src/game/config/levels.js'
import { LEVEL_BASE_STAGE } from '../../src/game/config/corruption.js'
import { GAME_STATES as S } from '../../src/game/core/GameConfig.js'
import { createLevelCallbacks } from '../../src/game/levels/levelCallbacks.js'
import { useGameStore } from '../../src/game/state/gameStore.js'
import { useProgressStore } from '../../src/game/state/progressStore.js'
import { useDialogueStore } from '../../src/game/state/dialogueStore.js'
import { getContinueLevelId } from '../../src/game/state/progress.js'
import { resetCorruption } from '../../src/game/state/corruptionController.js'
import { FACTORIES, SOLVERS } from '../helpers/levelSolvers.js'

const game = () => useGameStore.getState()
const progress = () => useProgressStore.getState()

function resetEverything() {
  game().quitToMenu()
  progress().resetProgress()
  resetCorruption()
  useDialogueStore.getState().setMessage(null)
}
beforeEach(() => {
  vi.useFakeTimers()
  resetEverything()
})
afterEach(() => {
  resetEverything()
  vi.useRealTimers()
})

describe('release: the whole game, start to finish, through the real stores', () => {
  it('plays every level in order, saves progress, reaches the ending, and returns to a clean menu', () => {
    expect(game().status).toBe(S.MAIN_MENU)
    expect(game().startGame(LEVELS[0].id)).toBe(true)

    LEVELS.forEach((level, i) => {
      const id = level.id
      expect(game().levelId).toBe(id)
      expect(game().status).toBe(S.TRANSITIONING)
      expect(game().finishTransition()).toBe(true)
      expect(game().status).toBe(S.PLAYING)

      // What the level scene does on mount.
      const logic = FACTORIES[id](createLevelCallbacks(id))
      logic.start()
      expect(game().corruptionStage).toBe(LEVEL_BASE_STAGE[id])

      expect(SOLVERS[id](logic)).toBe(true)
      vi.advanceTimersByTime(5000)

      // Completion happened exactly once and was recorded everywhere it should be.
      expect(game().status).toBe(S.LEVEL_COMPLETE)
      expect(progress().completedLevelIds).toEqual(LEVELS.slice(0, i + 1).map((l) => l.id))
      expect(game().completedPuzzles.length).toBe(1)
      expect(game().levelComplete()).toBe(false)

      logic.dispose() // what unmounting the scene does
      expect(useDialogueStore.getState().message).toBe(null)

      if (i < LEVELS.length - 1) {
        expect(game().beginEnding()).toBe(false) // not the last level yet
        expect(game().nextLevel()).toBe(true)
      } else {
        expect(game().nextLevel()).toBe(false)
        expect(game().beginEnding()).toBe(true)
      }
    })

    expect(game().status).toBe(S.ENDING)
    expect(progress().completedLevelIds).toEqual(LEVELS.map((l) => l.id))
    expect(getContinueLevelId(progress().completedLevelIds)).toBe(null) // finished: nothing to continue
    expect(game().quitToMenu()).toBe(true)
    expect(game().status).toBe(S.MAIN_MENU)
    expect(game().levelId).toBe(null)
    expect(game().corruptionStage).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('"Continue" resumes at the first unfinished level after a partial playthrough', () => {
    game().startGame(LEVELS[0].id)
    game().finishTransition()
    const logic = FACTORIES.level01(createLevelCallbacks('level01'))
    logic.start()
    SOLVERS.level01(logic)
    vi.advanceTimersByTime(5000)
    logic.dispose()
    game().quitToMenu()
    expect(getContinueLevelId(progress().completedLevelIds)).toBe(LEVELS[1].id)
    expect(game().startGame(getContinueLevelId(progress().completedLevelIds))).toBe(true)
    expect(game().levelId).toBe(LEVELS[1].id)
  })

  it('quitting or restarting mid-level never records progress', () => {
    game().startGame('level03')
    game().finishTransition()
    const logic = FACTORIES.level03(createLevelCallbacks('level03'))
    logic.start()
    logic.update({ x: 0, z: 1 }) // controls reversed, nothing solved
    game().pause()
    expect(game().restartLevel()).toBe(true)
    logic.dispose()
    expect(logic.isReversed()).toBe(false)
    expect(progress().completedLevelIds).toEqual([])
    vi.advanceTimersByTime(60000)
    expect(game().status).toBe(S.TRANSITIONING)
  })
})

describe('release: no leaks across repeated level entry and exit', () => {
  for (const level of LEVELS) {
    it(`${level.id}: 40 start/solve/dispose cycles leave no timers and never fire a stale completion`, () => {
      const onLevelComplete = vi.fn()
      const logic = FACTORIES[level.id]({ onLevelComplete })
      for (let i = 0; i < 40; i++) {
        expect(logic.start()).toBe(true)
        expect(SOLVERS[level.id](logic)).toBe(true) // schedules completion, hint and dialogue timers
        expect(logic.dispose()).toBe(true) // ... then the level is left before any of them fire
      }
      expect(vi.getTimerCount()).toBe(0)
      vi.advanceTimersByTime(120000)
      expect(onLevelComplete).not.toHaveBeenCalled()
    })
  }
})
