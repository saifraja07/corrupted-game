import { AMBIENT_EVENTS, AMBIENT_FIRST_DELAY_MS, AMBIENT_GAPS_MS, AMBIENT_INTENSITY_GAPS_MS, AMBIENT_RETRY_MS } from '../config/ambientEvents.js'
import { MAX_INTENSITY } from '../config/corruption.js'
import { createRng } from './random.js'

// Decides WHEN an unexpected event happens; it never applies one (see ambientEffects.js). Pure and
// deterministic: the same seed, stage and time always produce the same events. Rules:
//  - stage 0: nothing, ever
//  - the first event is never before AMBIENT_FIRST_DELAY_MS
//  - consecutive events are at least the stage's minimum gap apart
//  - never while something important (a dialogue line) is on screen: it waits and retries
export function createAmbientEvents({ seed = 'ambient', events = AMBIENT_EVENTS, gaps = AMBIENT_GAPS_MS, intensityGaps = AMBIENT_INTENSITY_GAPS_MS, firstDelayMs = AMBIENT_FIRST_DELAY_MS, retryMs = AMBIENT_RETRY_MS } = {}) {
  const rng = createRng(seed)
  let wait = null // ms until the next event; null while stage 0
  let lastStage = 0

  const gapFor = (stage, intensity = 0) => {
    const [min, max] = stage >= 3 && intensity > 0 ? intensityGaps[Math.min(MAX_INTENSITY, intensity)] : gaps[Math.min(3, stage)]
    return min + rng() * (max - min)
  }

  function pick(stage, intensity) {
    const pool = events.filter((e) => e.minStage <= stage && (e.minIntensity ?? 0) <= intensity)
    const total = pool.reduce((sum, e) => sum + e.weight, 0)
    let roll = rng() * total
    for (const e of pool) {
      roll -= e.weight
      if (roll < 0) return e
    }
    return pool[pool.length - 1]
  }

  return {
    // dtMs: time since last call; stage: 0..3; busy: a dialogue line is showing; intensity: 0..MAX_INTENSITY (stage 3 only).
    // Returns an event or null.
    update(dtMs, stage, busy = false, intensity = 0) {
      if (!(stage > 0)) {
        wait = null
        lastStage = 0
        return null
      }
      if (wait === null) wait = Math.max(firstDelayMs, gapFor(stage, intensity))
      else if (stage > lastStage) wait = Math.min(wait, gapFor(stage, intensity)) // it just got worse: don't make them wait out the old pace
      lastStage = stage
      wait -= dtMs
      if (wait > 0) return null
      if (busy) {
        wait = retryMs
        return null
      }
      const event = pick(stage, intensity)
      wait = gapFor(stage, intensity)
      return event
    },
  }
}
