// Level 14, "Time's Up": three buttons must ALL be pressed within a hidden time window that starts on the first
// press. The sign says to take your time (a lie). Missing the window switches the buttons off again, but each
// miss makes the next window longer, so nobody is ever locked out.
export const LEVEL14 = {
  id: 'level14',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  buttons: [
    { id: 'l14-button-0', position: [-3.9, 1.3, 3], rotationY: Math.PI / 2 }, // left wall, near the start
    { id: 'l14-button-1', position: [3.9, 1.3, -1], rotationY: -Math.PI / 2 }, // right wall, across the room
    { id: 'l14-button-2', position: [-3.9, 1.3, -4.5], rotationY: Math.PI / 2 }, // left wall, by the door
  ],
  signText: 'TAKE YOUR TIME.', // not true once the first button is pressed
  windowMs: 16000, // the first window
  mercyMs: 8000, // each missed window adds this much
  maxWindowMs: 40000,
  hintAfterMisses: 2,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
