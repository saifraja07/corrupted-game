import { CORRUPTION_TRIGGERS, INTENSITY_TRIGGERS, LEVEL_BASE_STAGE, LEVEL_INTENSITY, MAX_INTENSITY, MAX_STAGE } from '../config/corruption.js'

const noop = () => {}
const clampStage = (n) => Math.max(0, Math.min(MAX_STAGE, Math.trunc(n) || 0))
const clampIntensity = (n) => Math.max(0, Math.min(MAX_INTENSITY, Math.trunc(n) || 0))

// Orchestrates WHEN corruption rises. It knows nothing about how a stage looks or sounds: effects read
// the stage and decide that themselves. Deterministic: same level + same events => same stage.
// onChange(stage, previousStage, reason) with reason 'level_start' | 'event' | 'reset'.
// devStage (0..3) pins the stage for previewing; events are then ignored.
export function createCorruptionSystem({
  rules = CORRUPTION_TRIGGERS,
  intensityRules = INTENSITY_TRIGGERS,
  baseStages = LEVEL_BASE_STAGE,
  intensities = LEVEL_INTENSITY,
  devStage = null,
  devIntensity = null,
  onChange = noop,
  onIntensityChange = noop,
} = {}) {
  const pinned = devStage === null || devStage === undefined ? null : clampStage(devStage)
  const pinnedIntensity = devIntensity === null || devIntensity === undefined ? null : clampIntensity(devIntensity)
  let stage = 0
  let intensity = 0
  let levelId = null
  const counts = new Map()

  function setStage(next, reason) {
    if (next === stage) return false
    const prev = stage
    stage = next
    onChange(stage, prev, reason)
    return true
  }

  function setIntensity(next) {
    if (next === intensity) return
    intensity = next
    onIntensityChange(intensity)
  }

  return {
    getStage: () => stage,
    getIntensity: () => intensity,
    startLevel(id) {
      levelId = id
      counts.clear()
      setStage(pinned ?? clampStage(baseStages[id] ?? 0), 'level_start')
      setIntensity(pinnedIntensity ?? clampIntensity(intensities[id] ?? 0))
    },
    // Report a gameplay event. Returns the NEW stage if it rose, otherwise null. (Intensity can also rise here, see
    // INTENSITY_TRIGGERS; it is reported through onIntensityChange, not through the return value.)
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
      if (pinnedIntensity === null) {
        let targetIntensity = intensity
        for (const r of intensityRules) {
          if (r.event !== name) continue
          if (r.levelId && r.levelId !== levelId) continue
          if (n < (r.count ?? 1)) continue
          targetIntensity = Math.max(targetIntensity, r.raiseTo)
        }
        setIntensity(clampIntensity(targetIntensity)) // only ever rises within a level run
      }
      return target > stage && setStage(target, 'event') ? stage : null
    },
    // Leaving a level: everything returns to normal.
    reset() {
      levelId = null
      counts.clear()
      setStage(0, 'reset')
      setIntensity(0)
    },
  }
}
