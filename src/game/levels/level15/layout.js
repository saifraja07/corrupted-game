// Level 15, "Lean In": the exit door is locked and nothing in the room opens it. Standing against the west wall
// (the sign says the way out is west, and that there is no west) for a few seconds makes the wall give way.
export const LEVEL15 = {
  id: 'level15',
  objective: 'OPEN THE DOOR.',
  room: { width: 8, depth: 12, height: 3.2 },
  spawn: [0, 5],
  door: { z: -5.9, width: 1.2, height: 2.2 },
  leanX: -3.5, // x at or below this counts as against the west wall (walls are at -4, the player's radius is 0.3)
  leanZ: 0, // the stretch of wall that gives way: |z - leanZ| <= leanHalfZ
  leanHalfZ: 4,
  beginMs: 1000, // "What are you doing?"
  leanRequiredMs: 5000,
  signText: 'THE WAY OUT IS WEST. THERE IS NO WEST.',
  eastSignText: 'THIS WALL IS SOLID.',
  hint1Ms: 60000,
  hint2Ms: 120000,
  welcomeDelayMs: 800,
  completeDelayMs: 2200,
}
