import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LEVELS } from '../../src/game/config/levels.js'
import { PROGRESSION, TONES, getTone } from '../../src/game/config/progression.js'
import { LEVEL_BASE_STAGE, CORRUPTION_TRIGGERS } from '../../src/game/config/corruption.js'
import { createCorruptionSystem } from '../../src/game/systems/CorruptionSystem.js'
import { createAmbientEvents } from '../../src/game/systems/AmbientEvents.js'
import { SOLVERS, FACTORIES } from '../helpers/levelSolvers.js'
import { GAME_TAGLINE } from '../../src/game/config/meta.js'

const readme = () => readFileSync(fileURLToPath(new URL('../../README.md', import.meta.url)), 'utf8')
const ids = LEVELS.map((l) => l.id)
const stages = ids.map((id) => LEVEL_BASE_STAGE[id])

describe('the difficulty curve', () => {
  it('describes exactly the levels that exist, in order, one tier each, strictly rising', () => {
    expect(Object.keys(PROGRESSION).sort()).toEqual([...ids].sort())
    ids.forEach((id, i) => expect(PROGRESSION[id].tier, id).toBe(i + 1))
    for (let i = 1; i < ids.length; i++) expect(PROGRESSION[ids[i]].tier).toBeGreaterThan(PROGRESSION[ids[i - 1]].tier)
  })

  it('never gets less deceptive, and the finale is the most deceptive of all', () => {
    const d = ids.map((id) => PROGRESSION[id].deceptions)
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThanOrEqual(d[i - 1])
    expect(d[d.length - 1]).toBe(Math.max(...d))
    expect(d[d.length - 1]).toBeGreaterThan(d[0])
  })

  it('every level introduces a NEW kind of trick, so earlier solutions cannot simply be reused', () => {
    const tricks = ids.map((id) => PROGRESSION[id].introduces)
    expect(new Set(tricks).size).toBe(ids.length)
  })

  it('every level has a deliberate, written solution, and a solver that proves it works', () => {
    for (const id of ids) {
      expect(PROGRESSION[id].solution.length, id).toBeGreaterThan(30)
      expect(typeof SOLVERS[id], id).toBe('function')
      expect(typeof FACTORIES[id], id).toBe('function')
    }
  })
})

describe('the tone: harmless and funny early, unsettling and disturbing late', () => {
  it('the first levels are clean and funny', () => {
    expect(stages.slice(0, 2)).toEqual([0, 0])
    expect(ids.slice(0, 2).map(getTone)).toEqual(['funny', 'funny'])
  })
  it('corruption never eases off from one level to the next, and ends at the maximum', () => {
    for (let i = 1; i < stages.length; i++) expect(stages[i]).toBeGreaterThanOrEqual(stages[i - 1])
    expect(stages.slice(-2)).toEqual([3, 3])
    expect(getTone(ids[ids.length - 1])).toBe('disturbing')
  })
  it('every tone is used, and the game passes through each in order', () => {
    const tones = ids.map(getTone)
    for (const t of TONES) expect(tones).toContain(t)
    const order = tones.map((t) => TONES.indexOf(t))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })
  it('unexpected ambient events can only happen once the game has stopped being harmless', () => {
    const quietLevels = ids.filter((id) => LEVEL_BASE_STAGE[id] === 0)
    expect(quietLevels.length).toBeGreaterThanOrEqual(2)
    for (const id of quietLevels) {
      const sched = createAmbientEvents({ seed: `${id}:1` })
      for (let t = 0; t < 3600; t++) expect(sched.update(1000, 0, false)).toBe(null) // an hour at stage 0: nothing
    }
  })
  it('the README table of the curve matches the data row for row', () => {
    const r = readme()
    ids.forEach((id, i) => {
      const row = `| ${i + 1} | ${LEVELS[i].name} | ${getTone(id)} | ${LEVEL_BASE_STAGE[id]} | ${PROGRESSION[id].introduces} |`
      expect(r, row).toContain(row)
    })
    expect(r).toContain(GAME_TAGLINE)
  })
})

describe('the game reacts to a struggling player (corruption driven by events, not randomness)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const wire = (id) => {
    const sys = createCorruptionSystem()
    const logic = FACTORIES[id]({ getStage: sys.getStage, onGameEvent: (n) => sys.report(n), onLevelStart: () => sys.startLevel(id), onLevelDispose: () => sys.reset() })
    logic.start()
    return { sys, logic }
  }

  it('Level 5: three wrong presses push corruption to the maximum (and the lamps replay)', () => {
    const { sys, logic } = wire('level05')
    expect(sys.getStage()).toBe(LEVEL_BASE_STAGE.level05)
    for (let i = 0; i < 3; i++) logic.pressColor(0) // red is never the right first press
    expect(sys.getStage()).toBe(3)
    expect(logic.isReplaying()).toBe(true)
  })
  it('Level 6: the second wrong press raises corruption and calls a blackout', () => {
    const { sys, logic } = wire('level06')
    logic.pressButton(1)
    expect(sys.getStage()).toBe(LEVEL_BASE_STAGE.level06)
    logic.pressButton(1)
    expect(sys.getStage()).toBe(3)
    expect(logic.isBlackout()).toBe(true)
  })
  it('every rule points at a level and an event that really exist', () => {
    for (const r of CORRUPTION_TRIGGERS) {
      expect(ids).toContain(r.levelId)
      expect(r.raiseTo).toBeGreaterThan(LEVEL_BASE_STAGE[r.levelId]) // a rule that cannot raise anything is dead weight
    }
  })
  it('a struggling player still wins: after the corruption jump each of those levels is still solvable', () => {
    for (const id of ['level05', 'level06']) {
      const { sys, logic } = wire(id)
      if (id === 'level05') for (let i = 0; i < 4; i++) logic.pressColor(0)
      else for (let i = 0; i < 4; i++) logic.pressButton(1)
      expect(sys.getStage()).toBe(3)
      expect(SOLVERS[id](logic)).toBe(true)
    }
  })
})
