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
  level09: {
    tier: 9,
    deceptions: 5,
    introduces: 'a fake victory screen',
    solution: 'Use the obvious EXIT, sit through the fake "Level complete" screen and the loading error, then use the real door it unlocked.',
  },
  level10: {
    tier: 10,
    deceptions: 6,
    introduces: 'a reward for doing nothing',
    solution: 'Ignore the HURRY sign and the fake countdown: stand perfectly still for eight seconds, then use the exit.',
  },
  level11: {
    tier: 11,
    deceptions: 6,
    introduces: 'a maze of lying signs',
    solution: 'Ignore every sign: explore to the far north-east corner (the compass in the objective helps) and use the door marked NO EXIT. Decoy EXIT doors only send you back.',
  },
  // Levels 13-18 (numbers 12-17) sit between "Which Way Out" and the finale. Ids are identifiers, not positions.
  level13: {
    tier: 12,
    deceptions: 7,
    introduces: 'an order that must be disobeyed',
    solution: 'Press the red button three times, however firmly the sign forbids it, and never touch the green one (it clears your presses). Then use the exit.',
  },
  level14: {
    tier: 13,
    deceptions: 7,
    introduces: 'a deadline that wipes your progress',
    solution: 'Press all three buttons one after another without stopping (the first press starts a hidden timer; each missed window is longer than the last), then use the exit.',
  },
  level15: {
    tier: 14,
    deceptions: 7,
    introduces: 'a wall that gives way if you lean on it',
    solution: 'Stand against the west wall for five seconds so it gives way, then use the exit.',
  },
  level16: {
    tier: 15,
    deceptions: 8,
    introduces: 'a stare you have to win',
    solution: 'Look straight at the eye on the east wall and do not look away for six seconds, then use the exit.',
  },
  level17: {
    tier: 16,
    deceptions: 8,
    introduces: 'a door that rewards stubbornness, not speed',
    solution: 'Knock on the door seven times, each a moment after the last (faster knocks are ignored, and the emergency button wipes your count).',
  },
  level18: {
    tier: 17,
    deceptions: 8,
    introduces: 'a sign that finally tells the truth',
    solution: 'Believe the sign: press the left button, wait five seconds, then use the door (the right button and an impatient door both restart the wait).',
  },
  level12: {
    tier: 18,
    deceptions: 9,
    introduces: 'an exit that is the game itself',
    solution: 'There is no door: press Escape and choose the EXIT button in the pause menu.',
  },
})

export const getTone = (levelId) => TONES[LEVEL_BASE_STAGE[levelId] ?? 0]
