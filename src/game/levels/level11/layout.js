import { CELL, COLS, ROWS, START, cellCenter } from './maze.js'

// Level 11, "Which Way Out": a maze whose every sign lies and whose dead ends hold decoy EXIT doors.
const start = cellCenter(START[0], START[1])

export const LEVEL11 = {
  id: 'level11',
  objective: 'FIND THE EXIT.',
  room: { width: COLS * CELL, depth: ROWS * CELL, height: 3.2 },
  spawn: [start.x, start.z],
  door: { width: 1.2, height: 2.2 },
  hint1Ms: 120000, // "far corner"
  hint2Ms: 300000, // the glowing trail appears: the last resort
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
