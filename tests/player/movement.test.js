import { describe, it, expect } from 'vitest'
import { computeMove, clampDelta, applyLook, MAX_DELTA, MAX_PITCH } from '../../src/game/player/PlayerController.js'
import { createPlayerInput } from '../../src/game/player/PlayerInput.js'

const out = () => ({ x: 0, z: 0 })

describe('computeMove', () => {
  it('forward at yaw 0 moves toward -Z', () => {
    const m = computeMove(out(), { x: 0, z: 1 }, 0, 4, 0.5)
    expect(m.x).toBeCloseTo(0)
    expect(m.z).toBeCloseTo(-2)
  })
  it('strafe right at yaw 0 moves +X', () => {
    const m = computeMove(out(), { x: 1, z: 0 }, 0, 4, 0.5)
    expect(m.x).toBeCloseTo(2)
    expect(m.z).toBeCloseTo(0)
  })
  it('normalizes diagonals', () => {
    const m = computeMove(out(), { x: 1, z: 1 }, 0, 4, 1)
    expect(Math.hypot(m.x, m.z)).toBeCloseTo(4)
  })
  it('turning left 90 degrees makes forward -X', () => {
    const m = computeMove(out(), { x: 0, z: 1 }, Math.PI / 2, 4, 1)
    expect(m.x).toBeCloseTo(-4)
    expect(m.z).toBeCloseTo(0)
  })
  it('no input gives zero movement', () => {
    expect(computeMove(out(), { x: 0, z: 0 }, 1, 4, 1)).toEqual({ x: 0, z: 0 })
  })
  it('opposite keys cancel', () => {
    expect(computeMove(out(), { x: 0, z: 0 }, 0, 4, 1)).toEqual({ x: 0, z: 0 })
  })
})

describe('delta and look', () => {
  it('clamps large deltas', () => {
    expect(clampDelta(2)).toBe(MAX_DELTA)
    expect(clampDelta(-1)).toBe(0)
  })
  it('clamps pitch and scales by sensitivity', () => {
    const look = { yaw: 0, pitch: 0 }
    applyLook(look, 0, -100000, 1)
    expect(look.pitch).toBeLessThanOrEqual(MAX_PITCH)
    const a = applyLook({ yaw: 0, pitch: 0 }, 10, 0, 1)
    const b = applyLook({ yaw: 0, pitch: 0 }, 10, 0, 2)
    expect(b.yaw).toBeCloseTo(a.yaw * 2)
  })
  it('mouse right turns yaw negative (look right)', () => {
    expect(applyLook({ yaw: 0, pitch: 0 }, 10, 0, 1).yaw).toBeLessThan(0)
  })
})

describe('PlayerInput', () => {
  const key = (type, code) => Object.assign(new Event(type), { code })
  it('tracks held keys, resets on blur, and detaches cleanly', () => {
    const t = new EventTarget()
    const input = createPlayerInput(t)
    const axes = { x: 0, z: 0 }
    input.attach()
    t.dispatchEvent(key('keydown', 'KeyW'))
    t.dispatchEvent(key('keydown', 'KeyD'))
    expect(input.axes(axes)).toEqual({ x: 1, z: 1 })
    t.dispatchEvent(new Event('blur'))
    expect(input.axes(axes)).toEqual({ x: 0, z: 0 })
    t.dispatchEvent(key('keydown', 'KeyS'))
    input.detach()
    t.dispatchEvent(key('keydown', 'KeyW'))
    expect(input.axes(axes)).toEqual({ x: 0, z: 0 })
  })
  it('ignores unrelated keys and double attach', () => {
    const t = new EventTarget()
    const input = createPlayerInput(t)
    input.attach()
    input.attach()
    t.dispatchEvent(key('keydown', 'KeyW'))
    t.dispatchEvent(key('keydown', 'Space'))
    expect(input.axes({ x: 0, z: 0 })).toEqual({ x: 0, z: 1 })
    input.detach()
  })
})
