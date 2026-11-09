import { describe, it, expect, vi } from 'vitest'
import { getStageProfile, STAGE_PROFILES, LEVEL_BASE_STAGE, LEVEL_INTENSITY, MAX_INTENSITY, BASE_INTENSITY_TIERS, INTENSITY_TRIGGERS } from '../../src/game/config/corruption.js'
import { LEVELS } from '../../src/game/config/levels.js'
import { lightMultiplier } from '../../src/game/systems/corruptionEffects.js'
import { createCorruptionSystem } from '../../src/game/systems/CorruptionSystem.js'
import { createAmbientEvents } from '../../src/game/systems/AmbientEvents.js'
import { applyAmbientEvent } from '../../src/game/systems/ambientEffects.js'
import { AMBIENT_EVENTS, AMBIENT_INTENSITY_GAPS_MS, AMBIENT_GAPS_MS } from '../../src/game/config/ambientEvents.js'
import { FAKE_ERROR, FAKE_ERROR_TOTAL_MS, FAKE_LOADING_MS, FAKE_CRASH_MS, FAKE_LOADING_ERROR_MS, MAX_FAKEOUT_MS, fakeLoadingProgress } from '../../src/game/config/fakeouts.js'
import { EVENT_SOUNDS } from '../../src/game/config/audio.js'
import { useGameStore } from '../../src/game/state/gameStore.js'
import { useProgressStore } from '../../src/game/state/progressStore.js'
import { useSettingsStore } from '../../src/game/state/settingsStore.js'
import { useCorruptionFxStore } from '../../src/game/state/corruptionFxStore.js'

const ids = LEVELS.map((l) => l.id)

describe('intensity: corruption keeps growing past stage 3, within hard safety caps', () => {
  it('only changes stage 3, and intensity 0 is plain stage 3', () => {
    for (const stage of [0, 1, 2]) for (const i of [0, 1, 3]) expect(getStageProfile(stage, i)).toBe(STAGE_PROFILES[stage])
    expect(getStageProfile(3, 0)).toBe(STAGE_PROFILES[3])
    expect(getStageProfile(3, 1)).not.toEqual(STAGE_PROFILES[3])
  })

  it('every effect only ever gets stronger (or the light dimmer) as intensity rises', () => {
    for (let i = 1; i <= MAX_INTENSITY; i++) {
      const a = getStageProfile(3, i - 1)
      const b = getStageProfile(3, i)
      expect(b.vignette).toBeGreaterThan(a.vignette)
      expect(b.chroma).toBeGreaterThan(a.chroma)
      expect(b.noise).toBeGreaterThan(a.noise)
      expect(b.scanlines).toBeGreaterThan(a.scanlines)
      expect(b.ambient).toBeLessThan(a.ambient)
      expect(b.fog.far).toBeLessThan(a.fog.far)
    }
  })

  for (let i = 0; i <= MAX_INTENSITY + 2; i++) {
    it(`intensity ${i}: stays inside the safety caps (readable, never near black, never harsh)`, () => {
      const p = getStageProfile(3, i)
      const harsh = i > BASE_INTENSITY_TIERS // tiers 4-6 have their own, higher ceiling (still hard caps)
      expect(p.vignette).toBeLessThanOrEqual((harsh ? 0.88 : 0.78) + 1e-9)
      expect(p.chroma).toBeLessThanOrEqual((harsh ? 0.0036 : 0.0026) + 1e-9)
      expect(p.noise).toBeLessThanOrEqual((harsh ? 0.19 : 0.14) + 1e-9)
      expect(p.scanlines).toBeLessThanOrEqual((harsh ? 0.15 : 0.12) + 1e-9)
      expect(p.ambient).toBeGreaterThanOrEqual((harsh ? 0.54 : 0.62) - 1e-9)
      expect(p.directional).toBeGreaterThanOrEqual((harsh ? 0.45 : 0.52) - 1e-9)
      expect(p.fog.near).toBeGreaterThanOrEqual(2.8 - 1e-9)
      expect(p.dipDepth).toBeLessThanOrEqual(0.36 + 1e-9)
      expect(p.dipPeriod).toBeGreaterThanOrEqual(8 - 1e-9)
      if (i > MAX_INTENSITY) expect(p).toEqual(getStageProfile(3, MAX_INTENSITY)) // past the maximum nothing grows further
    })

    it(`intensity ${i}: the light animation is still smooth, bounded and slow`, () => {
      const p = getStageProfile(3, i)
      const m = []
      for (let f = 0; f <= 60 * 120; f++) m.push(lightMultiplier(p, f / 60, false))
      let maxStep = 0
      for (let f = 1; f < m.length; f++) maxStep = Math.max(maxStep, Math.abs(m[f] - m[f - 1]))
      expect(maxStep).toBeLessThan(0.025)
      expect(Math.min(...m)).toBeGreaterThan(0.5) // never close to black
      let dips = 0
      let inDip = false
      for (const v of m) {
        const deep = v < 0.8
        if (deep && !inDip) dips++
        inDip = deep
      }
      expect(dips).toBeLessThanOrEqual(Math.ceil(120 / p.dipPeriod))
      expect(lightMultiplier(p, 1.234, true)).toBe(1) // reduced motion: no animation at all
    })
  }
})

