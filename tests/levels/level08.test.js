import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel08Logic } from '../../src/game/levels/level08/createLevel08Logic.js'
import { DOOR, LEVEL08, MAX_VARIANT, VARIANTS, getRoomLayout } from '../../src/game/levels/level08/layout.js'
import { lastRoomPuzzle } from '../../src/game/levels/level08/lastRoomPuzzle.js'
import { createPuzzle } from '../../src/game/puzzles/Puzzle.js'
import { fillView, isInView } from '../../src/game/mechanics/lookAway.js'
import { makeBox, moveWithCollisions, roomBoundsToBoxes } from '../../src/game/player/CollisionSystem.js'
import { DEFAULT_RANGE } from '../../src/game/systems/InteractionSystem.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

const DT = 1 / 60
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('room variants are always valid', () => {
  for (let v = 0; v <= MAX_VARIANT; v++) {
    describe(`variant ${v}`, () => {
      const L = getRoomLayout(v)
      const hw = L.room.width / 2
      const hd = L.room.depth / 2

      it('puts the spawn safely inside the room, clear of every door', () => {
        const [sx, sz] = L.spawn
        expect(Math.abs(sx)).toBeLessThanOrEqual(hw - PLAYER.radius)
        expect(Math.abs(sz)).toBeLessThanOrEqual(hd - PLAYER.radius)
        for (const d of L.doors) expect(Math.hypot(sx - d.x, sz - L.doorZ)).toBeGreaterThan(3)
      })
      it('keeps every door inside the wall, under the ceiling, and apart from each other', () => {
        expect(L.doors.length).toBeGreaterThanOrEqual(1)
        expect(DOOR.height).toBeLessThan(L.room.height)
        for (const d of L.doors) expect(Math.abs(d.x) + DOOR.width / 2).toBeLessThanOrEqual(hw - 0.2)
        for (let i = 1; i < L.doors.length; i++) expect(L.doors[i].x - L.doors[i - 1].x).toBeGreaterThanOrEqual(DOOR.width + 0.4)
      })
      it('places the presence inside its limits, off the doors, in view from the spawn but out of reach', () => {
        const a = L.presenceAnchor
        const b = L.presenceBounds
        expect(a.x).toBeGreaterThanOrEqual(b.minX)
        expect(a.x).toBeLessThanOrEqual(b.maxX)
        expect(a.z).toBeGreaterThanOrEqual(b.minZ)
        expect(a.z).toBeLessThanOrEqual(b.maxZ)
        for (const d of L.doors) expect(Math.hypot(a.x - d.x, a.z - L.doorZ)).toBeGreaterThan(1.5)
        const [sx, sz] = L.spawn
        const dist = Math.hypot(a.x - sx, a.z - sz)
        expect(dist).toBeGreaterThan(DEFAULT_RANGE + 1) // not already within reach on arrival
        const eye = fillView({}, { x: sx, y: PLAYER.eyeHeight, z: sz }, 0, 0) // spawn faces -Z
        expect(isInView(eye, { x: a.x, y: LEVEL08.presence.eyeY, z: a.z }, LEVEL08.presence.view)).toBe(true)
      })
    })
  }
  it('clamps out-of-range variants', () => {
    expect(getRoomLayout(-3).variant).toBe(0)
    expect(getRoomLayout(99).variant).toBe(MAX_VARIANT)
    expect(getRoomLayout(NaN).variant).toBe(0)
  })
  it('really transforms: size, ceiling, door count and sign all differ across the variants', () => {
    const dims = new Set(VARIANTS.map((v) => `${v.room.width}x${v.room.depth}x${v.room.height}`))
    expect(dims.size).toBe(VARIANTS.length)
    expect(VARIANTS[MAX_VARIANT].doorFractions.length).toBeLessThan(VARIANTS[0].doorFractions.length)
    expect(VARIANTS[MAX_VARIANT].room.height).toBeGreaterThan(0)
    expect(new Set(VARIANTS.map((v) => v.sign)).size).toBeGreaterThan(2)
  })
})

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel08Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}
// A simulated player: real collision against the CURRENT room, looking and walking like a human.
function bot(logic) {
  const b = { x: 0, z: 0, yaw: 0, spawn() { const [x, z] = logic.getSpawn(); b.x = x; b.z = z; b.yaw = 0 } }
  const boxes = () => {
    const L = logic.getLayout()
    return [...roomBoundsToBoxes(L.room.width, L.room.depth), ...L.doors.map((d) => makeBox(d.x, L.doorZ, DOOR.width, 0.3))]
  }
  b.faceToward = (tx, tz) => {
    b.yaw = Math.atan2(-(tx - b.x), -(tz - b.z)) // forward = (-sin yaw, -cos yaw)
  }
  b.frame = (walk) => {
    if (walk) {
      const p = { x: b.x, z: b.z }
      moveWithCollisions(p, -Math.sin(b.yaw) * PLAYER.walkSpeed * DT, -Math.cos(b.yaw) * PLAYER.walkSpeed * DT, PLAYER.radius, boxes())
      b.x = p.x
      b.z = p.z
    }
    logic.update(fillView({}, { x: b.x, y: PLAYER.eyeHeight, z: b.z }, b.yaw, 0), DT)
    vi.advanceTimersByTime(DT * 1000)
  }
  b.dist = () => Math.hypot(logic.getPresence().x - b.x, logic.getPresence().z - b.z)
  return b
}
const tryDoorAndTeleport = (logic, b, i = 0) => {
  expect(logic.useDoor(i)).toBe(true)
  b.spawn() // what the scene does: teleport to the (possibly new) spawn
}
// Enough player-reach that the scene's raycast would find the presence (its body has a radius).
const REACH = DEFAULT_RANGE + 0.3

