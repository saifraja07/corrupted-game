// "Things change when you're not looking." Pure geometry + a tiny scheduler: no rendering.
// view: { x, y, z, fx, fy, fz } (eye position + unit forward vector). target: { x, y, z }.
// Observation is a view cone with a max distance; walls are deliberately not considered, so the
// rule is simple and predictable (documented trade-off).
export function isInView(view, target, { halfAngleRad = (40 * Math.PI) / 180, maxDistance = 14 } = {}) {
  const dx = target.x - view.x
  const dy = target.y - view.y
  const dz = target.z - view.z
  const dist = Math.hypot(dx, dy, dz)
  if (dist < 1e-6) return true
  if (dist > maxDistance) return false
  return (view.fx * dx + view.fy * dy + view.fz * dz) / dist >= Math.cos(halfAngleRad)
}

// Queue changes; each is applied only on a frame where the target is unobserved, one per frame.
export function createLookAwayChanger() {
  let pending = []
  return {
    queue(apply) {
      pending.push(apply)
    },
    // Call every frame. Returns true if a change was applied this frame.
    update(observed) {
      if (observed || pending.length === 0) return false
      pending.shift()()
      return true
    },
    pendingCount: () => pending.length,
    clear() {
      pending = []
    },
  }
}

// Fill `out` ({x,y,z,fx,fy,fz}) from an eye position and camera yaw/pitch (YXZ order, yaw 0 faces -Z,
// positive pitch looks up). Lives here so the scene and tests share one definition of "forward".
export function fillView(out, position, yaw, pitch) {
  const cp = Math.cos(pitch)
  out.x = position.x
  out.y = position.y
  out.z = position.z
  out.fx = -Math.sin(yaw) * cp
  out.fy = Math.sin(pitch)
  out.fz = -Math.cos(yaw) * cp
  return out
}
