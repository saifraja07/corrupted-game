// Unexpected events that keep happening as corruption rises. Stage 0 has none (the early game stays
// harmless); each higher stage adds new kinds and makes them more frequent. Pure data.
export const AMBIENT_FIRST_DELAY_MS = 20000 // never in the first 20 s of a level
export const AMBIENT_RETRY_MS = 1500 // if a dialogue line is on screen, try again shortly
// [min, max] ms between events by stage. Even the busiest stage keeps 16 s apart: nothing here can strobe.
export const AMBIENT_GAPS_MS = Object.freeze({ 1: [50000, 80000], 2: [28000, 45000], 3: [16000, 28000] })

// kind: 'notice' (HUD banner) | 'objective' (the objective text is briefly replaced, then restored) | 'sound'.
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
])
