// Level 2: a plain locked door, one obvious button and one the sign never mentions (on the ceiling).
export const LEVEL02 = {
  id: 'level02',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  // Faces +X from the left wall; visible from the start.
  buttonA: { position: [-3.9, 1.3, -2], rotationY: Math.PI / 2 },
  // Faces down from the ceiling; reachable by standing under it and looking up.
  buttonB: { position: [2, 3.175, 1], rotationX: Math.PI / 2 },
  signText: 'PRESS THE BUTTON.', // true, but incomplete
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
