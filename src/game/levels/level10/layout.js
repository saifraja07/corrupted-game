// Level 10, "Stillness": a fake countdown says to HURRY. The exit actually opens if you stand perfectly still
// for a few seconds. The countdown only ticks while you move, which is the clue.
export const LEVEL10 = {
  id: 'level10',
  objective: 'REACH THE EXIT.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  stillRequiredMs: 8000, // continuous stillness needed
  countdownStart: 30, // the fake display
  tooLateMs: 3000, // how long "TOO LATE." shows before the fake countdown starts over
  moveEps: 0.001, // metres; below this the player counts as not having moved
  lookEps: 0.0005, // radians; below this the view counts as not having moved
  decoyButton: { position: [-3.9, 1.3, -1], rotationY: Math.PI / 2 },
  hurrySign: 'HURRY.',
  hint1Ms: 60000,
  hint2Ms: 120000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
