import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel07Logic } from '../../src/game/levels/level07/createLevel07Logic.js'
import { LEVEL07 } from '../../src/game/levels/level07/layout.js'
import { fillView, isInView } from '../../src/game/mechanics/lookAway.js'
import { makeBox, moveWithCollisions, roomBoundsToBoxes } from '../../src/game/player/CollisionSystem.js'
import { DEFAULT_RANGE } from '../../src/game/systems/InteractionSystem.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

const DT = 1 / 60
const L = LEVEL07
const EAST = -Math.PI / 2 // facing +X: the gate (straight ahead of the spawn) is far outside the view cone
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const events = []
  const onLevelComplete = vi.fn()
  const logic = createLevel07Logic({
    onMessage: (l) => messages.push(l ? l.text : null),
    onGameEvent: (name) => {
      events.push(name)
      return null
    },
    onLevelComplete,
  })
  logic.start()
  return { logic, messages, events, onLevelComplete }
}

// A simulated player using the real collision (including the moving gate) and the real view test.
function makeBot(logic) {
  const side = L.room.width / 2 - L.gate.halfWidth
  const sx = L.gate.halfWidth + side / 2
  const boxes = [
    ...roomBoundsToBoxes(L.room.width, L.room.depth),
    makeBox(-sx, L.gate.z, side, L.gate.thickness),
    makeBox(sx, L.gate.z, side, L.gate.thickness),
    makeBox(0, L.gate.z, L.gate.halfWidth * 2, L.gate.thickness, () => !logic.isGateOpen()),
    makeBox(0, L.door.z, L.door.width, 0.3, () => !logic.isDoorOpen()),
  ]
  const b = { x: L.spawn[0], z: L.spawn[1], yaw: 0, violations: 0 }
  b.frame = (heading) => {
    const p = { x: b.x, z: b.z }
    const step = heading ? PLAYER.walkSpeed * DT : 0
    moveWithCollisions(p, (heading?.[0] ?? 0) * step, (heading?.[1] ?? 0) * step, PLAYER.radius, boxes)
    b.x = p.x
    b.z = p.z
    logic.update(fillView({}, { x: b.x, y: PLAYER.eyeHeight, z: b.z }, b.yaw, 0), DT * 1000)
    vi.advanceTimersByTime(DT * 1000)
    // The gate must NEVER be closed on top of the player.
    const overlap = Math.abs(b.x) < L.gate.halfWidth + PLAYER.radius - 0.01 && Math.abs(b.z - L.gate.z) < L.gate.thickness / 2 + PLAYER.radius - 0.01
    if (!logic.isGateOpen() && overlap) b.violations++
  }
  b.idle = (ms) => {
    for (let t = 0; t < ms; t += DT * 1000) b.frame(null)
  }
  b.go = (tx, tz, maxFrames = 1200) => {
    for (let i = 0; i < maxFrames; i++) {
      const dx = tx - b.x
      const dz = tz - b.z
      const len = Math.hypot(dx, dz)
      if (len < 0.08) return true
      b.frame([dx / len, dz / len])
    }
    return false
  }
  return b
}

describe('Level 7: the room is laid out fairly', () => {
  it('the barrier spans the whole room, so the gate is the only way through', () => {
    const side = L.room.width / 2 - L.gate.halfWidth
    expect(side * 2 + L.gate.halfWidth * 2).toBeCloseTo(L.room.width)
  })
  it('the gate is wide enough to walk through, with room to spare', () => {
    expect(L.gate.halfWidth * 2).toBeGreaterThanOrEqual(PLAYER.radius * 2 + 1)
  })
  it('the exit is in the alcove past the gate, well clear of it, and the spawn is on the near side', () => {
    expect(L.door.z).toBeLessThan(L.gate.z - L.gate.thickness / 2 - 3)
    expect(L.spawn[1]).toBeGreaterThan(L.gate.z + 3)
    expect(Math.abs(L.door.z)).toBeLessThanOrEqual(L.room.depth / 2)
    expect(L.crossedZ).toBeLessThan(L.gate.z - L.gate.thickness / 2) // "crossed" means genuinely past the slab
  })
  it('the sign lies: it demands the one thing that keeps the gate shut', () => {
    expect(L.signText).toContain('KEEP YOUR EYES ON THE GATE')
    const watching = (view) => L.viewHeights.some((y) => isInView(view, { x: 0, y, z: L.gate.z }, L.view))
    expect(watching(fillView({}, { x: 0, y: PLAYER.eyeHeight, z: 3 }, 0, 0))).toBe(true) // obeying the sign = watching it
    expect(watching(fillView({}, { x: 0, y: PLAYER.eyeHeight, z: 3 }, EAST, 0))).toBe(false)
  })
  it('the footprint where the gate may not close covers everywhere it would touch the player', () => {
    expect(L.footprint.halfX).toBeGreaterThanOrEqual(L.gate.halfWidth + PLAYER.radius)
    expect(L.footprint.halfZ).toBeGreaterThanOrEqual(L.gate.thickness / 2 + PLAYER.radius)
  })
})

