import { describe, it, expect } from 'vitest'
import { createGameStore } from '../../src/game/state/gameStore.js'
import { canTransition, isGameplayActive } from '../../src/game/core/GameLifecycle.js'
import { GAME_STATES as S } from '../../src/game/core/GameConfig.js'

describe('lifecycle table', () => {
  it('rejects menu -> playing directly', () => {
    expect(canTransition(S.MAIN_MENU, S.PLAYING)).toBe(false)
  })
  it('only PLAYING has active gameplay input', () => {
    for (const s of Object.values(S)) expect(isGameplayActive(s)).toBe(s === S.PLAYING)
  })
})

describe('gameStore', () => {
  it('goes menu -> transitioning -> playing', () => {
    const g = createGameStore()
    expect(g.getState().startGame('level01')).toBe(true)
    expect(g.getState().status).toBe(S.TRANSITIONING)
    expect(g.getState().finishTransition()).toBe(true)
    expect(g.getState().status).toBe(S.PLAYING)
  })
  it('cannot start twice or pause from the menu', () => {
    const g = createGameStore()
    expect(g.getState().pause()).toBe(false)
    g.getState().startGame()
    expect(g.getState().startGame()).toBe(false)
  })
  it('pause/resume round trip and quit resets level', () => {
    const g = createGameStore()
    g.getState().startGame('level01')
    g.getState().finishTransition()
    expect(g.getState().pause()).toBe(true)
    expect(g.getState().resume()).toBe(true)
    expect(g.getState().quitToMenu()).toBe(true)
    expect(g.getState().status).toBe(S.MAIN_MENU)
    expect(g.getState().levelId).toBe(null)
  })
  it('cannot resume when not paused', () => {
    const g = createGameStore()
    expect(g.getState().resume()).toBe(false)
  })
})

describe('level restart and completion', () => {
  const playing = () => {
    const g = createGameStore()
    g.getState().startGame('level01')
    g.getState().finishTransition()
    return g
  }
  it('startGame bumps runId so scenes remount fresh', () => {
    const g = createGameStore()
    expect(g.getState().runId).toBe(0)
    g.getState().startGame()
    expect(g.getState().runId).toBe(1)
  })
  it('levelComplete only succeeds once per run', () => {
    const g = playing()
    expect(g.getState().levelComplete()).toBe(true)
    expect(g.getState().levelComplete()).toBe(false)
    expect(g.getState().status).toBe(S.LEVEL_COMPLETE)
  })
  it('a level can complete while the pause menu is open', () => {
    const g = playing()
    g.getState().pause()
    expect(g.getState().levelComplete()).toBe(true)
  })
  it('restartLevel works from pause and completion, clears progress, and bumps runId', () => {
    const g = playing()
    g.getState().markPuzzleComplete('p')
    g.getState().pause()
    expect(g.getState().restartLevel()).toBe(true)
    expect(g.getState().status).toBe(S.TRANSITIONING)
    expect(g.getState().completedPuzzles).toEqual([])
    expect(g.getState().runId).toBe(2)
    g.getState().finishTransition()
    g.getState().levelComplete()
    expect(g.getState().restartLevel()).toBe(true)
    expect(g.getState().runId).toBe(3)
  })
  it('restartLevel is rejected while playing or at the menu', () => {
    expect(createGameStore().getState().restartLevel()).toBe(false)
    expect(playing().getState().restartLevel()).toBe(false)
  })
})
