// Pure animation helpers for lighting corruption. Safe by construction: slow, smooth, low amplitude.
//  - "breathing": a gentle sine over a 6 s period (about 0.17 Hz)
//  - "dip": at most one smooth 0.8 s dimming per dipPeriod (stage 3: every 11 s)
// Nothing here strobes: far below 3 flashes per second and no abrupt steps.
const BREATHE_PERIOD_S = 6
const DIP_DURATION_S = 0.8

export function lightMultiplier(profile, t, reducedMotion = false) {
  if (reducedMotion) return 1 // reduced motion keeps the static dimming from the profile, no animation
  let m = 1 - profile.breathe * 0.5 * (1 - Math.cos((2 * Math.PI * t) / BREATHE_PERIOD_S))
  if (profile.dipPeriod > 0) {
    const phase = t % profile.dipPeriod
    if (phase < DIP_DURATION_S) {
      const k = Math.sin((Math.PI * phase) / DIP_DURATION_S)
      m *= 1 - profile.dipDepth * k * k
    }
  }
  return m
}
