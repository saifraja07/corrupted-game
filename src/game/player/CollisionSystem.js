// Simple 2D (XZ-plane) circle-vs-AABB collision. Replaceable: Player only calls moveWithCollisions.
// A box is { minX, maxX, minZ, maxZ, enabled? }. `enabled` may be a boolean or a function returning one
// (e.g. () => !doorOpenRef.current), so doors don't need to mutate their boxes.

export function makeBox(cx, cz, width, depth, enabled = true) {
  return { minX: cx - width / 2, maxX: cx + width / 2, minZ: cz - depth / 2, maxZ: cz + depth / 2, enabled }
}

// Tiny mutable open/closed switch for doors; collision boxes read it via a function.
export function createGate(open = false) {
  let isOpen = open
  return { isOpen: () => isOpen, setOpen: (v) => { isOpen = Boolean(v) } }
}

const isOn = (b) => (typeof b.enabled === 'function' ? b.enabled() : b.enabled !== false)

// A box whose x-center follows getCx() each time it is read (for sliding doors).
export function makeDynamicBox(getCx, cz, width, depth, enabled = true) {
  return {
    get minX() {
      return getCx() - width / 2
    },
    get maxX() {
      return getCx() + width / 2
    },
    minZ: cz - depth / 2,
    maxZ: cz + depth / 2,
    enabled,
  }
}

// Four thick boxes just outside a room of the given inner size, centered on the origin.
export function roomBoundsToBoxes(width, depth, thickness = 1) {
  const hw = width / 2
  const hd = depth / 2
  const t = thickness
  return [
    makeBox(0, -hd - t / 2, width + t * 2, t),
    makeBox(0, hd + t / 2, width + t * 2, t),
    makeBox(-hw - t / 2, 0, t, depth),
    makeBox(hw + t / 2, 0, t, depth),
  ]
}

// Push the circle at pos ({x,z}) out of one box. Returns true if it moved.
function pushOut(pos, radius, b) {
  const nx = Math.max(b.minX, Math.min(pos.x, b.maxX))
  const nz = Math.max(b.minZ, Math.min(pos.z, b.maxZ))
  const dx = pos.x - nx
  const dz = pos.z - nz
  const distSq = dx * dx + dz * dz
  if (distSq >= radius * radius) return false

  if (distSq > 1e-12) {
    const dist = Math.sqrt(distSq)
    const push = radius - dist
    pos.x += (dx / dist) * push
    pos.z += (dz / dist) * push
    return true
  }
  // Center is inside the box: exit through the nearest face.
  const left = pos.x - b.minX
  const right = b.maxX - pos.x
  const back = pos.z - b.minZ
  const front = b.maxZ - pos.z
  const m = Math.min(left, right, back, front)
  if (m === left) pos.x = b.minX - radius
  else if (m === right) pos.x = b.maxX + radius
  else if (m === back) pos.z = b.minZ - radius
  else pos.z = b.maxZ + radius
  return true
}

const MAX_SUBSTEP = 0.1 // well under typical wall thickness and player radius

function stepAndResolve(pos, dx, dz, radius, boxes) {
  pos.x += dx
  pos.z += dz
  for (let pass = 0; pass < 3; pass++) {
    let moved = false
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]
      if (isOn(b) && pushOut(pos, radius, b)) moved = true
    }
    if (!moved) break
  }
}

// Move pos by (dx, dz) in small substeps, resolving overlaps after each one.
// Resolving (rather than blocking per-axis) gives wall sliding; substeps prevent tunneling
// even if a caller passes a large step.
export function moveWithCollisions(pos, dx, dz, radius, boxes) {
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / MAX_SUBSTEP))
  const sx = dx / n
  const sz = dz / n
  for (let i = 0; i < n; i++) stepAndResolve(pos, sx, sz, radius, boxes)
  return pos
}
