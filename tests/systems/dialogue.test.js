import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDialogueSystem } from '../../src/game/systems/DialogueSystem.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const L = (id, trigger, extra = {}) => ({ id, trigger, text: `text ${id}`, duration: 1000, ...extra })
const make = (lines, opts) => createDialogueSystem({ lines, ...opts })
const record = (d) => {
  const seen = []
  d.subscribe((l) => seen.push(l ? l.id : null))
  return seen
}

describe('showing and expiring', () => {
  it('shows a line, then clears it after its duration', () => {
    const d = make([L('a', 't')])
    const seen = record(d)
    expect(d.trigger('t')).toBe('shown')
    expect(d.getActive().id).toBe('a')
    vi.advanceTimersByTime(999)
    expect(d.getActive()).not.toBe(null)
    vi.advanceTimersByTime(2)
    expect(d.getActive()).toBe(null)
    expect(seen).toEqual(['a', null])
  })
  it('unknown triggers do nothing', () => {
    expect(make([L('a', 't')]).trigger('nope')).toBe(false)
  })
})

describe('priority and queue', () => {
  it('a higher priority line interrupts the current one', () => {
    const d = make([L('low', 'l', { priority: 1 }), L('high', 'h', { priority: 3 })])
    d.trigger('l')
    expect(d.trigger('h')).toBe('shown')
    expect(d.getActive().id).toBe('high')
  })
  it('equal/lower priority lines queue and play in order after the current one', () => {
    const d = make([L('a', 'a', { priority: 2 }), L('b', 'b', { priority: 2 }), L('c', 'c', { priority: 1 })])
    const seen = record(d)
    d.trigger('a')
    expect(d.trigger('b')).toBe('queued')
    expect(d.trigger('c')).toBe('queued')
    vi.advanceTimersByTime(1000)
    expect(d.getActive().id).toBe('b') // higher priority first
    vi.advanceTimersByTime(1000)
    expect(d.getActive().id).toBe('c')
    vi.advanceTimersByTime(1000)
    expect(seen).toEqual(['a', 'b', 'c', null])
  })
  it('queue:false lines are dropped instead of queued', () => {
    const d = make([L('a', 'a'), L('b', 'b', { queue: false })])
    d.trigger('a')
    expect(d.trigger('b')).toBe(false)
    expect(d.queueLength()).toBe(0)
  })
  it('the queue is bounded and never holds duplicates', () => {
    const lines = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => L(id, id))
    const d = make(lines, { maxQueue: 2 })
    d.trigger('a')
    d.trigger('b')
    d.trigger('b')
    expect(d.queueLength()).toBe(1)
    d.trigger('c')
    expect(d.trigger('d')).toBe(false)
    expect(d.queueLength()).toBe(2)
  })
})

describe('spam prevention', () => {
  it('rate-limits a trigger fired repeatedly', () => {
    const d = make([L('a', 't'), L('b', 't')], { defaultCooldown: 1500 })
    expect(d.trigger('t')).toBe('shown')
    expect(d.trigger('t')).toBe(false)
    vi.advanceTimersByTime(1600)
    expect(d.trigger('t')).not.toBe(false)
  })
  it('rotates through a trigger\'s lines in order and wraps', () => {
    const d = make([L('a', 't'), L('b', 't')], { defaultCooldown: 0, minRepeatMs: 0 })
    const order = []
    for (let i = 0; i < 4; i++) {
      d.trigger('t')
      order.push(d.getActive().id)
      vi.advanceTimersByTime(1000)
    }
    expect(order).toEqual(['a', 'b', 'a', 'b'])
  })
  it('does not repeat the same line too soon', () => {
    const d = make([L('a', 't')], { defaultCooldown: 0, minRepeatMs: 5000 })
    d.trigger('t')
    vi.advanceTimersByTime(1000)
    expect(d.trigger('t')).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(d.trigger('t')).toBe('shown')
  })
})

describe('cancel and clear', () => {
  it('cancel() removes the current line and shows the next queued one', () => {
    const d = make([L('a', 'a'), L('b', 'b')])
    d.trigger('a')
    d.trigger('b')
    expect(d.cancel()).toBe(true)
    expect(d.getActive().id).toBe('b')
  })
  it('cancel(id) also removes queued copies', () => {
    const d = make([L('a', 'a'), L('b', 'b')])
    d.trigger('a')
    d.trigger('b')
    d.cancel('b')
    expect(d.queueLength()).toBe(0)
    expect(d.getActive().id).toBe('a')
  })
  it('clear() resets everything, notifies null, and leaves no timers', () => {
    const d = make([L('a', 'a'), L('b', 'b')])
    const seen = record(d)
    d.trigger('a')
    d.trigger('b')
    d.clear()
    expect(d.getActive()).toBe(null)
    expect(d.queueLength()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(seen.at(-1)).toBe(null)
    expect(d.trigger('a')).toBe('shown') // rate-limit memory was reset too
  })
})

describe('data validation and levels', () => {
  it('rejects duplicate ids and malformed lines', () => {
    expect(() => make([L('a', 't'), L('a', 'u')])).toThrow(/Duplicate/)
    expect(() => make([{ trigger: 't' }])).toThrow()
  })
  it('only loads lines for the active level', () => {
    const lines = [L('x', 't', { level: 'one' }), L('y', 't', { level: 'two' })]
    const d = make(lines, { level: 'two' })
    d.trigger('t')
    expect(d.getActive().id).toBe('y')
  })
  it('a throwing subscriber does not break the system', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const d = make([L('a', 't')])
    d.subscribe(() => {
      throw new Error('ui')
    })
    expect(d.trigger('t')).toBe('shown')
  })
})
