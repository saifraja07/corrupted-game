// Corruption data. Rules (what raises the stage), profiles (what each stage looks like) and banners
// are plain data so they can be tuned without touching the engine or the effect components.
export const MAX_STAGE = 3

// Stage a level starts at. Replaying a level always returns to this, so runs are deterministic.
export const LEVEL_BASE_STAGE = Object.freeze({ level01: 0, level02: 0, level03: 1, level04: 2, level05: 2, level06: 2, level07: 3, level08: 3 })

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
