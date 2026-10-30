// Level 7, "Blink": a barrier splits the room. Its gate is open only while you are NOT looking at it, and
// the sign tells you to keep your eyes on it. The exit is in the alcove beyond.
export const LEVEL07 = {
  id: 'level07',
  objective: 'REACH THE EXIT.',
  room: { width: 8, depth: 14, height: 3.2 },
  spawn: [0, 6],
  gate: { z: -1.5, halfWidth: 1.2, thickness: 0.4, height: 3.2 },
  door: { z: -6.9, width: 1.2, height: 2.2 }, // in the alcove, past the gate
  signText: 'KEEP YOUR EYES ON THE GATE.', // the lie
  // The gate is a tall object, so it counts as watched if ANY of these points on its centre line is in view.
  // (A single point was a bug: up close it sits far below your line of sight, so staring straight at the
  // gate from beside it did not count as watching.)
  viewHeights: [0.5, 1.6, 2.7],
  view: { halfAngleRad: (40 * Math.PI) / 180, maxDistance: 14 },
  openAfterMs: 350,
  closeAfterMs: 120,
  // The gate may not close on a player inside this area around it (the slab's footprint plus the player's body).
  footprint: { halfX: 1.55, halfZ: 0.55 },
  crossedZ: -2.05, // past the barrier
  // Hints for a player who lingers near the closed gate (metres, milliseconds near it while it is closed).
  hintNear: 4.5,
  hint1Ms: 25000,
  hint2Ms: 55000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
