// Level 8, "The Last Room". The room TRANSFORMS every time a (fake) door is used: it changes size,
// the ceiling lowers, doors disappear and the sign changes. Everything is derived from one table so
// geometry, collision, spawn and the presence's limits can never disagree (tests check every variant).
export const DOOR = { width: 1.2, height: 2.2 }

export const VARIANTS = Object.freeze([
  { room: { width: 8, depth: 12, height: 3.2 }, doorFractions: [-0.3, 0, 0.3], sign: 'CHOOSE A DOOR.' },
  { room: { width: 8, depth: 14, height: 3.2 }, doorFractions: [-0.3, 0, 0.3], sign: 'CHOOSE A DOOR.' }, // same words, bigger room
  { room: { width: 10, depth: 14, height: 2.6 }, doorFractions: [-0.25, 0.25], sign: 'CHOOSE A DIFFERENT DOOR.' }, // wider, lower, one door gone
  { room: { width: 6, depth: 16, height: 3.2 }, doorFractions: [0], sign: 'THERE ARE NO DOORS.' }, // narrow and long; the sign now lies
])
export const MAX_VARIANT = VARIANTS.length - 1

export const LEVEL08 = {
  id: 'level08',
  objective: 'FIND THE EXIT.',
  welcomeDelayMs: 800,
  completeDelayMs: 2600,
  idleHintMs: 45000, // if no door has been tried by then, nudge
  // The presence only moves while NOT in view, drifting toward the player but stopping 3 m away.
  presence: {
    speed: 0.8,
    minDistance: 3,
    eyeY: 1.1, // height used for the "is it in view?" test
    view: { halfAngleRad: (40 * Math.PI) / 180, maxDistance: 20 },
  },
}

// Everything about one variant of the room, computed in one place.
export function getRoomLayout(variant) {
  const index = Math.max(0, Math.min(MAX_VARIANT, Math.trunc(variant) || 0))
  const { room, doorFractions, sign } = VARIANTS[index]
  const hw = room.width / 2
  const hd = room.depth / 2
  const margin = 0.6
  return {
    variant: index,
    room,
    sign,
    spawn: [0, hd - 1],
    doorZ: -hd + 0.1,
    doors: doorFractions.map((f, i) => ({ id: `l8-door-${i}`, index: i, x: f * room.width })),
    // Where the presence stands when the room changes: in view from the spawn point, off the doors' line.
    presenceAnchor: { x: room.width * 0.18, z: -hd + 2.2 },
    presenceBounds: { minX: -hw + margin, maxX: hw - margin, minZ: -hd + margin, maxZ: hd - margin },
  }
}
