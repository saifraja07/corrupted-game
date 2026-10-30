import { describe, it, expect, vi, afterEach } from 'vitest'
import { createCorruptionSystem } from '../../src/game/systems/CorruptionSystem.js'
import { createDialogueSystem } from '../../src/game/systems/DialogueSystem.js'
import { CORRUPTION_TRIGGERS, LEVEL_BASE_STAGE, STAGE_BANNERS, MAX_STAGE } from '../../src/game/config/corruption.js'
import { LEVELS } from '../../src/game/config/levels.js'
import { corruption, readDevStage, resetCorruption, reportGameEvent, startCorruptionForLevel } from '../../src/game/state/corruptionController.js'
import { useGameStore } from '../../src/game/state/gameStore.js'
import { useCorruptionFxStore } from '../../src/game/state/corruptionFxStore.js'

afterEach(() => {
  vi.useRealTimers()
  resetCorruption()
})

describe('config sanity', () => {
  it('every level has a base stage in range, and no stage lies about the maximum', () => {
    for (const l of LEVELS) expect(LEVEL_BASE_STAGE[l.id]).toBeGreaterThanOrEqual(0)
    for (const s of Object.values(LEVEL_BASE_STAGE)) expect(s).toBeLessThanOrEqual(MAX_STAGE)
    for (const r of CORRUPTION_TRIGGERS) {
      expect(r.raiseTo).toBeGreaterThanOrEqual(1)
      expect(r.raiseTo).toBeLessThanOrEqual(MAX_STAGE)
    }
  })
  it('base stages never decrease as levels progress (the game only gets stranger)', () => {
    const stages = LEVELS.map((l) => LEVEL_BASE_STAGE[l.id])
    for (let i = 1; i < stages.length; i++) expect(stages[i]).toBeGreaterThanOrEqual(stages[i - 1])
  })
  it('the first level is clean', () => {
    expect(LEVEL_BASE_STAGE.level01).toBe(0)
  })
})

describe('CorruptionSystem', () => {
  const make = (extra = {}) => {
    const changes = []
    const sys = createCorruptionSystem({ onChange: (...a) => changes.push(a), ...extra })
    return { sys, changes }
  }

  it('starts a level at its base stage', () => {
    const { sys, changes } = make()
    sys.startLevel('level03')
    expect(sys.getStage()).toBe(LEVEL_BASE_STAGE.level03)
    expect(changes).toEqual([[1, 0, 'level_start']])
  })

  it('rises only on its specific events, in the right level', () => {
    const { sys } = make()
    sys.startLevel('level04')
    expect(sys.report('door_rejected')).toBe(null)
    expect(sys.report('controls_reversed')).toBe(null) // that rule belongs to level 3
    expect(sys.getStage()).toBe(2)
    expect(sys.report('sign_changed')).toBe(3)
    expect(sys.getStage()).toBe(3)
  })

  it('returns the new stage only when it actually rises, and never lowers', () => {
    const { sys } = make()
    sys.startLevel('level04')
    expect(sys.report('sign_changed')).toBe(3)
    expect(sys.report('sign_changed')).toBe(null)
    expect(sys.getStage()).toBe(3)
  })

  it('count thresholds need enough occurrences', () => {
    const { sys } = make({ rules: [{ event: 'x', raiseTo: 2, count: 3 }] })
    sys.startLevel('level01')
    expect(sys.report('x')).toBe(null)
    expect(sys.report('x')).toBe(null)
    expect(sys.report('x')).toBe(2)
  })

  it('is deterministic: replaying a level restores the base stage and the same events give the same stages', () => {
    const { sys } = make()
    const run = () => {
      sys.startLevel('level02')
      const a = sys.getStage()
      sys.report('button_b')
      return [a, sys.getStage()]
    }
    const first = run()
    sys.startLevel('level02') // restart
    expect(sys.getStage()).toBe(0)
    expect(run()).toEqual(first)
  })

  it('ignores events before any level starts and after reset', () => {
    const { sys } = make()
    expect(sys.report('sign_changed')).toBe(null)
    sys.startLevel('level04')
    sys.reset()
    expect(sys.getStage()).toBe(0)
    expect(sys.report('sign_changed')).toBe(null)
  })

  it('a pinned (developer) stage overrides base stages and ignores events', () => {
    const { sys } = make({ devStage: 3 })
    sys.startLevel('level01')
    expect(sys.getStage()).toBe(3)
    expect(sys.report('sign_changed')).toBe(null)
    sys.reset()
    expect(sys.getStage()).toBe(0)
  })

  it('clamps out-of-range pins and unknown levels', () => {
    const a = createCorruptionSystem({ devStage: 99 })
    a.startLevel('level01')
    expect(a.getStage()).toBe(MAX_STAGE)
    const b = createCorruptionSystem()
    b.startLevel('no-such-level')
    expect(b.getStage()).toBe(0)
  })
})

