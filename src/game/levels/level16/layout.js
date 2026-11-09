// Level 16, "Staring Contest": an eye on the east wall. The sign says not to look at it; holding its gaze for six
// seconds is what unlocks the door. Looking away (for more than a moment) starts the contest over.
export const LEVEL16 = {
  id: 'level16',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  eye: { x: 3.7, y: 1.6, z: 0 }, // the target of the stare, on the east wall
  view: { halfAngleRad: (12 * Math.PI) / 180, maxDistance: 12 }, // how directly you must look at it
  stareRequiredMs: 6000,
  stare1Ms: 2000,
  stare2Ms: 4000,
  brokenAfterMs: 1500, // a stare this long that is then abandoned earns "Coward."
  graceMs: 250, // a glance away this short does not break the stare (mouse jitter, frame spikes)
  signText: 'DO NOT LOOK AT IT.',
  hint1Ms: 45000,
  hint2Ms: 90000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
