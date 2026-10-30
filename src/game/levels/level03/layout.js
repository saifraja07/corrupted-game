// Level 3: crossing the middle of the room reverses the controls; a calibration button by the exit fixes them.
export const LEVEL03 = {
  id: 'level03',
  objective: 'REACH THE EXIT.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  zoneZ: 1.5, // entering z < zoneZ (anywhere across the room) triggers the reversal
  button: { position: [-2, 1.3, -5.975], rotationY: 0 },
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
