import { describe, it, expect } from 'vitest'
import { LEVELS, getLevel, getLevelNumber, getNextLevelId, getFirstLevelId, isValidLevelId } from '../../src/game/config/levels.js'
import { sanitizeProgress, getContinueLevelId } from '../../src/game/state/progress.js'
import { createProgressStore, loadProgress } from '../../src/game/state/progressStore.js'
import { createGameStore } from '../../src/game/state/gameStore.js'
import { LEVEL_COMPONENTS } from '../../src/game/levels/levelComponents.js'
import { GAME_STATES as S } from '../../src/game/core/GameConfig.js'

const IDS = LEVELS.map((l) => l.id)
const [L1, L2] = IDS
const LAST = IDS[IDS.length - 1]

describe('level config', () => {
  it('has unique ids and a component for every level (and no stray components)', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
    expect(Object.keys(LEVEL_COMPONENTS).sort()).toEqual(LEVELS.map((l) => l.id).sort())
  })
  it('orders levels and reports numbers, next ids and validity', () => {
    expect(getFirstLevelId()).toBe(L1)
    expect(getNextLevelId(L1)).toBe(L2)
    expect(getNextLevelId(L2)).toBe(IDS[2])
    expect(getNextLevelId(LAST)).toBe(null)
    expect(getNextLevelId('nope')).toBe(null)
    expect(getLevelNumber(L2)).toBe(2)
    expect(getLevelNumber('nope')).toBe(null)
    expect(isValidLevelId('nope')).toBe(false)
    expect(getLevel(L1).name).toBe('The Obvious Door')
  })
})

describe('progress save data', () => {
  it('falls back to empty progress on garbage', () => {
    for (const bad of [null, undefined, 5, 'x', {}, { completedLevelIds: 'level01' }, { completedLevelIds: [1, null] }]) {
      expect(sanitizeProgress(bad)).toEqual({ completedLevelIds: [] })
    }
  })
  it('keeps only an in-order prefix of known levels, without duplicates', () => {
    expect(sanitizeProgress({ completedLevelIds: [L2] }).completedLevelIds).toEqual([]) // skipped level 1
    expect(sanitizeProgress({ completedLevelIds: ['ghost', L1, L1] }).completedLevelIds).toEqual([L1])
    expect(sanitizeProgress({ completedLevelIds: [L2, L1] }).completedLevelIds).toEqual([L1, L2])
  })
  it('chooses what Continue should start', () => {
    expect(getContinueLevelId([])).toBe(null)
    expect(getContinueLevelId([L1])).toBe(L2)
    expect(getContinueLevelId(IDS)).toBe(null) // everything finished
  })
  it('loadProgress survives corrupt storage and valid storage', () => {
    expect(loadProgress({ getItem: () => '{broken' })).toEqual({ completedLevelIds: [] })
    expect(loadProgress({ getItem: () => JSON.stringify({ completedLevelIds: [L1] }) })).toEqual({ completedLevelIds: [L1] })
  })
  it('the progress store is idempotent and rejects out-of-order or unknown completions', () => {
    const p = createProgressStore({ completedLevelIds: [] })
    expect(p.getState().completeLevel('ghost')).toBe(false)
    expect(p.getState().completeLevel(L2)).toBe(false) // can't finish level 2 first
    expect(p.getState().completeLevel(L1)).toBe(true)
    expect(p.getState().completeLevel(L1)).toBe(false)
    expect(p.getState().completeLevel(L2)).toBe(true)
    expect(p.getState().completedLevelIds).toEqual([L1, L2])
    p.getState().resetProgress()
    expect(p.getState().completedLevelIds).toEqual([])
  })
})

describe('gameStore level flow', () => {
  const atComplete = (id = L1) => {
    const g = createGameStore()
    g.getState().startGame(id)
    g.getState().finishTransition()
    g.getState().levelComplete()
    return g
  }
  it('rejects unknown levels', () => {
    const g = createGameStore()
    expect(g.getState().startGame('ghost')).toBe(false)
    expect(g.getState().status).toBe(S.MAIN_MENU)
  })
  it('can start any valid level directly (Continue)', () => {
    const g = createGameStore()
    expect(g.getState().startGame(L2)).toBe(true)
    expect(g.getState().levelId).toBe(L2)
  })
  it('nextLevel advances, bumps runId and resets per-level state', () => {
    const g = atComplete(L1)
    g.getState().markPuzzleComplete('x')
    const run = g.getState().runId
    expect(g.getState().nextLevel()).toBe(true)
    expect(g.getState().levelId).toBe(L2)
    expect(g.getState().status).toBe(S.TRANSITIONING)
    expect(g.getState().runId).toBe(run + 1)
    expect(g.getState().completedPuzzles).toEqual([])
    expect(g.getState().finishTransition()).toBe(true)
  })
  it('nextLevel is rejected on the last level and outside the completion screen', () => {
    expect(atComplete(LAST).getState().nextLevel()).toBe(false)
    const g = createGameStore()
    g.getState().startGame(L1)
    g.getState().finishTransition()
    expect(g.getState().nextLevel()).toBe(false) // still playing
  })
  it('replay after completion keeps the same level', () => {
    const g = atComplete(L2)
    expect(g.getState().restartLevel()).toBe(true)
    expect(g.getState().levelId).toBe(L2)
  })
})
