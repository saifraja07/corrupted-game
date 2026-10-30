import { LEVEL_BASE_STAGE } from './corruption.js'

// The difficulty and tone curve, as data (design intent, enforced by tests). Order is the order in
// config/levels.js. Each level introduces ONE new kind of deception, so players cannot reuse an old trick.
//   tier: 1..N, strictly rising     deceptions: how many ways the level misleads you (never falls)
//   introduces: the new kind of trick   solution: the deliberate, always-available way through
// The tone comes from the corruption stage the level starts at: funny, strange, unsettling, disturbing.
export const TONES = Object.freeze(['funny', 'strange', 'unsettling', 'disturbing'])

export const PROGRESSION = Object.freeze({
  level01: {
    tier: 1,
    deceptions: 1,
    introduces: 'a door that runs away',
    solution: 'Press the hidden button behind you, then use the exit.',
  },
  level02: {
    tier: 2,
    deceptions: 1,
    introduces: 'an incomplete instruction',
    solution: 'Press the visible button and the one on the ceiling, then use the exit.',
  },
  level03: {
    tier: 3,
    deceptions: 1,
    introduces: 'controls that betray you',
    solution: 'Cross the room with reversed controls, press the calibration button, then use the exit.',
  },
  level04: {
    tier: 4,
    deceptions: 3,
    introduces: 'a lying sign and a fake exit',
    solution: 'Do not trust the sign: use the other door, the right-hand one.',
  },
  level05: {
    tier: 5,
    deceptions: 3,
    introduces: 'instructions you must disprove by observation',
    solution: 'Press the colours in the order the lamps flashed (replaying them is free), then use the exit.',
  },
  level06: {
    tier: 6,
    deceptions: 3,
    introduces: 'a truth that only shows in the dark',
    solution: 'Wait for a blackout, then press the button the glowing mark hangs over, then use the exit.',
  },
  level07: {
    tier: 7,
    deceptions: 3,
    introduces: 'an obstacle that yields only when unwatched',
    solution: 'Look away from the gate (or walk backwards) so it opens, cross without watching it, then use the exit.',
  },
  level08: {
    tier: 8,
    deceptions: 5,
    introduces: 'an exit that is not a door',
    solution: 'Try a door, then watch the figure that appears, walk up to it while keeping it in view, and follow it.',
  },
})

export const getTone = (levelId) => TONES[LEVEL_BASE_STAGE[levelId] ?? 0]
