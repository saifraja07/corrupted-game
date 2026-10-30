// Level 4: the sign says the exit is on the LEFT. The left door is a fake that sends you back to the
// start; the right door is the real exit. After two fake exits the sign quietly changes while unobserved.
export const LEVEL04 = {
  id: 'level04',
  objective: 'FIND THE EXIT.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  doors: { z: -5.9, width: 1.2, height: 2.2, leftX: -2.5, rightX: 2.5 },
  sign: {
    position: { x: 3.89, y: 1.6, z: 0 }, // right wall, facing into the room
    rotationY: -Math.PI / 2,
    stages: ['THE EXIT IS ON THE LEFT.', 'THE EXIT IS ON THE RIGHT.'],
    view: { halfAngleRad: (40 * Math.PI) / 180, maxDistance: 14 },
  },
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
