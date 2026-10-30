import { describe, it, expect } from 'vitest'
import { createDoorDodge } from '../../src/game/levels/level01/DoorDodge.js'
import { LEVEL01 } from '../../src/game/levels/level01/layout.js'

const cfg = () => ({ ...LEVEL01.door })
const DT = 1 / 60
const settle = (d, player, enabled = true) => {
  for (let i = 0; i < 300; i++) d.step(player, DT, enabled)
}

describe('DoorDodge', () => {
  it('stays put while the player is far away', () => {
    const d = createDoorDodge(cfg())
    expect(d.step({ x: 0, z: 5 }, DT)).toBe(false)
    expect(d.x).toBe(0)
  })

  it('dodges to the end farthest from the player when approached', () => {
    const d = createDoorDodge(cfg())
    expect(d.step({ x: 1, z: -3.5 }, DT)).toBe(true) // player slightly right => door goes left
    settle(d, { x: 0, z: 5 })
    expect(d.x).toBe(LEVEL01.door.minX)
    const d2 = createDoorDodge(cfg())
    d2.step({ x: -1, z: -3.5 }, DT)
    settle(d2, { x: 0, z: 5 })
    expect(d2.x).toBe(LEVEL01.door.maxX)
  })

  it('moves smoothly: never faster than its configured speed', () => {
    const d = createDoorDodge(cfg())
    d.step({ x: 0, z: -3.5 }, DT)
    let prev = d.x
    for (let i = 0; i < 200; i++) {
      d.step({ x: 0, z: 5 }, DT)
      expect(Math.abs(d.x - prev)).toBeLessThanOrEqual(LEVEL01.door.speed * DT + 1e-9)
      prev = d.x
    }
  })

  it('stays inside its range even with huge time steps', () => {
    const d = createDoorDodge(cfg())
    d.step({ x: 0, z: -3.5 }, 10)
    expect(d.x).toBeGreaterThanOrEqual(LEVEL01.door.minX)
    expect(d.x).toBeLessThanOrEqual(LEVEL01.door.maxX)
  })

  it('does not start a second dodge while one is in progress', () => {
    const d = createDoorDodge(cfg())
    expect(d.step({ x: 0, z: -3.5 }, DT)).toBe(true)
    expect(d.step({ x: 0, z: -3.5 }, DT)).toBe(false)
    expect(d.dodges).toBe(1)
  })

  it('when disabled it never dodges and glides back to the center', () => {
    const d = createDoorDodge(cfg())
    d.step({ x: 0, z: -3.5 }, DT)
    settle(d, { x: 0, z: 5 }) // now at the left end
    expect(d.x).toBe(LEVEL01.door.minX)
    expect(d.step({ x: d.x, z: -4 }, DT, false)).toBe(false)
    settle(d, { x: d.x, z: -4 }, false)
    expect(d.x).toBe(0)
    expect(d.moving).toBe(false)
    expect(d.dodges).toBe(1)
  })

  it('reset restores the initial state', () => {
    const d = createDoorDodge(cfg())
    d.step({ x: 0, z: -3.5 }, DT)
    settle(d, { x: 0, z: 5 })
    d.reset()
    expect(d.x).toBe(0)
    expect(d.dodges).toBe(0)
  })
})
