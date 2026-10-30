import { describe, it, expect, vi, afterEach } from 'vitest'
import { createPuzzle, PUZZLE_STATUS as ST, validatePuzzleDefinition } from '../../src/game/puzzles/Puzzle.js'
import { makeTwoSwitches } from './fixtures.js'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const ready = (hooks) => {
  const p = createPuzzle(makeTwoSwitches(hooks))
  p.init()
  p.activate()
  return p
}

describe('definition validation', () => {
  it('rejects malformed definitions', () => {
    expect(() => validatePuzzleDefinition(null)).toThrow()
    expect(() => validatePuzzleDefinition({ id: 'x' })).toThrow(/createState/)
    expect(() => validatePuzzleDefinition({ id: 'x', createState: () => ({}) })).toThrow(/isComplete/)
    expect(() => validatePuzzleDefinition({ id: 'x', createState: () => ({}), isComplete: () => true })).toThrow(/handlers/)
  })
})

describe('lifecycle', () => {
  it('moves created -> initialized -> active and rejects invalid steps', () => {
    const p = createPuzzle(makeTwoSwitches())
    expect(p.status).toBe(ST.CREATED)
    expect(p.activate()).toBe(false) // must init first
    expect(p.init()).toBe(true)
    expect(p.init()).toBe(false)
    expect(p.status).toBe(ST.INITIALIZED)
    expect(p.dispatch('press', { id: 'a' })).toBe(false) // not active yet
    expect(p.activate()).toBe(true)
    expect(p.activate()).toBe(false)
    expect(p.status).toBe(ST.ACTIVE)
  })

  it('tracks progress and completes exactly once', () => {
    const p = ready()
    const onDone = vi.fn()
    const onProgress = vi.fn()
    p.on('completed', onDone)
    p.on('progress', onProgress)
    p.dispatch('press', { id: 'a' })
    expect(p.status).toBe(ST.ACTIVE)
    p.dispatch('press', { id: 'b' })
    expect(p.status).toBe(ST.COMPLETED)
    // further events after completion are ignored: no duplicate completion
    expect(p.dispatch('press', { id: 'a' })).toBe(false)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onProgress.mock.calls.map((c) => c[0])).toEqual([0.5, 1])
  })

  it('is order independent and tolerates repeat presses', () => {
    const p = ready()
    p.dispatch('press', { id: 'b' })
    p.dispatch('press', { id: 'b' })
    p.dispatch('press', { id: 'a' })
    expect(p.status).toBe(ST.COMPLETED)
  })

  it('ignores unknown event types', () => {
    const p = ready()
    expect(p.dispatch('nope')).toBe(false)
    expect(p.status).toBe(ST.ACTIVE)
  })

  it('custom events (dialogue) reach subscribers, wildcard sees type + payload', () => {
    const p = ready()
    const any = vi.fn()
    const dlg = vi.fn()
    p.on('*', any)
    p.on('dialogue', dlg)
    p.dispatch('press', { id: 'a' })
    expect(dlg).toHaveBeenCalledWith({ trigger: 'first_press' })
    expect(any).toHaveBeenCalledWith('dialogue', { trigger: 'first_press' })
  })

  it('unsubscribe works', () => {
    const p = ready()
    const cb = vi.fn()
    const off = p.on('completed', cb)
    off()
    p.dispatch('press', { id: 'a' })
    p.dispatch('press', { id: 'b' })
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('failure', () => {
  it('can fail, then stops accepting events until reset', () => {
    const p = createPuzzle({
      id: 'strikes',
      createState: () => ({ strikes: 0, done: false }),
      handlers: { strike: (d) => d.strikes++, win: (d) => (d.done = true) },
      isFailed: (d) => d.strikes >= 3,
      isComplete: (d) => d.done,
    })
    p.init()
    p.activate()
    const onFail = vi.fn()
    p.on('failed', onFail)
    for (let i = 0; i < 3; i++) p.dispatch('strike')
    expect(p.status).toBe(ST.FAILED)
    expect(onFail).toHaveBeenCalledTimes(1)
    expect(p.dispatch('win')).toBe(false)
    p.reset()
    p.activate()
    expect(p.getData()).toEqual({ strikes: 0, done: false })
    p.dispatch('win')
    expect(p.status).toBe(ST.COMPLETED)
  })
})

describe('reset', () => {
  it('restores pristine state and allows completing again', () => {
    const p = ready()
    const onDone = vi.fn()
    p.on('completed', onDone)
    p.dispatch('press', { id: 'a' })
    p.dispatch('press', { id: 'b' })
    expect(p.reset()).toBe(true)
    expect(p.status).toBe(ST.INITIALIZED)
    expect(p.getData()).toEqual({ a: false, b: false, presses: 0 })
    expect(p.dispatch('press', { id: 'a' })).toBe(false) // inactive until re-activated
    p.activate()
    p.dispatch('press', { id: 'a' })
    p.dispatch('press', { id: 'b' })
    expect(onDone).toHaveBeenCalledTimes(2)
  })

  it('reset is not allowed before init or after cleanup', () => {
    const p = createPuzzle(makeTwoSwitches())
    expect(p.reset()).toBe(false)
    p.init()
    p.cleanup()
    expect(p.reset()).toBe(false)
  })
})

describe('timers and cleanup', () => {
  it('after() fires only while active and is cancelled by reset', () => {
    vi.useFakeTimers()
    const fired = vi.fn()
    const p = ready({ onActivate: (api) => api.after(1000, fired) })
    vi.advanceTimersByTime(500)
    p.reset()
    vi.advanceTimersByTime(5000)
    expect(fired).not.toHaveBeenCalled()
  })

  it('after() runs when left alone', () => {
    vi.useFakeTimers()
    const fired = vi.fn()
    ready({ onActivate: (api) => api.after(1000, fired) })
    vi.advanceTimersByTime(1000)
    expect(fired).toHaveBeenCalledTimes(1)
  })

  it('completion cancels pending timers', () => {
    vi.useFakeTimers()
    const fired = vi.fn()
    const p = ready({ onActivate: (api) => api.after(1000, fired) })
    p.dispatch('press', { id: 'a' })
    p.dispatch('press', { id: 'b' })
    vi.advanceTimersByTime(5000)
    expect(fired).not.toHaveBeenCalled()
  })

  it('cleanup cancels timers, clears listeners, calls onCleanup once, and is idempotent', () => {
    vi.useFakeTimers()
    const fired = vi.fn()
    const onCleanup = vi.fn()
    const p = ready({ onActivate: (api) => api.after(1000, fired), onCleanup })
    const cb = vi.fn()
    p.on('*', cb)
    expect(p.cleanup()).toBe(true)
    expect(p.cleanup()).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(fired).not.toHaveBeenCalled()
    expect(onCleanup).toHaveBeenCalledTimes(1)
    expect(p.status).toBe(ST.DISPOSED)
    expect(p.dispatch('press', { id: 'a' })).toBe(false)
    expect(p.on('completed', cb)()).toBeUndefined() // subscribing after disposal is a harmless no-op
  })

  it('api.cancel stops a single timer', () => {
    vi.useFakeTimers()
    const fired = vi.fn()
    ready({ onActivate: (api) => api.cancel(api.after(1000, fired)) })
    vi.advanceTimersByTime(2000)
    expect(fired).not.toHaveBeenCalled()
  })
})

describe('robustness', () => {
  it('a throwing handler is logged and does not break the puzzle', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const p = createPuzzle({
      id: 'bad',
      createState: () => ({ ok: false }),
      handlers: { boom: () => { throw new Error('x') }, fine: (d) => (d.ok = true) },
      isComplete: (d) => d.ok,
    })
    p.init()
    p.activate()
    expect(p.dispatch('boom')).toBe(true)
    expect(err).toHaveBeenCalled()
    p.dispatch('fine')
    expect(p.status).toBe(ST.COMPLETED)
  })
})
