import { describe, it, expect } from 'vitest'
import { createUnobservedMover } from '../../src/game/mechanics/unobservedMover.js'
import { createFpsMeter } from '../../src/game/core/fpsMeter.js'
import { parseDevFlags } from '../../src/game/core/devFlags.js'

describe('unobserved mover', () => {
  const make = (extra = {}) => createUnobservedMover({ x: 0, z: -5, speed: 1, minDistance: 3, ...extra })
  const player = { x: 0, z: 5 }

  it('never moves while observed, however long', () => {
    const m = make()
    for (let i = 0; i < 1000; i++) expect(m.step(player, 0.1, true)).toBe(false)
    expect([m.x, m.z]).toEqual([0, -5])
  })
  it('drifts toward the target at its speed when unobserved', () => {
    const m = make()
    expect(m.step(player, 1, false)).toBe(true)
    expect(m.z).toBeCloseTo(-4)
    expect(m.x).toBeCloseTo(0)
  })
  it('stops at the minimum distance and never gets closer', () => {
    const m = make()
    for (let i = 0; i < 2000; i++) m.step(player, 0.05, false)
    expect(Math.hypot(player.x - m.x, player.z - m.z)).toBeCloseTo(3, 5)
    expect(m.step(player, 1, false)).toBe(false)
  })
  it('does not overshoot the stopping distance with a big time step', () => {
    const m = make({ speed: 100 })
    m.step(player, 5, false)
    expect(Math.hypot(player.x - m.x, player.z - m.z)).toBeCloseTo(3, 5)
  })
  it('handles a target on top of it without NaN, and zero/negative time', () => {
    const m = make()
    expect(m.step({ x: 0, z: -5 }, 1, false)).toBe(false)
    expect(m.step(player, 0, false)).toBe(false)
    expect(m.step(player, -1, false)).toBe(false)
    expect(Number.isNaN(m.x) || Number.isNaN(m.z)).toBe(false)
  })
  it('stays inside its bounds', () => {
    const m = make({ x: 0, z: 0, minDistance: 0, bounds: { minX: -1, maxX: 1, minZ: -1, maxZ: 1 } })
    for (let i = 0; i < 500; i++) m.step({ x: 50, z: 50 }, 0.1, false)
    expect(m.x).toBeLessThanOrEqual(1)
    expect(m.z).toBeLessThanOrEqual(1)
  })
  it('reset and setBounds work', () => {
    const m = make()
    m.step(player, 1, false)
    m.reset(2, 3)
    expect([m.x, m.z]).toEqual([2, 3])
    m.setBounds({ minX: 0, maxX: 0.5, minZ: 0, maxZ: 0.5 })
    m.step({ x: 9, z: 9 }, 5, false)
    expect(m.x).toBeLessThanOrEqual(0.5)
  })
})

describe('fps meter', () => {
  it('reports once per window with correct fps and worst frame', () => {
    const m = createFpsMeter({ windowMs: 500 })
    let out = null
    for (let i = 0; i < 29; i++) out = m.tick(1 / 60) || out
    expect(out).toBe(null) // 29 frames ~ 483 ms: window not over yet
    const r = m.tick(1 / 60)
    expect(r.fps).toBeCloseTo(60, 0)
    expect(r.avgMs).toBeCloseTo(16.67, 1)
    const slow = createFpsMeter({ windowMs: 100 })
    slow.tick(0.016)
    const r2 = slow.tick(0.1)
    expect(r2.worstMs).toBeCloseTo(100)
    expect(slow.tick(0.016)).toBe(null) // window restarted
  })
})

describe('dev flags', () => {
  it('has safe defaults', () => {
    expect(parseDevFlags('')).toEqual({ corruptionStage: null, showCeiling: true, showStats: false })
  })
  it('parses each flag strictly', () => {
    expect(parseDevFlags('?ceiling=0&stats=1&corruption=3')).toEqual({ corruptionStage: 3, showCeiling: false, showStats: true })
    expect(parseDevFlags('?ceiling=1&stats=yes&corruption=7')).toEqual({ corruptionStage: null, showCeiling: true, showStats: false })
  })
})
