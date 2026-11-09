// Level 17, "Knock Knock": the door says it is locked and tells you to give up. Seven knocks, each at least a
// moment after the last, open it. Knocking faster is ignored, and the "emergency open" button just resets the count.
export const LEVEL17 = {
  id: 'level17',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  decoyButton: { position: [-3.9, 1.3, -1], rotationY: Math.PI / 2 },
  knocksRequired: 7,
  knockGapMs: 1500, // a knock sooner than this after the last accepted one is ignored ("Slow down.")
  signText: 'IT IS LOCKED. GIVE UP.',
  decoySignText: 'EMERGENCY OPEN',
  hint1Ms: 60000,
  hint2Ms: 100000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
