// Deterministic text distortion for DIALOGUE ONLY (never prompts, objectives or controls). It adds
// combining marks on top of letters, so the base text stays readable and its length in letters never
// changes. Same text + seed => same output, so nothing jitters between renders.
const MARKS = ['\u0305', '\u0323', '\u0308', '\u0307']
const RATE = [0, 0, 0.06, 0.14] // per-letter chance by stage

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function nextRandom(state) {
  // mulberry32
  let t = (state.s += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function corruptText(text, stage, seed = '') {
  const rate = RATE[Math.max(0, Math.min(3, stage))] ?? 0
  if (rate === 0 || !text) return text
  const rng = { s: hash(`${seed}|${text}`) }
  let out = ''
  for (const ch of text) {
    out += ch
    if (/\p{L}/u.test(ch) && nextRandom(rng) < rate) {
      out += MARKS[Math.floor(nextRandom(rng) * MARKS.length)]
    }
  }
  return out
}
