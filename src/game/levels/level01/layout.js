// Level 1 constants. The door's lateral range keeps it fully inside the room (inner half-width 4).
export const LEVEL01 = {
  id: 'level01',
  objective: 'REACH THE EXIT.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2, minX: -3.3, maxX: 3.3, startX: 0, speed: 5.5, triggerDist: 3 },
  // Behind the player at spawn (they face -Z); mounted on the entrance wall facing into the room.
  button: { position: [1.5, 1.3, 5.975], rotationY: Math.PI },
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
