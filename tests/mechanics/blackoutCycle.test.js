import { describe, it, expect } from 'vitest'
import { createBlackoutCycle } from '../../src/game/mechanics/blackoutCycle.js'
import { sceneFx, setDarkness, resetSceneFx } from '../../src/game/state/sceneFx.js'

const FRAME = 1000 / 60
const run = (cycle, ms) => {
  const samples = []
  const events = []
  for (let t = 0; t < ms; t += FRAME) {
    const e = cycle.update(FRAME)
    if (e) events.push({ t, e })
    samples.push(cycle.getDarkness())
  }
  return { samples, events }
}

describe('blackout cycle', () => {
  it('stays fully lit until the first blackout', () => {
    const c = createBlackoutCycle({ firstMs: 10000 })
    const { samples } = run(c, 9900)
    expect(Math.max(...samples)).toBe(0)
  })

  it('fades in, holds fully dark, fades out, and returns to full light', () => {
    const c = createBlackoutCycle({ firstMs: 1000, fadeMs: 3000, holdMs: 4000, periodMs: 22000 })
    const { samples, events } = run(c, 12000)
    expect(events.map((x) => x.e)).toEqual(['started', 'ended'])
    expect(Math.max(...samples)).toBe(1)
    expect(samples[samples.length - 1]).toBe(0)
    expect(samples.filter((d) => d === 1).length * FRAME).toBeGreaterThanOrEqual(3800) // the hold lasts ~4 s
  })

  it('is smooth: no frame ever changes the darkness by more than a hair (no flicker, no jump)', () => {
    const c = createBlackoutCycle({ firstMs: 500 })
    c.update(500)
    const { samples } = run(c, 5 * 60000)
    let maxStep = 0
    for (let i = 1; i < samples.length; i++) maxStep = Math.max(maxStep, Math.abs(samples[i] - samples[i - 1]))
    expect(maxStep).toBeLessThan(0.01)
  })

  it('is slow: only ever one blackout per period, with a fully lit gap between', () => {
    const c = createBlackoutCycle({ firstMs: 10000, periodMs: 22000 })
    const { events, samples } = run(c, 10 * 60000)
    const starts = events.filter((x) => x.e === 'started').map((x) => x.t)
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(22000 - FRAME * 2)
    // direction reversals per second: a fade is one smooth hump, so very few
    let reversals = 0
    for (let i = 2; i < samples.length; i++) if ((samples[i - 1] - samples[i - 2]) * (samples[i] - samples[i - 1]) < 0) reversals++
    expect(reversals / (10 * 60)).toBeLessThan(0.2)
  })

  it('triggerNow starts one immediately, but never restarts one in progress', () => {
    const c = createBlackoutCycle({ firstMs: 60000 })
    expect(c.triggerNow()).toBe(true)
    run(c, 1000)
    expect(c.isActive()).toBe(true)
    expect(c.triggerNow()).toBe(false)
    run(c, 9500) // 1 s + 9.5 s > the 10 s a blackout lasts (3 s in, 4 s hold, 3 s out): it finishes by itself
    expect(c.isActive()).toBe(false)
    expect(c.getDarkness()).toBe(0)
  })

  it('a triggered blackout pushes the next scheduled one back, so they never overlap', () => {
    const c = createBlackoutCycle({ firstMs: 5000, periodMs: 22000 })
    run(c, 4000)
    c.triggerNow() // early, at t = 4 s
    const { events } = run(c, 60000)
    const starts = events.filter((x) => x.e === 'started').map((x) => x.t)
    expect(starts[0]).toBeGreaterThanOrEqual(22000 - 4000 - FRAME * 3) // next one is a full period after the early one
  })

  it('refuses a period shorter than a blackout, and reset restores the start', () => {
    expect(() => createBlackoutCycle({ fadeMs: 3000, holdMs: 4000, periodMs: 9000 })).toThrow()
    const c = createBlackoutCycle({ firstMs: 1000 })
    run(c, 5000)
    c.reset()
    expect(c.isActive()).toBe(false)
    expect(c.getDarkness()).toBe(0)
    expect(run(c, 900).events).toEqual([]) // first blackout is 1 s away again
  })
})

describe('scene effects', () => {
  it('clamps darkness to 0..1 and ignores junk, and resets', () => {
    setDarkness(0.4)
    expect(sceneFx.darkness).toBe(0.4)
    setDarkness(5)
    expect(sceneFx.darkness).toBe(1)
    setDarkness(-2)
    expect(sceneFx.darkness).toBe(0)
    setDarkness(NaN)
    expect(sceneFx.darkness).toBe(0)
    setDarkness(0.9)
    resetSceneFx()
    expect(sceneFx.darkness).toBe(0)
  })
})
