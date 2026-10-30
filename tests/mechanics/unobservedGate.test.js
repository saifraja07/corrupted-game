import { describe, it, expect } from 'vitest'
import { createUnobservedGate } from '../../src/game/mechanics/unobservedGate.js'

const run = (gate, ms, observed, blocked = false, dt = 20) => {
  const events = []
  for (let t = 0; t < ms; t += dt) {
    const e = gate.update(dt, observed, blocked)
    if (e) events.push(e)
  }
  return events
}

describe('unobserved gate', () => {
  it('starts closed and stays closed while watched', () => {
    const g = createUnobservedGate()
    expect(g.isOpen()).toBe(false)
    expect(run(g, 5000, true)).toEqual([])
    expect(g.isOpen()).toBe(false)
  })
  it('opens only after it has been unwatched for the delay, announcing it once', () => {
    const g = createUnobservedGate({ openAfterMs: 350 })
    expect(run(g, 300, false)).toEqual([])
    expect(g.isOpen()).toBe(false)
    expect(run(g, 100, false)).toEqual(['opened'])
    expect(g.isOpen()).toBe(true)
    expect(run(g, 5000, false)).toEqual([]) // no repeats
  })
  it('closes again shortly after it is watched, announcing it once', () => {
    const g = createUnobservedGate({ closeAfterMs: 120 })
    run(g, 1000, false)
    expect(run(g, 100, true)).toEqual([])
    expect(run(g, 40, true)).toEqual(['closed'])
    expect(g.isOpen()).toBe(false)
  })
  it('never closes on someone standing where it would close, then closes as soon as they leave', () => {
    const g = createUnobservedGate()
    run(g, 1000, false)
    expect(run(g, 60000, true, true)).toEqual([]) // watched for a minute, but the player is in the way
    expect(g.isOpen()).toBe(true)
    expect(run(g, 40, true, false)).toEqual(['closed']) // free to close the moment they step clear
  })
  it('does not flicker when the view crosses the edge of the cone every frame', () => {
    const g = createUnobservedGate()
    const events = []
    for (let i = 0; i < 600; i++) {
      const e = g.update(16, i % 2 === 0, false)
      if (e) events.push(e)
    }
    expect(events).toEqual([]) // never opens
    run(g, 1000, false)
    const more = []
    for (let i = 0; i < 600; i++) {
      const e = g.update(16, i % 2 === 0, false)
      if (e) more.push(e)
    }
    expect(more).toEqual([]) // and, once open, never closes
  })
  it('reset closes it and clears the timers', () => {
    const g = createUnobservedGate()
    run(g, 1000, false)
    g.reset()
    expect(g.isOpen()).toBe(false)
    expect(run(g, 300, false)).toEqual([]) // the unwatched time was forgotten
  })
})
