import { describe, it, expect, vi } from 'vitest'
import { createAmbientEvents } from '../../src/game/systems/AmbientEvents.js'
import { applyAmbientEvent } from '../../src/game/systems/ambientEffects.js'
import { createRng } from '../../src/game/systems/random.js'
import { useCorruptionFxStore } from '../../src/game/state/corruptionFxStore.js'
import { AMBIENT_EVENTS, AMBIENT_FIRST_DELAY_MS, AMBIENT_GAPS_MS, AMBIENT_RETRY_MS } from '../../src/game/config/ambientEvents.js'
import { EVENT_SOUNDS } from '../../src/game/config/audio.js'

const DT = 250 // ms per simulated tick

// Run the scheduler and return [{ t, event }] in ms.
function simulate({ stage = 1, seed = 's', minutes = 30, busy = () => false, stageAt = null }) {
  const sched = createAmbientEvents({ seed })
  const out = []
  for (let t = DT; t <= minutes * 60000; t += DT) {
    const s = stageAt ? stageAt(t) : stage
    const ev = sched.update(DT, s, busy(t))
    if (ev) out.push({ t, event: ev })
  }
  return out
}
const gaps = (list) => list.slice(1).map((e, i) => e.t - list[i].t)

describe('ambient events: pacing', () => {
  it('never happen at stage 0, however long the player plays (the early game stays harmless)', () => {
    for (const seed of ['a', 'b', 'c']) expect(simulate({ stage: 0, seed, minutes: 360 })).toEqual([])
  })

  it('never happen in the first 20 seconds of a level', () => {
    for (const stage of [1, 2, 3]) {
      for (let i = 0; i < 25; i++) {
        const first = simulate({ stage, seed: `seed-${i}`, minutes: 5 })[0]
        expect(first.t).toBeGreaterThanOrEqual(AMBIENT_FIRST_DELAY_MS)
      }
    }
  })

  for (const stage of [1, 2, 3]) {
    it(`stage ${stage}: consecutive events respect the minimum gap (nothing can strobe)`, () => {
      const [min, max] = AMBIENT_GAPS_MS[stage]
      expect(min).toBeGreaterThanOrEqual(16000)
      for (let i = 0; i < 20; i++) {
        for (const g of gaps(simulate({ stage, seed: `g${i}`, minutes: 90 }))) {
          expect(g).toBeGreaterThanOrEqual(min - DT)
          expect(g).toBeLessThanOrEqual(max + DT)
        }
      }
    })
  }

  it('gets steadily busier with each stage', () => {
    const perHour = (stage) => {
      let total = 0
      for (let i = 0; i < 10; i++) total += simulate({ stage, seed: `r${i}`, minutes: 60 }).length
      return total / 10
    }
    const [s1, s2, s3] = [perHour(1), perHour(2), perHour(3)]
    expect(s1).toBeGreaterThan(20)
    expect(s2).toBeGreaterThan(s1 * 1.4)
    expect(s3).toBeGreaterThan(s2 * 1.4)
  })

  it('config: gaps shrink as stages rise and the floor is 16 s', () => {
    expect(AMBIENT_GAPS_MS[2][0]).toBeLessThan(AMBIENT_GAPS_MS[1][0])
    expect(AMBIENT_GAPS_MS[3][0]).toBeLessThan(AMBIENT_GAPS_MS[2][0])
    expect(Math.min(...Object.values(AMBIENT_GAPS_MS).map((g) => g[0]))).toBe(16000)
  })
})

describe('ambient events: determinism and variety', () => {
  const summary = (list) => list.map((e) => `${e.t}:${e.event.id}`).join('|')
  it('same seed, same events; different seeds differ (a restarted level behaves identically)', () => {
    const a = simulate({ stage: 3, seed: 'level04:7', minutes: 20 })
    expect(summary(simulate({ stage: 3, seed: 'level04:7', minutes: 20 }))).toBe(summary(a))
    expect(summary(simulate({ stage: 3, seed: 'level04:8', minutes: 20 }))).not.toBe(summary(a))
  })
  it('only offers events unlocked at the current stage, and eventually shows every one', () => {
    for (const stage of [1, 2, 3]) {
      const seen = new Set()
      for (let i = 0; i < 12; i++) for (const { event } of simulate({ stage, seed: `v${i}`, minutes: 120 })) seen.add(event.id)
      const expected = AMBIENT_EVENTS.filter((e) => e.minStage <= stage).map((e) => e.id)
      expect([...seen].sort()).toEqual(expected.sort())
    }
  })
  it('the seeded random generator is repeatable and spread over [0, 1)', () => {
    const a = createRng('x')
    const b = createRng('x')
    const xs = Array.from({ length: 1000 }, () => a())
    expect(xs).toEqual(Array.from({ length: 1000 }, () => b()))
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...xs)).toBeLessThan(1)
    expect(xs.reduce((s, v) => s + v, 0) / xs.length).toBeGreaterThan(0.4)
  })
})

