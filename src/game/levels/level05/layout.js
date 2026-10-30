// Level 5, "Simple Instructions": four lamps flash a sequence; the sign tells you a DIFFERENT order.
export const COLORS = Object.freeze([
  { name: 'RED', hex: '#ef4444' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'YELLOW', hex: '#eab308' },
])

export const LEVEL05 = {
  id: 'level05',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  // The lamp board is on the right wall; each button sits under its lamp.
  boardZ: [-3, -1, 1, 3],
  lampX: 3.82,
  lampY: 2.4,
  buttonX: 3.9,
  buttonY: 1.3,
  replayButton: { position: [3.9, 1.3, 4.6], rotationY: -Math.PI / 2 },
  signText: 'PRESS: RED, GREEN, BLUE, YELLOW.', // the lie: this is not the order
  introLeadMs: 3000, // the lamps play once on their own, shortly after the level starts
  stepMs: 700,
  gapMs: 300,
  flashMs: 350, // a lamp lights briefly when its button is pressed
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
