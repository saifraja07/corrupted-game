// Corruption data. Rules (what raises the stage), profiles (what each stage looks like) and banners
// are plain data so they can be tuned without touching the engine or the effect components.
export const MAX_STAGE = 3
// Past stage 3 the game keeps getting worse, but never beyond the safety caps below: "intensity" (0..6)
// scales stage 3's effects and event frequency. It only matters at stage 3. Tiers 1-3 are the original curve
// (levels 8-11); tiers 4-6 are the later, harsher one (levels 12-18 and the finale).
export const MAX_INTENSITY = 6
export const BASE_INTENSITY_TIERS = 3 // where the original curve ends and the harsher one begins

// Stage a level starts at. Replaying a level always returns to this, so runs are deterministic.
export const LEVEL_BASE_STAGE = Object.freeze({ level01: 0, level02: 0, level03: 1, level04: 2, level05: 2, level06: 2, level07: 3, level08: 3, level09: 3, level10: 3, level11: 3, level12: 3, level13: 3, level14: 3, level15: 3, level16: 3, level17: 3, level18: 3 })

// A rule raises the stage to `raiseTo` when `event` fires (optionally the Nth time, optionally only in
// one level). Stages only rise within a level run; they never fall until the level is left.
export const CORRUPTION_TRIGGERS = Object.freeze([
  { event: 'button_b', levelId: 'level02', raiseTo: 1 }, // the hidden ceiling button
  { event: 'controls_reversed', levelId: 'level03', raiseTo: 2 },
  { event: 'sign_changed', levelId: 'level04', raiseTo: 3 },
  { event: 'hint_lamps', levelId: 'level05', raiseTo: 3 }, // three mistakes: the game notices you struggling
  { event: 'hint_dark', levelId: 'level06', raiseTo: 3 },
])

// Visual parameters per stage (0..3). Colors are desaturated; every value is static or slow-moving.
export const STAGE_PROFILES = Object.freeze([
  { wall: '#f4f4f5', floor: '#d4d4d8', trim: '#a1a1aa', panel: '#ffffff', background: '#f4f4f5', ambient: 0.9, directional: 0.8, fog: null, vignette: 0, chroma: 0, noise: 0, scanlines: 0, breathe: 0, dipPeriod: 0, dipDepth: 0 },
  { wall: '#eceef1', floor: '#cfd2d8', trim: '#9a9ca3', panel: '#f4f4f5', background: '#e9eaee', ambient: 0.85, directional: 0.75, fog: { near: 10, far: 30 }, vignette: 0.35, chroma: 0.0004, noise: 0, scanlines: 0, breathe: 0.03, dipPeriod: 0, dipDepth: 0 },
  { wall: '#dfe1e6', floor: '#c2c5cc', trim: '#8a8d95', panel: '#dcdce0', background: '#cfd1d8', ambient: 0.78, directional: 0.68, fog: { near: 7, far: 24 }, vignette: 0.5, chroma: 0.0009, noise: 0.06, scanlines: 0.05, breathe: 0.06, dipPeriod: 0, dipDepth: 0 },
  { wall: '#c9ccd4', floor: '#aeb2bb', trim: '#70747e', panel: '#b4b6be', background: '#a9acb6', ambient: 0.7, directional: 0.6, fog: { near: 5, far: 18 }, vignette: 0.65, chroma: 0.0016, noise: 0.1, scanlines: 0.09, breathe: 0.08, dipPeriod: 11, dipDepth: 0.3 },
])

// Short HUD notices shown when the stage rises during play (never at level start).
export const STAGE_BANNERS = Object.freeze({
  2: 'EVERYTHING IS FUNCTIONING WITHIN ACCEPTABLE PARAMETERS.',
  3: 'HINT: STOP LOOKING FOR A DOOR.',
})

// How far past stage 3 each level starts (0 = plain stage 3). Never decreases along the game (array order in
// config/levels.js, which is why the finale, level12, carries the highest value).
export const LEVEL_INTENSITY = Object.freeze({
  level08: 1, level09: 1, level10: 2, level11: 3,
  level13: 3, level14: 4, level15: 4, level16: 5, level17: 5, level18: 6,
  level12: 6,
})

