// Level 6, "Lights Out": the sign names the wrong button. During each blackout a glowing mark appears
// above the RIGHT one. The blackout repeats forever, so the answer is always on its way.
export const BUTTONS = Object.freeze([
  { name: 'RED', hex: '#ef4444', x: -2 },
  { name: 'GREEN', hex: '#22c55e', x: 0 },
  { name: 'BLUE', hex: '#3b82f6', x: 2 },
])

export const LEVEL06 = {
  id: 'level06',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  buttonY: 1.3,
  buttonZ: -5.975,
  // The exit is a door in the left wall (rotated to face into the room).
  door: { x: -3.94, z: -2, width: 1.2, height: 2.2 },
  signText: 'PRESS THE GREEN BUTTON.', // the lie
  glow: { x: 2, y: 2.4, z: -5.9 }, // sits above the real (blue) button
  cycle: { firstMs: 10000, periodMs: 22000, fadeMs: 3000, holdMs: 4000 },
  glowVisibleAbove: 0.5, // the mark shows once it is at least half dark
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