describe('intensity by level', () => {
  it('only levels that already sit at stage 3 have any, and it never falls along the game', () => {
    for (const [id, v] of Object.entries(LEVEL_INTENSITY)) {
      expect(LEVEL_BASE_STAGE[id], id).toBe(3)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(MAX_INTENSITY)
    }
    const along = ids.map((id) => LEVEL_INTENSITY[id] ?? 0)
    for (let i = 1; i < along.length; i++) expect(along[i]).toBeGreaterThanOrEqual(along[i - 1])
    expect(along[along.length - 1]).toBe(MAX_INTENSITY)
  })

  it('the corruption engine applies it at level start, reports changes, resets it, and honours a pin', () => {
    const seen = []
    const sys = createCorruptionSystem({ onIntensityChange: (v) => seen.push(v) })
    sys.startLevel('level01')
    expect(sys.getIntensity()).toBe(0)
    sys.startLevel('level10')
    expect(sys.getStage()).toBe(3)
    expect(sys.getIntensity()).toBe(LEVEL_INTENSITY.level10)
    sys.reset()
    expect(sys.getIntensity()).toBe(0)
    expect(seen).toEqual([LEVEL_INTENSITY.level10, 0])
    const pinned = createCorruptionSystem({ devStage: 3, devIntensity: 2 })
    pinned.startLevel('level01')
    expect([pinned.getStage(), pinned.getIntensity()]).toEqual([3, 2])
  })

  it('the game store clamps it and clears it with the stage', () => {
    useGameStore.getState().setCorruptionIntensity(99)
    expect(useGameStore.getState().corruptionIntensity).toBe(MAX_INTENSITY)
    useGameStore.getState().setCorruptionIntensity(-4)
    expect(useGameStore.getState().corruptionIntensity).toBe(0)
    useGameStore.getState().setCorruptionIntensity(NaN)
    expect(useGameStore.getState().corruptionIntensity).toBe(0)
  })
})

describe('intensity that grows inside a level', () => {
  const ids = LEVELS.map((l) => l.id)
  it('every rule points at a real level and rises above where that level starts', () => {
    for (const r of INTENSITY_TRIGGERS) {
      expect(ids).toContain(r.levelId)
      expect(LEVEL_BASE_STAGE[r.levelId], r.event).toBe(3) // intensity only matters at stage 3
      expect(r.raiseTo, r.event).toBeGreaterThan(LEVEL_INTENSITY[r.levelId] ?? 0)
      expect(r.raiseTo, r.event).toBeLessThanOrEqual(MAX_INTENSITY)
    }
  })
  it('rises on its event (the Nth time when asked), only in its own level, and never falls inside the run', () => {
    const seen = []
    const sys = createCorruptionSystem({ onIntensityChange: (v) => seen.push(v) })
    sys.startLevel('level14')
    expect(sys.getIntensity()).toBe(LEVEL_INTENSITY.level14)
    sys.report('stare_1') // another level's event
    expect(sys.getIntensity()).toBe(LEVEL_INTENSITY.level14)
    sys.report('times_up')
    expect(sys.getIntensity()).toBe(5)
    sys.report('times_up') // the second miss
    expect(sys.getIntensity()).toBe(6)
    sys.report('times_up')
    expect(sys.getIntensity()).toBe(6)
    sys.reset()
    expect(sys.getIntensity()).toBe(0)
    expect(seen).toEqual([4, 5, 6, 0])
  })
  it('does not touch the stage, and is ignored when the stage or the intensity is pinned for previewing', () => {
    const sys = createCorruptionSystem()
    sys.startLevel('level15')
    expect(sys.report('hint_walls')).toBe(null) // no stage change reported
    expect(sys.getStage()).toBe(3)
    expect(sys.getIntensity()).toBe(5)
    const pinnedStage = createCorruptionSystem({ devStage: 3 })
    pinnedStage.startLevel('level15')
    pinnedStage.report('hint_walls')
    expect(pinnedStage.getIntensity()).toBe(LEVEL_INTENSITY.level15)
    const pinnedIntensity = createCorruptionSystem({ devIntensity: 2 })
    pinnedIntensity.startLevel('level15')
    pinnedIntensity.report('hint_walls')
    expect(pinnedIntensity.getIntensity()).toBe(2)
  })
})

