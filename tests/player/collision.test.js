import { describe, it, expect } from 'vitest'
import { makeBox, roomBoundsToBoxes, moveWithCollisions } from '../../src/game/player/CollisionSystem.js'

const R = 0.3
const room = () => roomBoundsToBoxes(8, 12) // inner x in [-4,4], z in [-6,6]

describe('collision', () => {
  it('stops at the wall by the player radius', () => {
    const pos = { x: 0, z: 5 }
    moveWithCollisions(pos, 0, -20, R, room())
    expect(pos.z).toBeCloseTo(-6 + R)
  })
  it('slides along a wall when moving diagonally', () => {
    const pos = { x: 3, z: 0 }
    moveWithCollisions(pos, 2, 1, R, room())
    expect(pos.x).toBeCloseTo(4 - R)
    expect(pos.z).toBeCloseTo(1)
  })
  it('handles corners without escaping', () => {
    const pos = { x: 3, z: 5 }
    moveWithCollisions(pos, 5, 5, R, room())
    expect(pos.x).toBeCloseTo(4 - R)
    expect(pos.z).toBeCloseTo(6 - R)
  })
  it('does not tunnel at the clamped max step', () => {
    const pos = { x: 0, z: -5.6 }
    for (let i = 0; i < 20; i++) moveWithCollisions(pos, 0, -0.2, R, room())
    expect(pos.z).toBeGreaterThanOrEqual(-6)
  })
  it('a closed door blocks and an opened door does not', () => {
    const door = makeBox(0, -5.9, 1.2, 0.3)
    const boxes = [door]
    const a = { x: 0, z: -4 }
    moveWithCollisions(a, 0, -3, R, boxes)
    expect(a.z).toBeCloseTo(-5.9 + 0.15 + R)
    door.enabled = false
    const b = { x: 0, z: -4 }
    moveWithCollisions(b, 0, -3, R, boxes)
    expect(b.z).toBeCloseTo(-7)
  })
  it('supports a function-valued enabled (door driven by external state)', () => {
    let open = false
    const boxes = [makeBox(0, -5.9, 1.2, 0.3, () => !open)]
    const a = { x: 0, z: -4 }
    moveWithCollisions(a, 0, -3, R, boxes)
    expect(a.z).toBeCloseTo(-5.45)
    open = true
    moveWithCollisions(a, 0, -3, R, boxes)
    expect(a.z).toBeCloseTo(-8.45)
  })
  it('pushes a center-inside-box position out the nearest face', () => {
    const pos = { x: 0.1, z: 0 }
    moveWithCollisions(pos, 0, 0, R, [makeBox(0, 0, 2, 2)])
    expect(Math.abs(pos.x) >= 1 + R - 1e-9 || Math.abs(pos.z) >= 1 + R - 1e-9).toBe(true)
  })
})
