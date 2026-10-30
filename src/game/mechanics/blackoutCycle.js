// A slow, repeating blackout: fade to dark, hold, fade back. Pure and time-driven (feed it elapsed ms).
// Always smooth (raised-cosine edges) and periodic, never a strobe: one blackout per `periodMs`.
//   update(dtMs) -> 'started' | 'ended' | null     getDarkness() -> 0 (lit) .. 1 (darkest)
//   triggerNow() starts one immediately unless one is already running (returns whether it did)
export function createBlackoutCycle({ firstMs = 10000, periodMs = 22000, fadeMs = 3000, holdMs = 4000 } = {}) {
  const duration = fadeMs * 2 + holdMs
  if (periodMs <= duration) throw new Error('blackout period must be longer than one blackout')
  const smooth = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)))
  let t = 0
  let startedAt = null
  let nextStart = firstMs
  return {
    update(dtMs) {
      t += dtMs
      let event = null
      if (startedAt !== null && t >= startedAt + duration) {
        startedAt = null
        event = 'ended'
      }
      if (startedAt === null && t >= nextStart) {
        startedAt = nextStart
        nextStart = startedAt + periodMs
        event = 'started'
      }
      return event
    },
    triggerNow() {
      if (startedAt !== null) return false
      startedAt = t
      nextStart = t + periodMs
      return true
    },
    getDarkness() {
      if (startedAt === null) return 0
      const u = t - startedAt
      if (u < fadeMs) return smooth(u / fadeMs)
      if (u < fadeMs + holdMs) return 1
      return smooth(1 - (u - fadeMs - holdMs) / fadeMs)
    },
    isActive: () => startedAt !== null,
    reset() {
      t = 0
      startedAt = null
      nextStart = firstMs
    },
  }
}
