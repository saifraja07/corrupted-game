// Unexpected events that keep happening as corruption rises. Stage 0 has none (the early game stays
// harmless); each higher stage adds new kinds and makes them more frequent. Pure data.
export const AMBIENT_FIRST_DELAY_MS = 20000 // never in the first 20 s of a level
export const AMBIENT_RETRY_MS = 1500 // if a dialogue line is on screen, try again shortly
// [min, max] ms between events by stage. Even the busiest stage keeps 16 s apart: nothing here can strobe.
export const AMBIENT_GAPS_MS = Object.freeze({ 1: [50000, 80000], 2: [28000, 45000], 3: [16000, 28000] })
// Past stage 3 (intensity 1..6) events come faster, but the 16 s floor never moves.
export const AMBIENT_INTENSITY_GAPS_MS = Object.freeze({ 1: [16000, 26000], 2: [16000, 24000], 3: [16000, 22000], 4: [16000, 21000], 5: [16000, 20000], 6: [16000, 19000] })

// kind: 'notice' (optionally `then`: a reveal shown a moment later) | 'fakeError' (the not-responding dialog)
// bait: true marks rage-bait: every bait MUST reveal itself (via `then` or by being a fakeError). minIntensity gates
// events to the later levels. (Older description follows.) kind: 'notice' (HUD banner) | 'objective' (the objective text is briefly replaced, then restored) | 'sound'.
// burst: one smooth 0.7 s glitch overlay (stage 2+ only). sound: an EVENT_SOUNDS name.
export const AMBIENT_EVENTS = Object.freeze([
  { id: 'notice-integrity-99', minStage: 1, weight: 3, kind: 'notice', text: 'ROOM INTEGRITY: 99%' },
  { id: 'objective-question', minStage: 1, weight: 2, kind: 'objective', text: 'FIND THE EXIT?' },
  { id: 'notice-fine', minStage: 2, weight: 3, kind: 'notice', text: 'EVERYTHING IS FINE.', burst: true, sound: 'ambient_glitch' },
  { id: 'notice-integrity-94', minStage: 2, weight: 2, kind: 'notice', text: 'ROOM INTEGRITY: 94%', burst: true },
  { id: 'objective-entrance', minStage: 2, weight: 3, kind: 'objective', text: 'FIND THE ENTRANCE.', sound: 'ambient_glitch' },
  { id: 'sound-glitch', minStage: 2, weight: 2, kind: 'sound', sound: 'ambient_glitch' },
  { id: 'notice-behavior', minStage: 3, weight: 3, kind: 'notice', text: 'PLAYER BEHAVIOR: UNEXPECTED', burst: true, sound: 'ambient_glitch' },
  { id: 'notice-behind', minStage: 3, weight: 2, kind: 'notice', text: 'DO NOT LOOK BEHIND YOU.', burst: true, sound: 'ambient_presence' },
  { id: 'notice-integrity-41', minStage: 3, weight: 2, kind: 'notice', text: 'ROOM INTEGRITY: 41%', burst: true },
  { id: 'objective-stop', minStage: 3, weight: 3, kind: 'objective', text: 'STOP LOOKING.', sound: 'ambient_glitch' },
  { id: 'sound-presence', minStage: 3, weight: 2, kind: 'sound', sound: 'ambient_presence' },
  // --- rage-bait, from the later levels. Every one reveals itself within 3 s and changes nothing real. ---
  { id: 'bait-erased', minStage: 3, minIntensity: 1, weight: 2, kind: 'notice', bait: true, text: 'PROGRESS ERASED.', then: { afterMs: 2200, text: 'JUST KIDDING.' }, burst: true, sound: 'ambient_glitch' },
  { id: 'bait-loading', minStage: 3, minIntensity: 1, weight: 2, kind: 'notice', bait: true, text: 'LOADING EXIT... 99%', then: { afterMs: 2600, text: 'LOADING FAILED.' } },
  { id: 'bait-error', minStage: 3, minIntensity: 2, weight: 2, kind: 'fakeError', bait: true, sound: 'ambient_glitch' },
  { id: 'bait-remap', minStage: 3, minIntensity: 2, weight: 2, kind: 'notice', bait: true, text: 'CONTROLS REMAPPED.', then: { afterMs: 2000, text: 'JUST KIDDING.' } },
  { id: 'objective-unknown', minStage: 3, minIntensity: 2, weight: 2, kind: 'objective', text: 'OBJECTIVE: ???' },
  { id: 'notice-see-you', minStage: 3, minIntensity: 3, weight: 2, kind: 'notice', text: 'WE SEE YOU.', burst: true, sound: 'ambient_presence' },
  { id: 'bait-connection', minStage: 3, minIntensity: 3, weight: 2, kind: 'notice', bait: true, text: 'CONNECTION LOST.', then: { afterMs: 2400, text: 'PLEASE HOLD.' } },
  { id: 'objective-give-up', minStage: 3, minIntensity: 3, weight: 2, kind: 'objective', text: 'GIVE UP.', sound: 'ambient_glitch' },
  // --- the harsher tier (intensity 4-6, levels 12-17 and the finale). Same honesty rules: every bait reveals itself
  // within 3 s, stays under 40 characters, and changes nothing real (never saves, settings or progress). ---
  { id: 'bait-deleting', minStage: 3, minIntensity: 4, weight: 2, kind: 'notice', bait: true, text: 'DELETING SAVE FILE...', then: { afterMs: 2500, text: 'JUST KIDDING.' }, burst: true, sound: 'ambient_glitch' },
  { id: 'bait-crash', minStage: 3, minIntensity: 4, weight: 2, kind: 'notice', bait: true, text: 'THE GAME HAS CRASHED.', then: { afterMs: 2200, text: 'IT HAS NOT.' } },
  { id: 'notice-integrity-7', minStage: 3, minIntensity: 4, weight: 2, kind: 'notice', text: 'ROOM INTEGRITY: 7%', burst: true },
  { id: 'bait-skipped', minStage: 3, minIntensity: 5, weight: 2, kind: 'notice', bait: true, text: 'LEVEL SKIPPED.', then: { afterMs: 2400, text: 'NO, IT WAS NOT.' }, sound: 'ambient_glitch' },
  { id: 'notice-standing', minStage: 3, minIntensity: 5, weight: 2, kind: 'notice', text: 'IT IS STANDING BEHIND YOU.', burst: true, sound: 'ambient_presence' },
  { id: 'objective-leave', minStage: 3, minIntensity: 5, weight: 2, kind: 'objective', text: 'LEAVE.', sound: 'ambient_glitch' },
  { id: 'bait-quit', minStage: 3, minIntensity: 6, weight: 2, kind: 'notice', bait: true, text: 'THANK YOU FOR PLAYING.', then: { afterMs: 2600, text: 'JUST KIDDING. KEEP GOING.' }, burst: true },
  { id: 'bait-unlocked', minStage: 3, minIntensity: 6, weight: 2, kind: 'notice', bait: true, text: 'EXIT UNLOCKED.', then: { afterMs: 2200, text: 'NOT FOR YOU.' }, sound: 'ambient_glitch' },
  { id: 'notice-remembers', minStage: 3, minIntensity: 6, weight: 2, kind: 'notice', text: 'IT REMEMBERS EVERYTHING YOU DID.', burst: true, sound: 'ambient_presence' },
  { id: 'objective-no-exit', minStage: 3, minIntensity: 6, weight: 2, kind: 'objective', text: 'THERE IS NO EXIT.', sound: 'ambient_glitch' },
])
