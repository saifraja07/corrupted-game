// Level 18 (id level12), "Exit": the true finale. The room is full of doors that are only painted on. There is no way out
// in the world: the exit is the game's own EXIT button in the pause menu. "Find the exit", taken literally.
export const LEVEL12 = {
  id: 'level12',
  objective: 'FIND THE EXIT.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  doorwayXs: [-2.4, 0, 2.4],
  doorway: { z: -5.9, width: 1.2, height: 2.2, color: '#d4d4d8' }, // wall-coloured: a door drawn on a wall
  signText: 'FIND THE EXIT.',
  hint1Ms: 45000,
  hint2Ms: 90000,
  hint3Ms: 150000, // spells it out
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