describe('Level 8: The Last Room', () => {
  it('starts with no presence and no way to follow it', () => {
    const { logic } = setup()
    expect(logic.isPresenceVisible()).toBe(false)
    expect(logic.followPresence()).toBe(false)
    expect(logic.isExitDone()).toBe(false)
  })

  it('every door is fake: using one never completes, transforms the room, and summons the presence', () => {
    const { logic, onLevelComplete } = setup()
    for (let uses = 1; uses <= 6; uses++) {
      expect(logic.useDoor(0)).toBe(true)
      expect(logic.getVariant()).toBe(Math.min(uses, MAX_VARIANT))
      expect(logic.isPresenceVisible()).toBe(true)
      expect(logic.isExitDone()).toBe(false)
      expect(logic.getSpawn()).toEqual(getRoomLayout(logic.getVariant()).spawn)
    }
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('rejects doors that do not exist in the current room (doors go missing)', () => {
    const { logic } = setup()
    expect(logic.useDoor(-1)).toBe(false)
    expect(logic.useDoor(1.5)).toBe(false)
    expect(logic.useDoor(3)).toBe(false) // variant 0 has three doors: 0..2
    logic.useDoor(0)
    logic.useDoor(0) // variant 2: two doors
    expect(logic.useDoor(2)).toBe(false)
    expect(logic.useDoor(1)).toBe(true)
    logic.useDoor(0) // variant 3: one door left
    expect(logic.useDoor(1)).toBe(false)
  })

  it('walking at the presence while watching it: it never moves, and following completes the level once', () => {
    const { logic, onLevelComplete, messages } = setup()
    const b = bot(logic)
    b.spawn()
    tryDoorAndTeleport(logic, b)
    const frozenAt = { ...logic.getPresence() }
    let reached = false
    for (let i = 0; i < 60 * 15 && !reached; i++) {
      b.faceToward(logic.getPresence().x, logic.getPresence().z)
      b.frame(true)
      expect(logic.isPresenceObserved()).toBe(true)
      expect(logic.getPresence()).toEqual(frozenAt) // not one millimetre while watched
      reached = b.dist() <= REACH
    }
    expect(reached).toBe(true)
    expect(logic.followPresence()).toBe(true)
    expect(logic.followPresence()).toBe(false) // no duplicate completion
    vi.advanceTimersByTime(LEVEL08.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
    expect(messages).toContain('Finally.')
    expect(messages).toContain('You were looking in the wrong direction.')
  })

  it('looking away lets it creep closer, but never nearer than 3 m, and it stays in the room', () => {
    const { logic } = setup()
    const b = bot(logic)
    b.spawn()
    tryDoorAndTeleport(logic, b)
    const bounds = logic.getLayout().presenceBounds
    b.yaw = Math.PI // facing the wall behind the spawn: the presence is out of view
    let minDist = Infinity
    for (let i = 0; i < 60 * 40; i++) {
      b.frame(false)
      minDist = Math.min(minDist, b.dist())
      const p = logic.getPresence()
      expect(p.x).toBeGreaterThanOrEqual(bounds.minX - 1e-9)
      expect(p.x).toBeLessThanOrEqual(bounds.maxX + 1e-9)
      expect(p.z).toBeGreaterThanOrEqual(bounds.minZ - 1e-9)
      expect(p.z).toBeLessThanOrEqual(bounds.maxZ + 1e-9)
    }
    expect(logic.isPresenceObserved()).toBe(false)
    expect(minDist).toBeGreaterThanOrEqual(LEVEL08.presence.minDistance - 1e-6)
    expect(b.dist()).toBeCloseTo(LEVEL08.presence.minDistance, 3) // it got as close as it ever will

    // Turn around: it is right there, frozen, and one step forward puts it within reach.
    b.faceToward(logic.getPresence().x, logic.getPresence().z)
    const here = { ...logic.getPresence() }
    for (let i = 0; i < 120; i++) b.frame(false)
    expect(logic.getPresence()).toEqual(here)
    for (let i = 0; i < 60 * 3 && b.dist() > REACH; i++) b.frame(true)
    expect(b.dist()).toBeLessThanOrEqual(REACH)
    expect(logic.followPresence()).toBe(true)
  })

  it('is solvable no matter how many times the room has already transformed', () => {
    for (const uses of [1, 2, 3, 4, 7]) {
      const { logic } = setup()
      const b = bot(logic)
      b.spawn()
      for (let i = 0; i < uses; i++) tryDoorAndTeleport(logic, b, 0)
      let reached = false
      for (let f = 0; f < 60 * 25 && !reached; f++) {
        b.faceToward(logic.getPresence().x, logic.getPresence().z)
        b.frame(true)
        reached = b.dist() <= REACH
      }
      expect(reached, `after ${uses} door uses`).toBe(true)
      expect(logic.followPresence()).toBe(true)
      logic.dispose()
    }
  })

  it('walking straight through the presence is harmless: nothing breaks, and you can turn around and still follow it', () => {
    const { logic } = setup()
    const b = bot(logic)
    b.spawn()
    tryDoorAndTeleport(logic, b)
    const L = logic.getLayout()
    b.yaw = Math.PI // look away for a long time so it creeps up behind us
    for (let i = 0; i < 60 * 20; i++) b.frame(false)
    b.faceToward(logic.getPresence().x, logic.getPresence().z)
    for (let i = 0; i < 60 * 3; i++) b.frame(true) // walk right through it and out the other side
    expect(Number.isFinite(b.x) && Number.isFinite(b.z)).toBe(true)
    expect(Math.abs(b.x)).toBeLessThanOrEqual(L.room.width / 2) // collision still holds us in the room
    expect(Math.abs(b.z)).toBeLessThanOrEqual(L.room.depth / 2)
    // Turn around: it is in view again, so it freezes, and a few steps put it within reach.
    b.faceToward(logic.getPresence().x, logic.getPresence().z)
    let reached = false
    for (let i = 0; i < 60 * 10 && !reached; i++) {
      b.faceToward(logic.getPresence().x, logic.getPresence().z)
      b.frame(true)
      reached = b.dist() <= REACH
    }
    expect(reached).toBe(true)
    expect(logic.followPresence()).toBe(true)
  })

  it('escalating dialogue: presence, then the hint, then the pointed hint', () => {
    const { logic, messages } = setup()
    const next = () => {
      logic.useDoor(0)
      vi.advanceTimersByTime(6000)
    }
    next()
    expect(messages).toContain('You are not alone in here.')
    next()
    expect(messages).toContain('HINT: STOP LOOKING FOR A DOOR.')
    next()
    next()
    expect(messages).toContain('It has been watching you. Try watching back.')
    expect(messages.some((m) => m && /Not that one|Or that one|get bigger/.test(m))).toBe(true)
  })

  it('nudges toward the doors only if none has been tried after a long while', () => {
    const idle = setup()
    vi.advanceTimersByTime(LEVEL08.idleHintMs - 100)
    expect(idle.messages).not.toContain('The doors are right there.')
    vi.advanceTimersByTime(200)
    expect(idle.messages).toContain('The doors are right there.')

    const active = setup()
    active.logic.useDoor(0)
    vi.advanceTimersByTime(LEVEL08.idleHintMs * 2)
    expect(active.messages).not.toContain('The doors are right there.')
  })

  it('the puzzle itself ignores follow until a door has been tried', () => {
    const p = createPuzzle(lastRoomPuzzle)
    p.init()
    p.activate()
    p.dispatch('follow')
    expect(p.status).toBe('active')
    p.dispatch('door_used', { door: 0 })
    p.dispatch('follow')
    expect(p.status).toBe('completed')
  })
})

describe('Level 8 cleanup', () => {
  it('dispose resets the room and presence, leaves no timers, and never fires a stale completion', () => {
    const { logic, onLevelComplete } = setup()
    logic.useDoor(0)
    logic.useDoor(0)
    logic.followPresence()
    logic.dispose()
    expect(logic.getVariant()).toBe(0)
    expect(logic.isPresenceVisible()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(120000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.useDoor(0)).toBe(false) // stopped
    logic.start()
    expect(logic.getDoorUses()).toBe(0)
    expect(logic.getLayout()).toEqual(getRoomLayout(0))
  })
})
