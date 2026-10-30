import { AMBIENT_EVENTS, AMBIENT_FIRST_DELAY_MS, AMBIENT_GAPS_MS, AMBIENT_RETRY_MS } from '../config/ambientEvents.js'
import { createRng } from './random.js'

// Decides WHEN an unexpected event happens; it never applies one (see ambientEffects.js). Pure and
// deterministic: the same seed, stage and time always produce the same events. Rules:
//  - stage 0: nothing, ever
//  - the first event is never before AMBIENT_FIRST_DELAY_MS
//  - consecutive events are at least the stage's minimum gap apart
//  - never while something important (a dialogue line) is on screen: it waits and retries
export function createAmbientEvents({ seed = 'ambient', events = AMBIENT_EVENTS, gaps = AMBIENT_GAPS_MS, firstDelayMs = AMBIENT_FIRST_DELAY_MS, retryMs = AMBIENT_RETRY_MS } = {}) {
  const rng = createRng(seed)
  let wait = null // ms until the next event; null while stage 0
  let lastStage = 0

  const gapFor = (stage) => {
    const [min, max] = gaps[Math.min(3, stage)]
    return min + rng() * (max - min)
  }

  function pick(stage) {
    const pool = events.filter((e) => e.minStage <= stage)
    const total = pool.reduce((sum, e) => sum + e.weight, 0)
    let roll = rng() * total
    for (const e of pool) {
      roll -= e.weight
      if (roll < 0) return e
    }
    return pool[pool.length - 1]
  }

  return {
    // dtMs: time since last call; stage: 0..3; busy: a dialogue line is showing. Returns an event or null.
    update(dtMs, stage, busy = false) {
      if (!(stage > 0)) {
        wait = null
        lastStage = 0
        return null
      }
      if (wait === null) wait = Math.max(firstDelayMs, gapFor(stage))
      else if (stage > lastStage) wait = Math.min(wait, gapFor(stage)) // it just got worse: don't make them wait out the old pace
      lastStage = stage
      wait -= dtMs
      if (wait > 0) return null
      if (busy) {
        wait = retryMs
        return null
      }
      const event = pick(stage)
      wait = gapFor(stage)
      return event
    },
  }
}