describe('Level 7: doing what the sign says fails, and help arrives', () => {
  it('walking at the gate while watching it never gets through (the gate never opens)', () => {
    const { logic, events } = setup()
    const b = makeBot(logic)
    for (let i = 0; i < 60 * 20; i++) b.frame([0, -1]) // yaw 0: straight at it, eyes on it
    expect(logic.isGateOpen()).toBe(false)
    expect(logic.hasCrossed()).toBe(false)
    expect(b.z).toBeGreaterThan(L.gate.z + 0.4) // stopped in front of the slab
    expect(events).not.toContain('gate_open')
    expect(b.violations).toBe(0)
  })

  it('lingering at the closed gate brings two hints, a gentle one then a pointed one', () => {
    const { logic, messages } = setup()
    const b = makeBot(logic)
    b.go(0, 1.5)
    for (let i = 0; i < 60 * 27; i++) b.frame(null) // watching it for ~27 s
    expect(messages).toContain("Some things only happen when you aren't watching.")
    expect(messages).not.toContain('Have you tried walking backwards?')
    for (let i = 0; i < 60 * 32; i++) b.frame(null) // ~59 s in total
    expect(messages).toContain('Have you tried walking backwards?')
  })

  it('hints only count time spent near the closed gate (wandering far away does not trigger them)', () => {
    const { logic, messages } = setup()
    const b = makeBot(logic)
    b.go(0, 6) // far from the gate
    b.yaw = Math.PI
    for (let i = 0; i < 60 * 90; i++) b.frame(null)
    expect(messages).not.toContain("Some things only happen when you aren't watching.")
  })
})

describe('Level 7: regression, staring at it from close range must still count as watching it', () => {
  it('standing at any distance directly in front of the gate, eyes on it, never opens it', () => {
    for (const z of [6, 4, 2.5, 1.5, 1.0, 0.0, -0.5, -1.0]) {
      const { logic } = setup()
      const b = makeBot(logic)
      b.x = 0
      b.z = z
      b.yaw = 0 // facing the gate, straight ahead
      b.idle(4000)
      expect(logic.isGateWatched(), `at z=${z}`).toBe(true)
      expect(logic.isGateOpen(), `at z=${z}`).toBe(false)
      logic.dispose()
    }
  })
  it('even looking a little up or down at it still counts as watching it', () => {
    for (const pitch of [-0.5, -0.25, 0.25, 0.5]) {
      const { logic } = setup()
      for (let i = 0; i < 60 * 3; i++) logic.update(fillView({}, { x: 0, y: PLAYER.eyeHeight, z: -1.0 }, 0, pitch), 1000 / 60)
      expect(logic.isGateWatched(), `pitch ${pitch}`).toBe(true)
      expect(logic.isGateOpen(), `pitch ${pitch}`).toBe(false)
    }
  })
  it('looking sideways from right beside the gate still lets it open (so the solution works up close too)', () => {
    const { logic } = setup()
    const b = makeBot(logic)
    b.x = 0
    b.z = -1.0
    b.yaw = EAST
    b.idle(600)
    expect(logic.isGateOpen()).toBe(true)
  })
})

