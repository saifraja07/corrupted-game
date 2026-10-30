import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel01Logic } from '../../src/game/levels/level01/createLevel01Logic.js'
import { LEVEL01 } from '../../src/game/levels/level01/layout.js'
import { makeDynamicBox, moveWithCollisions, roomBoundsToBoxes } from '../../src/game/player/CollisionSystem.js'
import { DEFAULT_RANGE } from '../../src/game/systems/InteractionSystem.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

const DT = 1 / 60
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const onPuzzleCompleted = vi.fn()
  const logic = createLevel01Logic({
    onMessage: (l) => messages.push(l ? l.text : null),
    onLevelComplete,
    onPuzzleCompleted,
  })
  logic.start()
  const boxes = [
    ...roomBoundsToBoxes(LEVEL01.room.width, LEVEL01.room.depth),
    makeDynamicBox(() => logic.getDoorX(), LEVEL01.door.z, LEVEL01.door.width, 0.3, () => !logic.isDoorOpen()),
  ]
  const pos = { x: LEVEL01.spawn[0], z: LEVEL01.spawn[1] }
  // One simulated frame: walk toward (tx, tz) at player speed with real collisions, then update the level.
  const walk = (tx, tz) => {
    const dx = tx - pos.x
    const dz = tz - pos.z
    const len = Math.hypot(dx, dz)
    const step = Math.min(len, PLAYER.walkSpeed * DT)
    if (len > 1e-6) moveWithCollisions(pos, (dx / len) * step, (dz / len) * step, PLAYER.radius, boxes)
    logic.update(pos, DT)
    return len
  }
  const walkUntil = (tx, tz, maxFrames = 1200, eps = 0.05) => {
    for (let i = 0; i < maxFrames; i++) if (walk(tx, tz) < eps) return true
    return false
  }
  return { logic, pos, walk, walkUntil, messages, onLevelComplete, onPuzzleCompleted }
}

const dist3 = (pos, p) => Math.hypot(pos.x - p[0], PLAYER.eyeHeight - p[1], pos.z - p[2])

