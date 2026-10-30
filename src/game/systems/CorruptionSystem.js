import { CORRUPTION_TRIGGERS, LEVEL_BASE_STAGE, MAX_STAGE } from '../config/corruption.js'

const noop = () => {}
const clampStage = (n) => Math.max(0, Math.min(MAX_STAGE, Math.trunc(n) || 0))

// Orchestrates WHEN corruption rises. It knows nothing about how a stage looks or sounds: effects read
// the stage and decide that themselves. Deterministic: same level + same events => same stage.
// onChange(stage, previousStage, reason) with reason 'level_start' | 'event' | 'reset'.
// devStage (0..3) pins the stage for previewing; events are then ignored.
export function createCorruptionSystem({
  rules = CORRUPTION_TRIGGERS,
  baseStages = LEVEL_BASE_STAGE,
  devStage = null,
  onChange = noop,
} = {}) {
  const pinned = devStage === null || devStage === undefined ? null : clampStage(devStage)
  let stage = 0
  let levelId = null
  const counts = new Map()

  function setStage(next, reason) {
    if (next === stage) return false
    const prev = stage
    stage = next
    onChange(stage, prev, reason)
    return true
  }

  return {
    getStage: () => stage,
    startLevel(id) {
      levelId = id
      counts.clear()
      setStage(pinned ?? clampStage(baseStages[id] ?? 0), 'level_start')
    },
    // Report a gameplay event. Returns the NEW stage if it rose, otherwise null.
    report(name) {
      if (pinned !== null || levelId === null) return null
      const n = (counts.get(name) ?? 0) + 1
      counts.set(name, n)
      let target = stage
      for (const r of rules) {
        if (r.event !== name) continue
        if (r.levelId && r.levelId !== levelId) continue
        if (n < (r.count ?? 1)) continue
        target = Math.max(target, r.raiseTo)
      }
      target = clampStage(target)
      return target > stage && setStage(target, 'event') ? stage : null
    },
    // Leaving a level: everything returns to normal.
    reset() {
      levelId = null
      counts.clear()
      setStage(0, 'reset')
    },
  }
}
