// Level 13, "Do Not Press": the sign forbids the red button, and the red button is the way out (three presses).
// The green "safe" button is the temptation: pressing it wipes your red presses.
export const LEVEL13 = {
  id: 'level13',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  redButton: { position: [-3.9, 1.3, -1], rotationY: Math.PI / 2 }, // faces +X from the left wall
  greenButton: { position: [3.9, 1.3, -1], rotationY: -Math.PI / 2 }, // faces -X from the right wall
  signText: 'DO NOT PRESS THE RED BUTTON.',
  greenSignText: 'THE GREEN BUTTON IS SAFE.',
  redPressesRequired: 3,
  hint1Ms: 45000,
  hint2Ms: 90000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