describe('intensity: more frequent unexpected events, never faster than the floor', () => {
  const count = (stage, intensity, minutes = 60, seed = 'x') => {
    const s = createAmbientEvents({ seed })
    let n = 0
    const times = []
    for (let t = 250; t <= minutes * 60000; t += 250) if (s.update(250, stage, false, intensity)) times.push(t), n++
    return { n, times }
  }
  it('each intensity step is busier than the last, but the gap never drops below 16 s', () => {
    const rates = [0, 1, 2, 3, 4, 5, 6].map((i) => count(3, i).n)
    expect(rates[1]).toBeGreaterThan(rates[0])
    expect(rates[3]).toBeGreaterThanOrEqual(rates[1])
    expect(rates[6]).toBeGreaterThanOrEqual(rates[3])
    for (const i of [1, 2, 3, 4, 5, 6]) {
      const { times } = count(3, i, 120)
      for (let k = 1; k < times.length; k++) expect(times[k] - times[k - 1]).toBeGreaterThanOrEqual(16000 - 250)
      expect(AMBIENT_INTENSITY_GAPS_MS[i][0]).toBe(16000)
    }
    expect(AMBIENT_INTENSITY_GAPS_MS[3][1]).toBeLessThan(AMBIENT_GAPS_MS[3][1])
  })
  it('the harshest events only appear when the intensity is high enough', () => {
    const seen = (intensity) => {
      const out = new Set()
      for (let i = 0; i < 15; i++) {
        const s = createAmbientEvents({ seed: `p${i}` })
        for (let t = 250; t <= 60 * 60000; t += 250) {
          const e = s.update(250, 3, false, intensity)
          if (e) out.add(e)
        }
      }
      return out
    }
    for (const intensity of [0, 1, 2, 3, 4, 5, 6]) for (const e of seen(intensity)) expect(e.minIntensity ?? 0).toBeLessThanOrEqual(intensity)
    expect([...seen(3)].some((e) => (e.minIntensity ?? 0) === 3)).toBe(true)
    for (const tier of [4, 5, 6]) expect([...seen(6)].some((e) => (e.minIntensity ?? 0) === tier), `tier ${tier}`).toBe(true)
    expect([...seen(3)].some((e) => (e.minIntensity ?? 0) > 3)).toBe(false) // the harsher events wait for the later levels
    expect([...seen(0)].some((e) => (e.minIntensity ?? 0) > 0)).toBe(false)
  })
})

