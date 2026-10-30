import { describe, it, expect, vi } from 'vitest'
import { createPuzzleManager } from '../../src/game/puzzles/PuzzleManager.js'
import { createPuzzleRegistry } from '../../src/game/puzzles/puzzleRegistry.js'
import { createGameStore } from '../../src/game/state/gameStore.js'
import { makeTwoSwitches } from './fixtures.js'

function setup(hooks) {
  const registry = createPuzzleRegistry()
  registry.register(makeTwoSwitches(hooks))
  registry.register({
    id: 'one-button',
    createState: () => ({ hit: false }),
    handlers: { hit: (d) => (d.hit = true) },
    isComplete: (d) => d.hit,
  })
  return createPuzzleManager({ registry })
}
const solveTwo = (m) => {
  m.dispatch('press', { id: 'a' })
  m.dispatch('press', { id: 'b' })
}

describe('registry', () => {
  it('rejects duplicate ids and invalid definitions', () => {
    const r = createPuzzleRegistry()
    r.register(makeTwoSwitches())
    expect(() => r.register(makeTwoSwitches())).toThrow(/already registered/)
    expect(() => r.register({ id: 'bad' })).toThrow()
    expect(r.ids()).toEqual(['two-switches'])
  })
})

describe('PuzzleManager', () => {
  it('throws for unknown puzzle ids', () => {
    expect(() => setup().load('nope')).toThrow(/Unknown puzzle/)
  })

  it('loading the same puzzle twice does not create a duplicate', () => {
    const m = setup()
    const a = m.load('two-switches')
    expect(m.load('two-switches')).toBe(a)
    expect(m.activeIds()).toEqual(['two-switches'])
  })

  it('routes events to active puzzles and announces completion once', () => {
    const m = setup()
    m.load('two-switches')
    const events = []
    m.subscribe((e) => events.push(e))
    solveTwo(m)
    solveTwo(m) // extra events after completion do nothing
    const done = events.filter((e) => e.type === 'puzzleCompleted')
    expect(done).toHaveLength(1)
    expect(done[0].puzzleId).toBe('two-switches')
    expect(m.isCompleted('two-switches')).toBe(true)
  })

  it('forwards custom events tagged with the puzzle id', () => {
    const m = setup()
    m.load('two-switches')
    const cb = vi.fn()
    m.subscribe(cb)
    m.dispatch('press', { id: 'a' })
    expect(cb).toHaveBeenCalledWith({ puzzleId: 'two-switches', type: 'dialogue', payload: { trigger: 'first_press' } })
  })

  it('dispatch counts how many puzzles handled the event', () => {
    const m = setup()
    m.load('two-switches')
    m.load('one-button')
    expect(m.dispatch('hit')).toBe(1)
    expect(m.dispatch('unknown')).toBe(0)
  })

  it('areAllCompleted needs every id (and a non-empty list)', () => {
    const m = setup()
    m.load('two-switches')
    m.load('one-button')
    expect(m.areAllCompleted([])).toBe(false)
    solveTwo(m)
    expect(m.areAllCompleted(['two-switches', 'one-button'])).toBe(false)
    m.dispatch('hit')
    expect(m.areAllCompleted(['two-switches', 'one-button'])).toBe(true)
  })

  it('reset restores initial state, clears completion, and can be re-earned', () => {
    const m = setup()
    m.load('two-switches')
    const cb = vi.fn()
    m.subscribe(cb)
    solveTwo(m)
    expect(m.reset('two-switches')).toBe(true)
    expect(m.isCompleted('two-switches')).toBe(false)
    expect(m.get('two-switches').getData()).toEqual({ a: false, b: false, presses: 0 })
    solveTwo(m)
    expect(cb.mock.calls.filter(([e]) => e.type === 'puzzleCompleted')).toHaveLength(2)
    expect(m.reset('missing')).toBe(false)
  })

  it('unloadAll cleans up every puzzle and leaves nothing active', () => {
    const onCleanup = vi.fn()
    const m = setup({ onCleanup })
    const p = m.load('two-switches')
    m.load('one-button')
    solveTwo(m)
    m.unloadAll()
    expect(onCleanup).toHaveBeenCalledTimes(1)
    expect(m.activeIds()).toEqual([])
    expect(m.getCompleted()).toEqual([])
    expect(m.get('two-switches')).toBeUndefined()
    expect(p.dispatch('press', { id: 'a' })).toBe(false)
    expect(m.dispatch('press', { id: 'a' })).toBe(0)
  })

  it('a puzzle reloaded after unload starts fresh', () => {
    const m = setup()
    m.load('two-switches')
    m.dispatch('press', { id: 'a' })
    m.unload('two-switches')
    expect(m.load('two-switches').getData().presses).toBe(0)
  })

  it('dispose drops subscribers too', () => {
    const m = setup()
    m.load('two-switches')
    const cb = vi.fn()
    m.subscribe(cb)
    m.dispose()
    m.load('two-switches')
    m.dispatch('press', { id: 'a' })
    expect(cb).not.toHaveBeenCalled()
  })

  it('a throwing subscriber does not stop completion handling', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const m = setup()
    m.load('two-switches')
    m.subscribe(() => { throw new Error('ui bug') })
    solveTwo(m)
    expect(m.isCompleted('two-switches')).toBe(true)
  })
})

describe('gameStore completedPuzzles', () => {
  it('marks idempotently and clears on new game and quit', () => {
    const g = createGameStore()
    expect(g.getState().markPuzzleComplete('p1')).toBe(true)
    expect(g.getState().markPuzzleComplete('p1')).toBe(false)
    expect(g.getState().completedPuzzles).toEqual(['p1'])
    g.getState().startGame()
    expect(g.getState().completedPuzzles).toEqual([])
    g.getState().markPuzzleComplete('p2')
    g.getState().finishTransition()
    g.getState().quitToMenu()
    expect(g.getState().completedPuzzles).toEqual([])
  })
})
