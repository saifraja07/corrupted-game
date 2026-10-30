import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel03Logic } from '../../src/game/levels/level03/createLevel03Logic.js'
import { backwardsPuzzle, REVERSED_HINT_DELAY_MS } from '../../src/game/levels/level03/backwardsPuzzle.js'
import { createPuzzle } from '../../src/game/puzzles/Puzzle.js'
import { LEVEL03 } from '../../src/game/levels/level03/layout.js'
import { computeMove, clampDelta } from '../../src/game/player/PlayerController.js'
import { makeBox, moveWithCollisions, roomBoundsToBoxes } from '../../src/game/player/CollisionSystem.js'
import { DEFAULT_RANGE } from '../../src/game/systems/InteractionSystem.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

const DT = 1 / 60
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel03Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  const boxes = [
    ...roomBoundsToBoxes(LEVEL03.room.width, LEVEL03.room.depth),
    makeBox(0, LEVEL03.door.z, LEVEL03.door.width, 0.3, () => !logic.isDoorOpen()),
  ]
  const pos = { x: LEVEL03.spawn[0], z: LEVEL03.spawn[1] }
  const axes = { x: 0, z: 0 }
  const move = { x: 0, z: 0 }
  // One frame of a bot that only uses W/A/S/D. It knows when the controls are reversed and presses the
  // opposite keys. Goes through the same pipeline as Player: modifiers.apply -> computeMove -> collisions.
  const walk = (tx, tz) => {
    const dx = tx - pos.x
    const dz = tz - pos.z
    let ax = Math.abs(dx) < 0.1 ? 0 : Math.sign(dx) // +x = strafe right
    let az = Math.abs(dz) < 0.1 ? 0 : -Math.sign(dz) // -z = forward
    if (logic.isReversed()) {
      ax = -ax
      az = -az
    }
    axes.x = ax
    axes.z = az
    logic.modifiers.apply(axes)
    computeMove(move, axes, 0, PLAYER.walkSpeed, clampDelta(DT))
    moveWithCollisions(pos, move.x, move.z, PLAYER.radius, boxes)
    logic.update(pos)
    vi.advanceTimersByTime(DT * 1000) // keep the fake clock in step with simulated frames
    return Math.hypot(dx, dz)
  }
  const walkTo = (tx, tz, frames = 1500) => {
    for (let i = 0; i < frames; i++) if (walk(tx, tz) < 0.15) return true
    return false
  }
  return { logic, pos, walkTo, messages, onLevelComplete }
}

describe('Level 3: Backwards', () => {
  it('crossing the middle reverses controls, and a W-only walker really moves backward', () => {
    const { logic, pos } = setup()
    expect(logic.isReversed()).toBe(false)
    logic.update({ x: 0, z: 1 })
    expect(logic.isReversed()).toBe(true)
    // Simulate a player holding plain W (not the bot): they move toward +Z (backward).
    const axes = logic.modifiers.apply({ x: 0, z: 1 })
    const m = computeMove({ x: 0, z: 0 }, axes, 0, 4, 0.05)
    expect(m.z).toBeGreaterThan(0)
    expect(pos.z).toBe(5)
  })

  it('is solvable end-to-end using only WASD, adapting to the reversed controls', () => {
    const { logic, pos, walkTo, messages, onLevelComplete } = setup()
    expect(walkTo(-2, -4.6)).toBe(true) // crosses the zone on the way
    expect(messages).toContain('Controls updated. You are welcome.')
    expect(logic.isReversed()).toBe(true)

    expect(Math.hypot(pos.x - LEVEL03.button.position[0], 1.6 - LEVEL03.button.position[1], pos.z - LEVEL03.button.position[2])).toBeLessThanOrEqual(DEFAULT_RANGE)
    expect(logic.pressCalibrate()).toBe(true)
    expect(logic.isReversed()).toBe(false) // controls restored
    expect(messages).toContain('Better? I thought so.')

    expect(walkTo(0, LEVEL03.door.z + 1.0)).toBe(true) // now with normal controls
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL03.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the exit does nothing until calibrated', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(10000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('works in an unexpected order: calibrating first means controls are never reversed', () => {
    const { logic } = setup()
    expect(logic.pressCalibrate()).toBe(true)
    logic.update({ x: 0, z: 0 })
    expect(logic.isReversed()).toBe(false)
    expect(logic.useExit()).toBe(true)
  })

  it('reversal triggers once; re-crossing does not re-reverse after calibration', () => {
    const { logic } = setup()
    logic.update({ x: 0, z: 1 })
    logic.pressCalibrate()
    logic.update({ x: 0, z: 5 })
    logic.update({ x: 0, z: 1 })
    expect(logic.isReversed()).toBe(false)
  })

  it('offers a hint if the player is stuck reversed for a while', () => {
    const { logic, messages } = setup()
    logic.update({ x: 0, z: 1 })
    vi.advanceTimersByTime(REVERSED_HINT_DELAY_MS - 100)
    expect(messages).not.toContain('Everything is the opposite. Use that.')
    vi.advanceTimersByTime(200)
    expect(messages).toContain('Everything is the opposite. Use that.')
  })

  it('no hint after calibrating', () => {
    const { logic, messages } = setup()
    logic.update({ x: 0, z: 1 })
    logic.pressCalibrate()
    vi.advanceTimersByTime(REVERSED_HINT_DELAY_MS * 2)
    expect(messages).not.toContain('Everything is the opposite. Use that.')
  })
})

describe('Level 3 cleanup: reversed controls must never leak', () => {
  it('dispose clears the modifiers, timers and callbacks', () => {
    const { logic, onLevelComplete } = setup()
    logic.update({ x: 0, z: 1 })
    expect(logic.isReversed()).toBe(true)
    logic.dispose()
    expect(logic.isReversed()).toBe(false)
    expect(logic.modifiers.apply({ x: 1, z: 1 })).toEqual({ x: 1, z: 1 })
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })
  it('a restarted level begins un-reversed and can reverse again', () => {
    const { logic } = setup()
    logic.update({ x: 0, z: 1 })
    logic.dispose()
    logic.start()
    expect(logic.isReversed()).toBe(false)
    logic.update({ x: 0, z: 1 })
    expect(logic.isReversed()).toBe(true)
  })
  it('a puzzle reset announces that controls are restored', () => {
    const p = createPuzzle(backwardsPuzzle)
    p.init()
    p.activate()
    const effects = []
    p.on('effect', (e) => effects.push(e))
    p.dispatch('zone_entered')
    p.reset()
    expect(effects).toEqual([
      { effect: 'reverse_controls', on: true },
      { effect: 'reverse_controls', on: false },
    ])
  })
})