describe('ambient events: courtesy and stage changes', () => {
  it('never fires while a dialogue line is showing, and goes soon after it ends', () => {
    const busyUntil = 5 * 60000
    const list = simulate({ stage: 3, seed: 'busy', minutes: 8, busy: (t) => t < busyUntil })
    expect(list.length).toBeGreaterThan(0)
    expect(list[0].t).toBeGreaterThanOrEqual(busyUntil)
    expect(list[0].t - busyUntil).toBeLessThanOrEqual(AMBIENT_RETRY_MS + DT * 2)
  })
  it('speeds up straight away when corruption rises mid-level', () => {
    const list = simulate({ seed: 'rise', minutes: 3, stageAt: (t) => (t < 21000 ? 1 : 3) })
    const afterRise = list.find((e) => e.t > 21000)
    expect(afterRise.t - 21000).toBeLessThanOrEqual(AMBIENT_GAPS_MS[3][1] + DT)
  })
  it('going back to stage 0 resets the clock (the 20 s grace applies again)', () => {
    const list = simulate({ seed: 'reset', minutes: 4, stageAt: (t) => (t < 60000 ? 3 : t < 100000 ? 0 : 3) })
    const afterReturn = list.find((e) => e.t > 100000)
    expect(afterReturn.t - 100000).toBeGreaterThanOrEqual(AMBIENT_FIRST_DELAY_MS - DT)
  })
})

describe('ambient events: content is safe and readable', () => {
  it('has unique ids, positive weights, short readable text, and real sounds', () => {
    expect(new Set(AMBIENT_EVENTS.map((e) => e.id)).size).toBe(AMBIENT_EVENTS.length)
    for (const e of AMBIENT_EVENTS) {
      expect(e.weight).toBeGreaterThan(0)
      expect([1, 2, 3]).toContain(e.minStage)
      expect(['notice', 'objective', 'sound']).toContain(e.kind)
      if (e.kind !== 'sound') {
        expect(e.text.length).toBeGreaterThan(0)
        expect(e.text.length).toBeLessThanOrEqual(40)
      }
      if (e.sound) expect(EVENT_SOUNDS[e.sound], e.id).toBeDefined()
    }
  })
  it('glitch bursts only appear from stage 2 up, and every stage has something new', () => {
    for (const e of AMBIENT_EVENTS) if (e.burst) expect(e.minStage).toBeGreaterThanOrEqual(2)
    for (const stage of [1, 2, 3]) expect(AMBIENT_EVENTS.some((e) => e.minStage === stage)).toBe(true)
  })
})

describe('applying an ambient event', () => {
  const fx = () => useCorruptionFxStore.getState()
  const fakeAudio = () => ({ playEvent: vi.fn() })

  it('a notice shows a banner that only its own id can clear', () => {
    fx().reset()
    applyAmbientEvent({ kind: 'notice', text: 'HELLO' }, { audioManager: fakeAudio() })
    const { id, text } = fx().banner
    expect(text).toBe('HELLO')
    fx().clearBanner(id + 1)
    expect(fx().banner).not.toBe(null)
    fx().clearBanner(id)
    expect(fx().banner).toBe(null)
  })
  it('an objective distortion is temporary: it is replaced by clearing, and the real objective is never stored over', () => {
    fx().reset()
    applyAmbientEvent({ kind: 'objective', text: 'STOP LOOKING.' }, { audioManager: fakeAudio() })
    const g = fx().objectiveGlitch
    expect(g.text).toBe('STOP LOOKING.')
    fx().clearObjectiveGlitch(g.id)
    expect(fx().objectiveGlitch).toBe(null)
  })
  it('bursts and sounds fire only when the event asks for them', () => {
    const a = fakeAudio()
    const before = fx().burstId
    applyAmbientEvent({ kind: 'sound', sound: 'ambient_glitch' }, { audioManager: a })
    expect(a.playEvent).toHaveBeenCalledWith('ambient_glitch')
    expect(fx().burstId).toBe(before)
    applyAmbientEvent({ kind: 'notice', text: 'X', burst: true }, { audioManager: a })
    expect(fx().burstId).toBe(before + 1)
    expect(a.playEvent).toHaveBeenCalledTimes(1)
  })
  it('reset clears every temporary effect at once', () => {
    applyAmbientEvent({ kind: 'notice', text: 'A' }, { audioManager: fakeAudio() })
    applyAmbientEvent({ kind: 'objective', text: 'B' }, { audioManager: fakeAudio() })
    fx().reset()
    expect(fx().banner).toBe(null)
    expect(fx().objectiveGlitch).toBe(null)
  })
})
