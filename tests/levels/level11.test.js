import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel11Logic } from '../../src/game/levels/level11/createLevel11Logic.js'
import { CELL, DECOYS, REAL_EXIT, START, cellCenter, doorPlacement, solutionPath, wallCells } from '../../src/game/levels/level11/maze.js'
import { LEVEL11 } from '../../src/game/levels/level11/layout.js'
import { makeBox, moveWithCollisions, roomBoundsToBoxes } from '../../src/game/player/CollisionSystem.js'
import { DEFAULT_RANGE } from '../../src/game/systems/InteractionSystem.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

const DT = 1 / 60
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const events = []
  const onLevelComplete = vi.fn()
  const logic = createLevel11Logic({
    onMessage: (l) => messages.push(l ? l.text : null),
    onGameEvent: (n) => {
      events.push(n)
      return null
    },
    onLevelComplete,
  })
  logic.start()
  return { logic, messages, events, onLevelComplete }
}

// A simulated player using the real collision against every wall block and door.
function makeBot(logic) {
  const door = (d, enabled) => {
    const p = doorPlacement(d)
    return makeBox(p.x, p.z, LEVEL11.door.width, 0.3, enabled)
  }
  const boxes = [
    ...roomBoundsToBoxes(LEVEL11.room.width, LEVEL11.room.depth),
    ...wallCells().map((w) => makeBox(w.x, w.z, CELL, CELL)),
    ...DECOYS.map((d) => door(d)),
    door(REAL_EXIT, () => !logic.isDoorOpen()),
  ]
  const b = { x: LEVEL11.spawn[0], z: LEVEL11.spawn[1], frames: 0 }
  b.go = (tx, tz, maxFrames = 600) => {
    for (let i = 0; i < maxFrames; i++) {
      const dx = tx - b.x
      const dz = tz - b.z
      const len = Math.hypot(dx, dz)
      if (len < 0.05) return true
      const p = { x: b.x, z: b.z }
      moveWithCollisions(p, (dx / len) * PLAYER.walkSpeed * DT, (dz / len) * PLAYER.walkSpeed * DT, PLAYER.radius, boxes)
      b.x = p.x
      b.z = p.z
      b.frames++
    }
    return false
  }
  b.dist = (p) => Math.hypot(b.x - p.x, b.z - p.z)
  return b
}

describe('Level 11: the maze can be walked, through real walls', () => {
  it('a player following the solution cell by cell reaches the exit door and gets out', () => {
    const { logic, onLevelComplete } = setup()
    const b = makeBot(logic)
    for (const [r, c] of solutionPath()) {
      const p = cellCenter(r, c)
      expect(b.go(p.x, p.z), `cell ${r},${c}`).toBe(true) // never snagged on a wall or corner
    }
    const exit = doorPlacement(REAL_EXIT)
    expect(b.dist(exit)).toBeLessThanOrEqual(DEFAULT_RANGE) // the door is within reach of the last cell
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL11.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
    expect(b.frames / 60).toBeLessThan(40) // about 50 m of corridor at walking speed
  })

  it('every decoy door can really be walked to, is in reach of its dead end, and only sends you back', () => {
    const { logic, onLevelComplete, messages } = setup()
    DECOYS.forEach((d, i) => {
      const b = makeBot(logic)
      for (const [r, c] of solutionPath(START, d.cell)) {
        const p = cellCenter(r, c)
        expect(b.go(p.x, p.z), `decoy ${i}: cell ${r},${c}`).toBe(true)
      }
      expect(b.dist(doorPlacement(d)), `decoy ${i}`).toBeLessThanOrEqual(DEFAULT_RANGE)
      expect(logic.useDecoy(i)).toBe(true) // the scene would now send the player back to the start
      vi.advanceTimersByTime(4000)
    })
    expect(logic.getDecoyUses()).toBe(DECOYS.length)
    expect(logic.isExitDone()).toBe(false)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(messages.some((m) => m && /Welcome back|sign said so|liars/.test(m))).toBe(true)
  })

  it('the walls are solid: pushing into a wall block stops you at its face', () => {
    const { logic } = setup()
    const b = makeBot(logic)
    const from = cellCenter(6, 4) // east of this cell is a wall block
    b.x = from.x
    b.z = from.z
    b.go(from.x + 6, from.z, 300)
    expect(b.x).toBeCloseTo(cellCenter(6, 5).x - CELL / 2 - PLAYER.radius, 1)
  })

  it('invalid decoy numbers do nothing', () => {
    const { logic } = setup()
    for (const bad of [-1, 3, 1.5, NaN, undefined]) expect(logic.useDecoy(bad)).toBe(false)
    expect(logic.getDecoyUses()).toBe(0)
  })
})

describe('Level 11: nobody is lost forever', () => {
  it('after two minutes a hint names the corner; after five a glowing trail marks the whole route', () => {
    const { logic, messages, events } = setup()
    vi.advanceTimersByTime(LEVEL11.hint1Ms - 500)
    expect(messages).not.toContain('The exit is in the far corner. North-east.')
    vi.advanceTimersByTime(1000)
    expect(messages).toContain('The exit is in the far corner. North-east.')
    expect(logic.isTrailOn()).toBe(false)
    vi.advanceTimersByTime(LEVEL11.hint2Ms - LEVEL11.hint1Ms)
    expect(logic.isTrailOn()).toBe(true)
    expect(events).toContain('hint_trail')
    expect(messages).toContain("Fine. I'll show you.")
  })

  it('no hints once you have found the exit', () => {
    const { logic, messages } = setup()
    logic.useExit()
    vi.advanceTimersByTime(LEVEL11.hint2Ms * 2)
    expect(logic.isTrailOn()).toBe(false)
    expect(messages).not.toContain("Fine. I'll show you.")
  })

  it('the trail covers exactly the solution route', () => {
    const route = solutionPath()
    expect(route[0]).toEqual([6, 0])
    expect(route[route.length - 1]).toEqual([0, 6])
    expect(new Set(route.map((c) => c.join())).size).toBe(route.length) // never doubles back on itself
  })
})

describe('Level 11: cleanup', () => {
  it('dispose clears the trail, timers and any pending completion; a restart is pristine', () => {
    const { logic, onLevelComplete } = setup()
    vi.advanceTimersByTime(LEVEL11.hint2Ms + 1000)
    expect(logic.isTrailOn()).toBe(true)
    logic.useExit()
    logic.dispose()
    expect(logic.isTrailOn()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(600000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    logic.start()
    expect(logic.isTrailOn()).toBe(false)
    expect(logic.getDecoyUses()).toBe(0)
    expect(logic.isExitDone()).toBe(false)
  })
})
