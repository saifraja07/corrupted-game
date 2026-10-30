// Small deterministic random numbers (same seed => same sequence), so "random" game events are
// reproducible and testable. Never use Math.random for anything the player can notice.
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32: returns a function giving floats in [0, 1)
export function createRng(seed) {
  let s = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed))
  return () => {
    let t = (s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
