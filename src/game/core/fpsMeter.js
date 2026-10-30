// Rolling frame-time statistics. tick(dtSeconds) returns null until a window has elapsed, then
// { fps, avgMs, worstMs } for that window. Pure, so it is testable; PerfMonitor displays it.
export function createFpsMeter({ windowMs = 500 } = {}) {
  let elapsedMs = 0
  let frames = 0
  let worstMs = 0
  return {
    tick(dtSeconds) {
      const ms = dtSeconds * 1000
      elapsedMs += ms
      frames++
      worstMs = Math.max(worstMs, ms)
      if (elapsedMs < windowMs) return null
      const result = { fps: frames / (elapsedMs / 1000), avgMs: elapsedMs / frames, worstMs }
      elapsedMs = 0
      frames = 0
      worstMs = 0
      return result
    },
  }
}
