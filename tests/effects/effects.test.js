import { describe, it, expect } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { lightMultiplier } from '../../src/game/systems/corruptionEffects.js'
import { corruptText } from '../../src/game/systems/textCorruption.js'
import { STAGE_PROFILES } from '../../src/game/config/corruption.js'
import GlitchOverlay from '../../src/components/effects/GlitchOverlay.jsx'
import CorruptionBanner from '../../src/components/effects/CorruptionBanner.jsx'
import ScreenEffects from '../../src/components/effects/ScreenEffects.jsx'
import EffectsBoundary from '../../src/components/effects/EffectsBoundary.jsx'

describe('stage profiles', () => {
  it('get steadily more intense: darker, more vignette, more grain, never brighter', () => {
    for (let s = 1; s < STAGE_PROFILES.length; s++) {
      const a = STAGE_PROFILES[s - 1]
      const b = STAGE_PROFILES[s]
      expect(b.ambient).toBeLessThanOrEqual(a.ambient)
      expect(b.vignette).toBeGreaterThanOrEqual(a.vignette)
      expect(b.noise).toBeGreaterThanOrEqual(a.noise)
      expect(b.chroma).toBeGreaterThanOrEqual(a.chroma)
    }
  })
  it('stay readable: the scene never goes near black, and distortion stays small', () => {
    for (const p of STAGE_PROFILES) {
      expect(p.ambient).toBeGreaterThanOrEqual(0.6)
      expect(p.directional).toBeGreaterThanOrEqual(0.5)
      expect(p.vignette).toBeLessThanOrEqual(0.7)
      expect(p.chroma).toBeLessThanOrEqual(0.002)
      expect(p.noise).toBeLessThanOrEqual(0.12)
      expect(p.scanlines).toBeLessThanOrEqual(0.1)
    }
  })
  it('stage 0 is completely clean', () => {
    const p = STAGE_PROFILES[0]
    expect([p.fog, p.vignette, p.chroma, p.noise, p.scanlines, p.breathe, p.dipPeriod]).toEqual([null, 0, 0, 0, 0, 0, 0])
  })
})

describe('light animation is photosensitivity-safe', () => {
  const sample = (profile, seconds, fps = 60) => {
    const out = []
    for (let i = 0; i <= seconds * fps; i++) out.push(lightMultiplier(profile, i / fps, false))
    return out
  }

  it('stage 0 never changes the light', () => {
    for (const m of sample(STAGE_PROFILES[0], 30)) expect(m).toBe(1)
  })

  for (const stage of [1, 2, 3]) {
    it(`stage ${stage}: bounded, smooth (no abrupt steps) and slow`, () => {
      const m = sample(STAGE_PROFILES[stage], 120)
      const floor = 1 - STAGE_PROFILES[stage].breathe - STAGE_PROFILES[stage].dipDepth
      for (const v of m) {
        expect(v).toBeLessThanOrEqual(1 + 1e-9)
        expect(v).toBeGreaterThanOrEqual(floor - 1e-9)
      }
      let maxStep = 0
      for (let i = 1; i < m.length; i++) maxStep = Math.max(maxStep, Math.abs(m[i] - m[i - 1]))
      expect(maxStep).toBeLessThan(0.025) // per frame at 60 fps

      // Direction reversals (the closest thing to "flashes") per second, worst 1 s window.
      const dirs = []
      for (let i = 2; i < m.length; i++) {
        const d1 = m[i - 1] - m[i - 2]
        const d2 = m[i] - m[i - 1]
        dirs.push(d1 * d2 < 0 ? 1 : 0)
      }
      let worst = 0
      let win = 0
      for (let i = 0; i < dirs.length; i++) {
        win += dirs[i] - (i >= 60 ? dirs[i - 60] : 0)
        worst = Math.max(worst, win)
      }
      expect(worst).toBeLessThanOrEqual(3)
    })
  }

  it('stage 3 dips at most once per period', () => {
    const m = sample(STAGE_PROFILES[3], 66)
    let dips = 0
    let inDip = false
    for (const v of m) {
      const deep = v < 0.82
      if (deep && !inDip) dips++
      inDip = deep
    }
    expect(dips).toBeLessThanOrEqual(Math.ceil(66 / STAGE_PROFILES[3].dipPeriod))
  })

  it('reduced motion removes all animation', () => {
    for (const p of STAGE_PROFILES) for (const t of [0, 1.3, 7, 11.2, 50]) expect(lightMultiplier(p, t, true)).toBe(1)
  })
})

describe('text corruption keeps dialogue readable', () => {
  const sentence = 'Everything is functioning within acceptable parameters, as far as anyone can tell.'
  const stripMarks = (s) => s.replace(/\p{M}/gu, '')

  it('leaves stages 0 and 1 untouched, and tolerates empty input', () => {
    expect(corruptText(sentence, 0, 'x')).toBe(sentence)
    expect(corruptText(sentence, 1, 'x')).toBe(sentence)
    expect(corruptText('', 3, 'x')).toBe('')
    expect(corruptText(undefined, 3, 'x')).toBe(undefined)
  })
  it('is deterministic (no jitter between renders) but varies by seed', () => {
    expect(corruptText(sentence, 3, 'a')).toBe(corruptText(sentence, 3, 'a'))
    expect(corruptText(sentence, 3, 'a')).not.toBe(corruptText(sentence, 3, 'b'))
  })
  for (const stage of [2, 3]) {
    it(`stage ${stage}: the base text is fully recoverable and marks sit only on letters`, () => {
      const out = corruptText(sentence, stage, 'seed')
      expect(stripMarks(out)).toBe(sentence)
      expect(out).not.toBe(sentence)
      expect(/(^|[^\p{L}])\p{M}/u.test(out)).toBe(false)
    })
  }
  it('is subtle: stage 3 touches a minority of letters, and more than stage 2', () => {
    const long = sentence.repeat(20)
    const letters = (long.match(/\p{L}/gu) ?? []).length
    const marks = (s) => (s.match(/\p{M}/gu) ?? []).length
    const m2 = marks(corruptText(long, 2, 's'))
    const m3 = marks(corruptText(long, 3, 's'))
    expect(m3).toBeGreaterThan(m2)
    expect(m3 / letters).toBeLessThan(0.25)
    expect(m2 / letters).toBeGreaterThan(0.02)
  })
})

describe('effect components (server render smoke test)', () => {
  it('render nothing visible at stage 0', () => {
    const overlay = renderToString(h(GlitchOverlay))
    expect(overlay).not.toContain('scanlines')
    expect(overlay).not.toContain('glitch-burst')
    expect(overlay).toContain('pointer-events-none') // never blocks the UI
    expect(renderToString(h(CorruptionBanner))).toBe('')
    expect(renderToString(h(ScreenEffects))).toBe('') // no postprocessing cost at stage 0
  })
  it('the effects boundary renders its children when healthy', () => {
    expect(renderToString(h(EffectsBoundary, null, h('p', null, 'ok')))).toContain('ok')
  })
  it('the effects boundary swallows a thrown effect instead of crashing', () => {
    const state = { failed: false }
    expect(EffectsBoundary.getDerivedStateFromError()).toEqual({ failed: true })
    const inst = new EffectsBoundary({ children: 'x' })
    inst.state = state
    expect(inst.render()).toBe('x')
    inst.state = EffectsBoundary.getDerivedStateFromError()
    expect(inst.render()).toBe(null)
  })
})
