// Rage-bait, kept honest. Every fake-out here is: SHORT (bounded below), HARMLESS (it only changes what is
// shown: never saves, settings or progress), self-revealing ("just kidding" follows within seconds), and
// never blocks play for long. Tests enforce these limits against the numbers below.
export const FAKE_ERROR = Object.freeze({ checkingMs: 2400, revealMs: 1200 }) // the not-responding dialog
export const FAKE_ERROR_TOTAL_MS = FAKE_ERROR.checkingMs + FAKE_ERROR.revealMs

export const FAKE_LOADING_MS = 2600 // fake "Loading level N..." bar that stalls at 99%
export const FAKE_LOADING_ERROR_MS = 2200 // then the error, then you are returned
export const FAKE_CRASH_MS = 2600 // fake crash page at the end of the false ending

export const MAX_FAKEOUT_MS = 5000 // no single fake-out may take longer than this to resolve on its own

// Fake progress: races to 90% then crawls, and NEVER reaches 100%.
export function fakeLoadingProgress(elapsedMs, totalMs = FAKE_LOADING_MS) {
  const t = Math.max(0, Math.min(1, elapsedMs / totalMs))
  const pct = t < 0.6 ? 90 * (t / 0.6) : 90 + 9 * ((t - 0.6) / 0.4)
  return Math.min(99, Math.floor(pct))
}