describe('rage-bait stays honest', () => {
  const baits = AMBIENT_EVENTS.filter((e) => e.bait)

  it('there is real rage-bait to be had, spread across the intensities', () => {
    expect(baits.length).toBeGreaterThanOrEqual(5)
    for (const k of [1, 2, 3, 4, 5, 6]) expect(baits.some((e) => e.minIntensity === k)).toBe(true)
  })
  it('every bait reveals itself quickly and never needs the player to do anything', () => {
    for (const e of baits) {
      if (e.kind === 'fakeError') continue // the dialog reveals itself; its own total is checked below
      expect(e.then, e.id).toBeDefined()
      expect(e.then.afterMs, e.id).toBeLessThanOrEqual(3000)
      expect(e.then.text.length, e.id).toBeLessThanOrEqual(40)
      expect(e.kind, e.id).toBe('notice')
    }
  })
  it('only kinds that are baits (or plain notices) carry a reveal; and baits never appear before the late game', () => {
    for (const e of AMBIENT_EVENTS) if (e.then) expect(e.bait).toBe(true)
    for (const e of baits) expect(e.minIntensity).toBeGreaterThanOrEqual(1)
  })
  it('every fake-out has a short, fixed duration', () => {
    expect(FAKE_ERROR_TOTAL_MS).toBe(FAKE_ERROR.checkingMs + FAKE_ERROR.revealMs)
    expect(FAKE_ERROR_TOTAL_MS).toBeLessThanOrEqual(MAX_FAKEOUT_MS)
    expect(FAKE_LOADING_MS + FAKE_LOADING_ERROR_MS).toBeLessThanOrEqual(MAX_FAKEOUT_MS)
    expect(FAKE_CRASH_MS).toBeLessThanOrEqual(MAX_FAKEOUT_MS)
  })
  it('the fake loading bar races ahead, crawls, and never reaches 100%', () => {
    let prev = -1
    for (let ms = 0; ms <= FAKE_LOADING_MS * 3; ms += 50) {
      const p = fakeLoadingProgress(ms)
      expect(p).toBeGreaterThanOrEqual(prev)
      expect(p).toBeLessThanOrEqual(99)
      prev = p
    }
    expect(fakeLoadingProgress(0)).toBe(0)
    expect(fakeLoadingProgress(FAKE_LOADING_MS * 0.6)).toBeGreaterThanOrEqual(89)
    expect(fakeLoadingProgress(FAKE_LOADING_MS)).toBe(99)
  })
  it('every sound an event asks for exists', () => {
    for (const e of AMBIENT_EVENTS) if (e.sound) expect(EVENT_SOUNDS[e.sound], e.id).toBeDefined()
  })

  it('applying ANY event (and its reveal) changes nothing real: not progress, settings, saves, or game state', () => {
    useProgressStore.getState().completeLevel('level01')
    const snap = () =>
      JSON.stringify({
        game: (({ status, levelId, completedPuzzles, runId, corruptionStage, objective }) => ({ status, levelId, completedPuzzles, runId, corruptionStage, objective }))(useGameStore.getState()),
        progress: useProgressStore.getState().completedLevelIds,
        settings: (({ masterVolume, sfxVolume, ambientVolume, mouseSensitivity, muted, reducedMotion }) => ({ masterVolume, sfxVolume, ambientVolume, mouseSensitivity, muted, reducedMotion }))(useSettingsStore.getState()),
      })
    const before = snap()
    const audioManager = { playEvent: vi.fn() }
    for (const e of AMBIENT_EVENTS) {
      applyAmbientEvent(e, { audioManager, schedule: (fn) => fn() }) // run the reveal immediately too
    }
    expect(snap()).toBe(before)
    expect(audioManager.playEvent).toHaveBeenCalled()
    useCorruptionFxStore.getState().reset()
    useProgressStore.getState().resetProgress()
  })

  it('a reveal is scheduled (not instant) and its timer is handed back so it can be cancelled', () => {
    const schedule = vi.fn(() => 42)
    const erased = AMBIENT_EVENTS.find((e) => e.id === 'bait-erased')
    const id = applyAmbientEvent(erased, { audioManager: { playEvent: vi.fn() }, schedule })
    expect(id).toBe(42)
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), erased.then.afterMs)
    expect(useCorruptionFxStore.getState().banner.text).toBe('PROGRESS ERASED.') // the bait first ...
    schedule.mock.calls[0][0]()
    expect(useCorruptionFxStore.getState().banner.text).toBe('JUST KIDDING.') // ... then the reveal
    useCorruptionFxStore.getState().reset()
  })

  it('the fake error dialog is a store flag that clears only for its own id', () => {
    const fx = useCorruptionFxStore.getState()
    fx.showFakeError()
    const { id } = useCorruptionFxStore.getState().fakeError
    fx.clearFakeError(id + 1)
    expect(useCorruptionFxStore.getState().fakeError).not.toBe(null)
    fx.clearFakeError(id)
    expect(useCorruptionFxStore.getState().fakeError).toBe(null)
  })
})
