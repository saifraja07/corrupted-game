// Level 18, "The Honest Room": after seventeen rooms of lies, the sign tells the truth. Press the LEFT button, wait
// five seconds, use the door. The right button is not on the sign; neither is touching the door early. Both undo it.
export const LEVEL18 = {
  id: 'level18',
  objective: 'FOLLOW THE SIGN.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  leftButton: { position: [-3.9, 1.3, -2], rotationY: Math.PI / 2 }, // faces +X from the left wall
  rightButton: { position: [3.9, 1.3, -2], rotationY: -Math.PI / 2 }, // faces -X from the right wall
  waitMs: 5000,
  signLines: ['1. PRESS THE LEFT BUTTON.', '2. WAIT FIVE SECONDS.', '3. USE THE DOOR.'],
  hintMs: 90000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