describe('developer preview parsing', () => {
  it('accepts only ?corruption=0..3', () => {
    expect(readDevStage('?corruption=2')).toBe(2)
    expect(readDevStage('?a=1&corruption=0')).toBe(0)
    for (const bad of ['', '?corruption=4', '?corruption=-1', '?corruption=abc', '?corruption=2x', '?corruption=']) {
      expect(readDevStage(bad)).toBe(null)
    }
  })
})

describe('live controller (stores)', () => {
  it('pushes the stage into gameStore, bursts only for in-play rises, and clears on reset', () => {
    const bursts = () => useCorruptionFxStore.getState().burstId
    const before = bursts()
    startCorruptionForLevel('level03')
    expect(useGameStore.getState().corruptionStage).toBe(1)
    expect(bursts()).toBe(before) // no glitch burst just for starting a corrupted level

    expect(reportGameEvent('controls_reversed')).toBe(2)
    expect(useGameStore.getState().corruptionStage).toBe(2)
    expect(bursts()).toBe(before + 1)
    expect(useCorruptionFxStore.getState().banner?.text).toBe(STAGE_BANNERS[2])

    resetCorruption()
    expect(useGameStore.getState().corruptionStage).toBe(0)
    expect(useCorruptionFxStore.getState().banner).toBe(null)
    expect(corruption.getStage()).toBe(0)
  })
  it('gameStore clamps and ignores junk stages', () => {
    const g = useGameStore.getState()
    g.setCorruptionStage(99)
    expect(useGameStore.getState().corruptionStage).toBe(3)
    g.setCorruptionStage(-5)
    expect(useGameStore.getState().corruptionStage).toBe(0)
    g.setCorruptionStage(NaN)
    expect(useGameStore.getState().corruptionStage).toBe(0)
  })
  it('banner clears only for its own id', () => {
    const fx = useCorruptionFxStore.getState()
    fx.stageRose(3)
    const { id } = useCorruptionFxStore.getState().banner
    fx.clearBanner(id + 1)
    expect(useCorruptionFxStore.getState().banner).not.toBe(null)
    fx.clearBanner(id)
    expect(useCorruptionFxStore.getState().banner).toBe(null)
  })
})

describe('stage-gated dialogue', () => {
  it('lines with minStage/maxStage appear only at matching stages', () => {
    vi.useFakeTimers()
    let stage = 0
    const lines = [
      { id: 'a', trigger: 't', text: 'always', duration: 1000 },
      { id: 'late', trigger: 't', text: 'late only', duration: 1000, minStage: 2 },
      { id: 'early', trigger: 'e', text: 'early only', duration: 1000, maxStage: 1 },
    ]
    const d = createDialogueSystem({ lines, getStage: () => stage, defaultCooldown: 0, minRepeatMs: 0 })
    const seen = []
    for (let i = 0; i < 3; i++) {
      d.trigger('t')
      seen.push(d.getActive().id)
      vi.advanceTimersByTime(1000)
    }
    expect(seen).toEqual(['a', 'a', 'a']) // 'late' is never eligible at stage 0
    expect(d.trigger('e')).toBe('shown')
    vi.advanceTimersByTime(1000)
    stage = 2
    expect(d.trigger('e')).toBe(false) // maxStage 1 now excludes it
    const later = []
    for (let i = 0; i < 4; i++) {
      d.trigger('t')
      later.push(d.getActive().id)
      vi.advanceTimersByTime(1000)
    }
    expect(later).toContain('late')
  })
})
