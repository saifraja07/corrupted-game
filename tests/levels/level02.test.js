import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, Raycaster, Vector3, Euler } from 'three'
import { createLevel02Logic } from '../../src/game/levels/level02/createLevel02Logic.js'
import { HINT_DELAY_MS } from '../../src/game/levels/level02/twoButtonsPuzzle.js'
import { LEVEL02 } from '../../src/game/levels/level02/layout.js'
import { MAX_PITCH } from '../../src/game/player/PlayerController.js'
import { DEFAULT_RANGE } from '../../src/game/systems/InteractionSystem.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel02Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe('Level 2: The Easy Part', () => {
  it.each([
    ['A then B', ['pressA', 'pressB']],
    ['B then A', ['pressB', 'pressA']],
  ])('is solvable in either order (%s)', (_n, order) => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    for (const m of order) expect(logic[m]()).toBe(true)
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.isDoorOpen()).toBe(false) // opens only when used
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false) // no duplicate completion
    expect(logic.isDoorOpen()).toBe(true)
    vi.advanceTimersByTime(LEVEL02.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the door refuses (with a line) until both buttons are pressed', () => {
    const { logic, messages, onLevelComplete } = setup()
    logic.pressA()
    expect(logic.useExit()).toBe(false)
    expect(messages).toContain('The door disagrees.')
    expect(logic.isExitDone()).toBe(false)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('presses are idempotent', () => {
    const { logic } = setup()
    expect(logic.pressA()).toBe(true)
    expect(logic.pressA()).toBe(false)
  })

  it('hints "look up" only if the hidden button is still unpressed after the delay', () => {
    const { logic, messages } = setup()
    logic.pressA()
    vi.advanceTimersByTime(HINT_DELAY_MS - 100)
    expect(messages).not.toContain('Have you tried looking up?')
    vi.advanceTimersByTime(200)
    expect(messages).toContain('Have you tried looking up?')
  })

  it('no hint when the hidden button was already pressed', () => {
    const { logic, messages } = setup()
    logic.pressA()
    logic.pressB()
    vi.advanceTimersByTime(HINT_DELAY_MS * 2)
    expect(messages).not.toContain('Have you tried looking up?')
  })

  it('dispose leaves no timers and no completion callback; restart is pristine', () => {
    const { logic, onLevelComplete } = setup()
    logic.pressA() // schedules the hint timer
    logic.pressB()
    logic.useExit() // schedules completion
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    logic.start()
    expect(logic.isAPressed() || logic.isBPressed() || logic.isDoorOpen()).toBe(false)
  })

  // Geometry check with real Three.js: the hidden ceiling button must be reachable by a looking-up player.
  it('the ceiling button is reachable: in range and within the camera\'s pitch limit', () => {
    const [bx, by, bz] = LEVEL02.buttonB.position
    const eye = new Vector3(bx, PLAYER.eyeHeight, bz + 1) // one meter away horizontally
    const toButton = new Vector3(bx, by, bz).sub(eye)
    expect(toButton.length()).toBeLessThanOrEqual(DEFAULT_RANGE)
    const pitch = Math.atan2(toButton.y, Math.hypot(toButton.x, toButton.z))
    expect(pitch).toBeLessThanOrEqual(MAX_PITCH)

    // And a ray along that line actually hits the button (and its +Z-local face points down, into the room).
    const world = new Group()
    const btn = new Mesh(new BoxGeometry(0.3, 0.3, 0.05), new MeshBasicMaterial())
    btn.position.set(bx, by, bz)
    btn.rotation.copy(new Euler(LEVEL02.buttonB.rotationX, 0, 0))
    world.add(btn)
    world.updateMatrixWorld(true)
    const hits = new Raycaster(eye, toButton.clone().normalize(), 0, DEFAULT_RANGE + 0.5).intersectObject(world, true)
    expect(hits.length).toBeGreaterThan(0)
    const faceNormal = new Vector3(0, 0, 1).applyEuler(btn.rotation)
    expect(faceNormal.y).toBeLessThan(-0.99)
  })

  it('the visible left-wall button is in range from the nearest legal standing spot', () => {
    const [ax, ay, az] = LEVEL02.buttonA.position
    const innerWallX = -LEVEL02.room.width / 2
    const standing = new Vector3(innerWallX + PLAYER.radius, PLAYER.eyeHeight, az)
    expect(standing.distanceTo(new Vector3(ax, ay, az))).toBeLessThanOrEqual(DEFAULT_RANGE)
  })
})
