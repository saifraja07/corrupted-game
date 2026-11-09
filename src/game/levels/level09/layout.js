// Level 9, "Almost": the obvious EXIT door is a decoy that shows a FAKE "Level complete" screen. Falling for it
// is the solution, because it is what unlocks the real (LOCKED) door beside it.
export const LEVEL09 = {
  id: 'level09',
  objective: 'REACH THE EXIT.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  decoy: { x: -2.4, z: -5.9, width: 1.2, height: 2.2, signText: 'EXIT' },
  real: { x: 2.4, z: -5.9, width: 1.2, height: 2.2, lockedText: 'LOCKED.', unlockedText: 'UNLOCKED. FINALLY.' },
  hintObviousMs: 60000, // nobody has tried the obvious exit by now: say so
  fakeBackMs: 7000, // the "did you really think..." line, after the fake screen has run its course
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