// Corruption that grows WITHIN a level: when a gameplay event (the same names the dialogue uses) fires, the
// intensity rises to `raiseTo` (never falls inside a level run, never above MAX_INTENSITY). Optionally the Nth time.
// Like stage rules these are ignored when the stage is pinned for previewing.
export const INTENSITY_TRIGGERS = Object.freeze([
  { event: 'green_reset', levelId: 'level13', raiseTo: 4 }, // you took the "safe" button
  { event: 'times_up', levelId: 'level14', raiseTo: 5 },
  { event: 'times_up', levelId: 'level14', raiseTo: 6, count: 2 },
  { event: 'hint_walls', levelId: 'level15', raiseTo: 5 }, // the game notices you are stuck
  { event: 'stare_1', levelId: 'level16', raiseTo: 6 }, // staring back makes it worse
  { event: 'knock_fast', levelId: 'level17', raiseTo: 6 },
])

const lerp = (a, b, k) => a + (b - a) * k

// Effects for a stage, scaled by intensity at stage 3. Tiers 1-3 move from the stage-3 profile to CAP_3 (the original
// ceiling); tiers 4-6 continue from CAP_3 to CAP_6 (the new ceiling). Hard caps (all checked by tests):
//   tiers 0-3: vignette <= 0.78, chroma <= 0.0026, noise <= 0.14, scanlines <= 0.12, ambient >= 0.62
//   tiers 4-6: vignette <= 0.88, chroma <= 0.0036, noise <= 0.19, scanlines <= 0.15, ambient >= 0.54
//   always:    dip depth <= 0.36 and at least 8 s apart, fog near >= 2.8: slow, smooth and never near black.
// Nothing here ever flashes: the light animation is limited to slow breathing and one smooth dip per period.
const CAP_3 = Object.freeze({ ambient: 0.62, directional: 0.52, fogNear: 3.5, fogFar: 13, vignette: 0.78, chroma: 0.0026, noise: 0.14, scanlines: 0.12, breathe: 0.1, dipPeriod: 9, dipDepth: 0.36 })
const CAP_6 = Object.freeze({ ambient: 0.54, directional: 0.45, fogNear: 2.8, fogFar: 10, vignette: 0.88, chroma: 0.0036, noise: 0.19, scanlines: 0.15, breathe: 0.13, dipPeriod: 8, dipDepth: 0.36 })

export function getStageProfile(stage, intensity = 0) {
  const base = STAGE_PROFILES[Math.max(0, Math.min(MAX_STAGE, stage))]
  if (stage < MAX_STAGE || !(intensity > 0)) return base
  const level = Math.min(MAX_INTENSITY, intensity)
  const from = level <= BASE_INTENSITY_TIERS ? { ambient: base.ambient, directional: base.directional, fogNear: base.fog.near, fogFar: base.fog.far, vignette: base.vignette, chroma: base.chroma, noise: base.noise, scanlines: base.scanlines, breathe: base.breathe, dipPeriod: base.dipPeriod, dipDepth: base.dipDepth } : CAP_3
  const to = level <= BASE_INTENSITY_TIERS ? CAP_3 : CAP_6
  const k = level <= BASE_INTENSITY_TIERS ? level / BASE_INTENSITY_TIERS : (level - BASE_INTENSITY_TIERS) / (MAX_INTENSITY - BASE_INTENSITY_TIERS)
  return {
    ...base,
    ambient: lerp(from.ambient, to.ambient, k),
    directional: lerp(from.directional, to.directional, k),
    fog: { near: lerp(from.fogNear, to.fogNear, k), far: lerp(from.fogFar, to.fogFar, k) },
    vignette: lerp(from.vignette, to.vignette, k),
    chroma: lerp(from.chroma, to.chroma, k),
    noise: lerp(from.noise, to.noise, k),
    scanlines: lerp(from.scanlines, to.scanlines, k),
    breathe: lerp(from.breathe, to.breathe, k),
    dipPeriod: lerp(from.dipPeriod, to.dipPeriod, k),
    dipDepth: lerp(from.dipDepth, to.dipDepth, k),
  }
}
