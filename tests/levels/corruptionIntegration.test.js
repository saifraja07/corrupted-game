import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCorruptionSystem } from '../../src/game/systems/CorruptionSystem.js'
import { createLevel01Logic } from '../../src/game/levels/level01/createLevel01Logic.js'
import { createLevel02Logic } from '../../src/game/levels/level02/createLevel02Logic.js'
import { createLevel03Logic } from '../../src/game/levels/level03/createLevel03Logic.js'
import { createLevel04Logic } from '../../src/game/levels/level04/createLevel04Logic.js'
import { fillView } from '../../src/game/mechanics/lookAway.js'
import { FACTORIES, SOLVERS } from '../helpers/levelSolvers.js'

const DT = 1 / 60
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

// Wire a level to a corruption system exactly like levelCallbacks does (minus the React stores).
function wire(levelId, factory, sys) {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = factory({
    onMessage: (l) => messages.push(l ? l.text : null),
    onLevelComplete,
    getStage: sys.getStage,
    onGameEvent: (name) => sys.report(name),
    onLevelStart: () => sys.startLevel(levelId),
    onLevelDispose: () => sys.reset(),
  })
  logic.start()
  return { logic, messages, onLevelComplete }
}
const eye = { x: 0, y: 1.6, z: 0 }
const lookingAway = () => fillView({}, eye, Math.PI / 2, 0)

describe('every level stays completable at every corruption stage', () => {
  for (const levelId of Object.keys(FACTORIES)) {
    for (const stage of [0, 1, 2, 3]) {
      it(`${levelId} at pinned stage ${stage}`, () => {
        const sys = createCorruptionSystem({ devStage: stage })
        const { logic, onLevelComplete } = wire(levelId, FACTORIES[levelId], sys)
        expect(sys.getStage()).toBe(stage)
        expect(SOLVERS[levelId](logic)).toBe(true)
        vi.advanceTimersByTime(5000)
        expect(onLevelComplete).toHaveBeenCalledTimes(1)
      })
    }
  }
})

describe('corruption driven by real gameplay events', () => {
  it('Level 1 stays clean however hard the player struggles with the door', () => {
    const sys = createCorruptionSystem()
    const { logic, messages } = wire('level01', createLevel01Logic, sys)
    for (let i = 0; i < 10; i++) {
      logic.update({ x: logic.getDoorX(), z: -3.5 }, DT)
      for (let f = 0; f < 120; f++) logic.update({ x: 0, z: 5 }, DT)
      vi.advanceTimersByTime(6000)
    }
    expect(logic.getDodgeCount()).toBe(10)
    expect(sys.getStage()).toBe(0)
    expect(messages.some((m) => m && /manual|WARNING|parameters/.test(m))).toBe(false)
  })

  it('Level 2 turns slightly strange only when the hidden ceiling button is found', () => {
    const sys = createCorruptionSystem()
    const { logic, messages } = wire('level02', createLevel02Logic, sys)
    expect(sys.getStage()).toBe(0)
    logic.pressA()
    expect(sys.getStage()).toBe(0)
    vi.advanceTimersByTime(20000) // a real player takes a while to find the ceiling button
    logic.pressB()
    expect(sys.getStage()).toBe(1)
    vi.advanceTimersByTime(7000) // its own line plays first, then the stage-change line
    expect(messages).toContain('Fine. You found the other one.')
    expect(messages).toContain("That wasn't in the manual.")
  })

  it('Level 3 starts slightly strange; reversing the controls escalates and the system comments', () => {
    const sys = createCorruptionSystem()
    const { logic, messages } = wire('level03', createLevel03Logic, sys)
    expect(sys.getStage()).toBe(1)
    logic.update({ x: 0, z: 1 })
    expect(sys.getStage()).toBe(2)
    expect(logic.isReversed()).toBe(true) // corruption never changes the mechanic itself
    vi.advanceTimersByTime(4000)
    expect(messages).toContain('Controls updated. You are welcome.')
    expect(messages).toContain('Everything is functioning within acceptable parameters.')
  })

  it('Level 4 reaches stage 3 on the look-away sign change, with the stage-gated lines', () => {
    const sys = createCorruptionSystem()
    const { logic, messages, onLevelComplete } = wire('level04', createLevel04Logic, sys)
    expect(sys.getStage()).toBe(2)
    for (let i = 0; i < 2; i++) {
      logic.useFakeExit()
      vi.advanceTimersByTime(4000)
    }
    expect(sys.getStage()).toBe(2) // the sign hasn't changed yet (needs a look-away)
    logic.update(lookingAway())
    expect(sys.getStage()).toBe(3)
    expect(messages).toContain('Did that sign always say that?')
    vi.advanceTimersByTime(4000)
    expect(messages).toContain('WARNING: PLAYER BEHAVIOR OUTSIDE EXPECTED PARAMETERS.')

    // Stage-3-only line joins the rotation for later fake exits.
    const seen = new Set()
    for (let i = 0; i < 6; i++) {
      logic.useFakeExit()
      seen.add(messages.at(-1))
      vi.advanceTimersByTime(4000)
    }
    expect(messages).toContain('You have been here before.')
    expect(logic.useRealExit()).toBe(true) // still solvable
    vi.advanceTimersByTime(5000)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('stage-3-only lines never show at lower stages', () => {
    const sys = createCorruptionSystem()
    const { logic, messages } = wire('level04', createLevel04Logic, sys) // stage 2
    for (let i = 0; i < 6; i++) {
      logic.useFakeExit()
      vi.advanceTimersByTime(4000)
    }
    expect(sys.getStage()).toBe(2)
    expect(messages).not.toContain('You have been here before.')
  })
})

describe('corruption is reversible and leaves nothing behind', () => {
  it('disposing a level returns corruption to normal; restarting begins at the base stage again', () => {
    const sys = createCorruptionSystem()
    const { logic } = wire('level04', createLevel04Logic, sys)
    logic.useFakeExit()
    vi.advanceTimersByTime(4000)
    logic.useFakeExit()
    logic.update(lookingAway())
    expect(sys.getStage()).toBe(3)
    logic.dispose()
    expect(sys.getStage()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    logic.start()
    expect(sys.getStage()).toBe(2)
    expect(logic.getSignText()).toBe('THE EXIT IS ON THE LEFT.')
  })
})