describe('Level 1: The Obvious Door (simulated player)', () => {
  it('the door dodges a chasing player and the player can never use the exit', () => {
    const { logic, pos, walk } = setup()
    let minDist = Infinity
    for (let i = 0; i < 60 * 20; i++) {
      walk(logic.getDoorX(), LEVEL01.door.z + 1.2) // chase the door's current position
      minDist = Math.min(minDist, Math.hypot(pos.x - logic.getDoorX(), pos.z - LEVEL01.door.z))
      expect(logic.getDoorX()).toBeGreaterThanOrEqual(LEVEL01.door.minX)
      expect(logic.getDoorX()).toBeLessThanOrEqual(LEVEL01.door.maxX)
    }
    expect(logic.getDodgeCount()).toBeGreaterThan(3)
    expect(minDist).toBeGreaterThan(1.0)
    expect(logic.useExit()).toBe(false)
    expect(logic.isExitDone()).toBe(false)
  })

  it('full playthrough: chase, find the button behind you, then use the exit', () => {
    const { logic, pos, walk, walkUntil, messages, onLevelComplete, onPuzzleCompleted } = setup()
    vi.advanceTimersByTime(900)
    expect(messages).toContain('Welcome! This should be easy.')

    for (let i = 0; i < 60 * 4; i++) walk(logic.getDoorX(), LEVEL01.door.z + 1.2)
    expect(messages.some((m) => m && /closer\. Technically|walking faster|argument with a door/.test(m))).toBe(true)

    // Go back to the button: it must be reachable from where the player ends up.
    expect(walkUntil(LEVEL01.button.position[0], LEVEL01.button.position[2] - 0.6)).toBe(true)
    expect(dist3(pos, LEVEL01.button.position)).toBeLessThanOrEqual(DEFAULT_RANGE)
    expect(logic.pressButton()).toBe(true)
    expect(messages.at(-1)).toBe("That wasn't supposed to work.")
    expect(logic.pressButton()).toBe(false) // idempotent

    // The door stops dodging, settles at the center, and the player can reach it.
    expect(walkUntil(0, LEVEL01.door.z + 1.0, 1200, 0.1)).toBe(true)
    expect(logic.getDoorX()).toBe(0)
    expect(Math.abs(pos.x - logic.getDoorX())).toBeLessThan(0.2)
    expect(Math.hypot(pos.x, pos.z - LEVEL01.door.z)).toBeLessThanOrEqual(DEFAULT_RANGE)

    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false) // no duplicate completion
    expect(logic.isDoorOpen()).toBe(true)
    expect(onPuzzleCompleted).toHaveBeenCalledTimes(1)
    expect(onLevelComplete).not.toHaveBeenCalled() // delayed so the player sees the payoff
    vi.advanceTimersByTime(LEVEL01.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
    expect(messages).toContain("Congratulations. You followed instructions. That's unfortunate.")
  })

  it('works if the player explores in an unexpected order (button first, door never provoked)', () => {
    const { logic, walkUntil, onLevelComplete } = setup()
    expect(walkUntil(1.5, 5.4)).toBe(true)
    expect(logic.pressButton()).toBe(true)
    expect(walkUntil(0, LEVEL01.door.z + 1.0, 1200, 0.1)).toBe(true)
    expect(logic.getDodgeCount()).toBe(0)
    expect(logic.useExit()).toBe(true)
    vi.advanceTimersByTime(LEVEL01.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the exit does nothing before the button is pressed', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(10000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('escalating hints appear after repeated failed attempts', () => {
    const { logic, messages } = setup()
    const provoke = () => {
      logic.update({ x: logic.getDoorX(), z: -3.5 }, DT)
      for (let i = 0; i < 120; i++) logic.update({ x: 0, z: 5 }, DT)
      vi.advanceTimersByTime(6000) // let each line expire and cooldowns pass
    }
    for (let i = 0; i < 8; i++) provoke()
    expect(logic.getDodgeCount()).toBe(8)
    expect(messages).toContain('Interesting strategy. Not a good one, but interesting.')
    expect(messages).toContain('Not everything worth finding is in front of you.')
  })
})

describe('Level 1 lifecycle', () => {
  it('dispose cancels everything: no timers, no completion callback, UI line cleared', () => {
    const { logic, messages, onLevelComplete } = setup()
    vi.advanceTimersByTime(900)
    logic.pressButton()
    logic.useExit()
    expect(logic.dispose()).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(10000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(messages.at(-1)).toBe(null)
    expect(logic.dispose()).toBe(false)
  })

  it('a stopped level ignores input', () => {
    const { logic } = setup()
    logic.dispose()
    expect(logic.pressButton()).toBe(false)
    expect(logic.useExit()).toBe(false)
  })

  it('start -> dispose -> start (StrictMode / restart) begins from pristine state', () => {
    const { logic, messages } = setup()
    logic.update({ x: 0, z: -3.5 }, DT)
    logic.pressButton()
    logic.dispose()
    expect(logic.start()).toBe(true)
    expect(logic.getDodgeCount()).toBe(0)
    expect(logic.getDoorX()).toBe(0)
    expect(logic.isButtonPressed()).toBe(false)
    expect(logic.isDoorOpen()).toBe(false)
    expect(logic.start()).toBe(false) // already running: no duplicate subscriptions
    messages.length = 0
    vi.advanceTimersByTime(900)
    expect(messages).toEqual(['Welcome! This should be easy.']) // exactly one welcome
  })

  it('a restarted level can be completed again', () => {
    const { logic, onLevelComplete } = setup()
    logic.pressButton()
    logic.useExit()
    vi.advanceTimersByTime(3000)
    logic.dispose()
    logic.start()
    logic.pressButton()
    expect(logic.useExit()).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(onLevelComplete).toHaveBeenCalledTimes(2)
  })
})
