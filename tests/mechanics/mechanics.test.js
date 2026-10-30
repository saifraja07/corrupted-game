import { describe, it, expect } from 'vitest'
import { PerspectiveCamera } from 'three'
import { createControlModifiers } from '../../src/game/mechanics/controlModifiers.js'
import { createTriggerZone } from '../../src/game/mechanics/triggerZone.js'
import { createLookAwayChanger, fillView, isInView } from '../../src/game/mechanics/lookAway.js'
import { createStagedText } from '../../src/game/mechanics/stagedText.js'
import { computeMove } from '../../src/game/player/PlayerController.js'

describe('control modifiers (reversed controls)', () => {
  it('does nothing until set, then inverts, then restores on clear', () => {
    const m = createControlModifiers()
    expect(m.apply({ x: 1, z: 1 })).toEqual({ x: 1, z: 1 })
    m.set({ invertForward: true, invertStrafe: true })
    expect(m.isActive()).toBe(true)
    expect(m.apply({ x: 1, z: 1 })).toEqual({ x: -1, z: -1 })
    m.clear()
    expect(m.isActive()).toBe(false)
    expect(m.apply({ x: 1, z: -1 })).toEqual({ x: 1, z: -1 })
  })
  it('flags are independent and ignore junk', () => {
    const m = createControlModifiers()
    m.set({ invertForward: true, bogus: true, invertStrafe: 'yes' })
    expect(m.get()).toEqual({ invertForward: true, invertStrafe: false })
    expect(m.apply({ x: 1, z: 1 })).toEqual({ x: 1, z: -1 })
  })
  it('never produces -0 for idle axes', () => {
    const m = createControlModifiers()
    m.set({ invertForward: true, invertStrafe: true })
    const a = m.apply({ x: 0, z: 0 })
    expect(Object.is(a.x, 0) && Object.is(a.z, 0)).toBe(true)
  })
  it('reversed forward really moves the player backward through the movement math', () => {
    const m = createControlModifiers()
    m.set({ invertForward: true })
    const axes = m.apply({ x: 0, z: 1 }) // player presses W
    const move = computeMove({ x: 0, z: 0 }, axes, 0, 4, 1)
    expect(move.z).toBeCloseTo(4) // +Z is backward at yaw 0
  })
})

describe('trigger zone', () => {
  const zone = () => createTriggerZone({ contains: (p) => p.z < 1.5 })
  it('fires once, on entry only', () => {
    const z = zone()
    expect(z.update({ z: 5 })).toBe(false)
    expect(z.update({ z: 1 })).toBe(true)
    expect(z.update({ z: 0 })).toBe(false) // still inside
    expect(z.update({ z: 5 })).toBe(false)
    expect(z.update({ z: 1 })).toBe(false) // once:true
    expect(z.hasFired()).toBe(true)
  })
  it('once:false fires on every re-entry; reset re-arms', () => {
    const z = createTriggerZone({ contains: (p) => p.z < 1.5, once: false })
    expect(z.update({ z: 1 })).toBe(true)
    z.update({ z: 5 })
    expect(z.update({ z: 1 })).toBe(true)
    const once = zone()
    once.update({ z: 1 })
    once.reset()
    expect(once.update({ z: 1 })).toBe(true)
  })
})

describe('look-away', () => {
  const eye = { x: 0, y: 1.6, z: 0 }
  const target = { x: 0, y: 1.6, z: -5 }
  const view = (yawDeg) => fillView({}, eye, (yawDeg * Math.PI) / 180, 0)

  it('sees things in front, not behind or to the side', () => {
    expect(isInView(view(0), target)).toBe(true)
    expect(isInView(view(180), target)).toBe(false)
    expect(isInView(view(90), target)).toBe(false)
  })
  it('respects the cone edge and max distance', () => {
    const at = (deg) => ({ x: -5 * Math.sin((deg * Math.PI) / 180), y: 1.6, z: -5 * Math.cos((deg * Math.PI) / 180) })
    expect(isInView(view(0), at(39))).toBe(true)
    expect(isInView(view(0), at(41))).toBe(false)
    expect(isInView(view(0), { x: 0, y: 1.6, z: -50 })).toBe(false)
    expect(isInView(view(0), eye)).toBe(true) // standing on it
  })
  it('fillView matches Three.js camera orientation (YXZ)', () => {
    for (const [yaw, pitch] of [[0, 0], [0.7, 0.3], [-1.9, -0.5], [3, 1.2]]) {
      const cam = new PerspectiveCamera()
      cam.rotation.order = 'YXZ'
      cam.rotation.set(pitch, yaw, 0)
      cam.updateMatrixWorld(true)
      const dir = cam.getWorldDirection(new (cam.position.constructor)())
      const v = fillView({}, cam.position, yaw, pitch)
      expect(v.fx).toBeCloseTo(dir.x)
      expect(v.fy).toBeCloseTo(dir.y)
      expect(v.fz).toBeCloseTo(dir.z)
    }
  })
  it('the changer applies queued changes only while unobserved, one per frame, in order', () => {
    const c = createLookAwayChanger()
    const log = []
    c.queue(() => log.push('a'))
    c.queue(() => log.push('b'))
    expect(c.update(true)).toBe(false)
    expect(log).toEqual([])
    expect(c.update(false)).toBe(true)
    expect(log).toEqual(['a'])
    expect(c.update(true)).toBe(false)
    expect(c.update(false)).toBe(true)
    expect(log).toEqual(['a', 'b'])
    expect(c.update(false)).toBe(false)
    c.queue(() => log.push('x'))
    c.clear()
    expect(c.pendingCount()).toBe(0)
  })
})

describe('staged text', () => {
  it('advances, resets, and rejects bad stages', () => {
    const t = createStagedText(['one', 'two'])
    expect(t.get()).toBe('one')
    expect(t.setStage(1)).toBe(true)
    expect(t.get()).toBe('two')
    expect(t.setStage(2)).toBe(false)
    expect(t.setStage(-1)).toBe(false)
    expect(t.setStage(0.5)).toBe(false)
    t.reset()
    expect(t.getStage()).toBe(0)
    expect(() => createStagedText([])).toThrow()
  })
})