describe('Level 7: the intended solutions work', () => {
  it('look away near the gate, then cross it while still looking away (strafing), then use the exit', () => {
    const { logic, events, onLevelComplete, messages } = setup()
    const b = makeBot(logic)
    expect(b.go(0, 1.5)).toBe(true)
    b.idle(600) // facing the gate: shut
    expect(logic.isGateOpen()).toBe(false)
    b.yaw = EAST // eyes off it
    b.idle(600)
    expect(logic.isGateOpen()).toBe(true)
    expect(events).toContain('gate_open') // it announces itself, so a player can hear it happen
    expect(b.go(0, -3.2)).toBe(true) // sideways through the gap, never looking at it
    expect(logic.hasCrossed()).toBe(true)
    expect(b.z).toBeLessThan(L.crossedZ)
    expect(messages).toContain("Don't look back.")
    expect(logic.useExit()).toBe(true)
    vi.advanceTimersByTime(L.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
    expect(b.violations).toBe(0)
  })

  it('walking backwards through the gate works too (the hint\'s own answer)', () => {
    const { logic } = setup()
    const b = makeBot(logic)
    b.go(0, 1.5)
    b.yaw = Math.PI // turn your back on the gate
    b.idle(600)
    expect(logic.isGateOpen()).toBe(true)
    expect(b.go(0, -3.2)).toBe(true) // moving toward -Z while facing +Z: walking backwards
    expect(logic.hasCrossed()).toBe(true)
    b.yaw = 0
    expect(b.go(0, -5.4)).toBe(true)
    expect(Math.hypot(b.x, b.z - L.door.z)).toBeLessThanOrEqual(DEFAULT_RANGE)
    expect(logic.useExit()).toBe(true)
    expect(b.violations).toBe(0)
  })

  it('the exit cannot be used from the near side', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('"crossed" is announced exactly once however long you stay past the gate', () => {
    const { logic, events } = setup()
    const b = makeBot(logic)
    b.go(0, 1.5)
    b.yaw = EAST
    b.idle(600)
    b.go(0, -3.5)
    b.idle(3000)
    expect(events.filter((e) => e === 'crossed')).toHaveLength(1)
  })
})

describe('Level 7: the gate can never trap or crush the player', () => {
  it('standing inside the gate while looking straight at it keeps it open; it shuts once you step clear', () => {
    const { logic } = setup()
    const b = makeBot(logic)
    b.go(0, 1.5)
    b.yaw = EAST
    b.idle(600) // open
    b.x = 0
    b.z = -1.5 // standing right in the doorway
    b.yaw = 0 // now staring at it
    b.idle(5000)
    expect(logic.isGateWatched()).toBe(true)
    expect(logic.isGateOpen()).toBe(true) // it will not close on you
    expect(b.violations).toBe(0)

    b.z = -1.0 // still touching distance, watched from the front side
    b.go(0, 1.5) // backing away from it while still facing it
    b.idle(300)
    expect(logic.isGateOpen()).toBe(false) // clear of it, and watched: it shuts
  })

  it('across a long, erratic wander the gate is never closed on top of the player', () => {
    const { logic } = setup()
    const b = makeBot(logic)
    let seed = 7
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    for (let leg = 0; leg < 120; leg++) {
      b.yaw = rnd() * Math.PI * 2
      const target = [(rnd() - 0.5) * 6.4, -6 + rnd() * 12]
      b.go(target[0], target[1], 240)
      b.idle(rnd() * 800)
    }
    expect(b.violations).toBe(0)
    expect(Number.isFinite(b.x) && Number.isFinite(b.z)).toBe(true)
    expect(Math.abs(b.x)).toBeLessThanOrEqual(L.room.width / 2)
    expect(Math.abs(b.z)).toBeLessThanOrEqual(L.room.depth / 2)
  })

  it('it is solvable from anywhere on the near side: wander first, then look away and cross', () => {
    for (const start of [[-3, 6], [3, 6], [-3, 0], [3, 0], [0, 6]]) {
      const { logic } = setup()
      const b = makeBot(logic)
      b.x = start[0]
      b.z = start[1]
      b.go(0, 1.8)
      b.yaw = EAST
      b.idle(600)
      b.go(0, -3.2)
      b.yaw = 0
      b.go(0, -5.4)
      expect(logic.useExit(), `from ${start}`).toBe(true)
      expect(b.violations).toBe(0)
      logic.dispose()
    }
  })
})

describe('Level 7: cleanup', () => {
  it('dispose shuts the gate, forgets the hints and the crossing, leaves no timers, and restart is pristine', () => {
    const { logic, onLevelComplete } = setup()
    const b = makeBot(logic)
    b.go(0, 1.5)
    b.yaw = EAST
    b.idle(600)
    b.go(0, -3.2)
    logic.useExit()
    logic.dispose()
    expect(logic.isGateOpen()).toBe(false)
    expect(logic.hasCrossed()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    logic.start()
    expect(logic.isGateOpen()).toBe(false)
    expect(logic.isExitDone()).toBe(false)
    expect(logic.useExit()).toBe(false) // not crossed yet in this run
  })
})
