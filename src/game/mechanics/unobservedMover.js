// "It only moves when you are not looking." Pure motion rule, no rendering.
// Frozen whenever `observed` is true. Otherwise it drifts toward the target at a fixed slow speed and
// stops at `minDistance`, so it can approach but never touch. Optional bounds keep it inside the room.
export function createUnobservedMover({ x = 0, z = 0, speed = 0.8, minDistance = 3, bounds = null } = {}) {
  let px = x
  let pz = z
  let box = bounds
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  return {
    get x() {
      return px
    },
    get z() {
      return pz
    },
    reset(nx, nz) {
      px = nx
      pz = nz
    },
    setBounds(next) {
      box = next
    },
    // target: { x, z }. Returns true if it moved this step.
    step(target, dt, observed) {
      if (observed || !(dt > 0)) return false
      const dx = target.x - px
      const dz = target.z - pz
      const dist = Math.hypot(dx, dz)
      if (dist <= minDistance + 1e-9) return false
      const move = Math.min(speed * dt, dist - minDistance) // never overshoots the stopping distance
      px += (dx / dist) * move
      pz += (dz / dist) * move
      if (box) {
        px = clamp(px, box.minX, box.maxX)
        pz = clamp(pz, box.minZ, box.maxZ)
      }
      return true
    },
  }
}
