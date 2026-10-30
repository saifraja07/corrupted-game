// Pure movement math. No Three.js, no React: easy to test.
export const MAX_DELTA = 0.05 // clamp frame spikes so collision never sees huge steps
export const MAX_PITCH = Math.PI / 2 - 0.05
const BASE_LOOK = 0.0022 // radians per pixel at sensitivity 1
const MAX_MOUSE_STEP = 200 // ignore occasional bogus movementX spikes

export function clampDelta(dt) {
  return Math.min(Math.max(dt, 0), MAX_DELTA)
}

// Convert input axes (x strafe right+, z forward+) into a world-space XZ displacement.
// yaw 0 faces -Z; positive yaw turns left (Three.js convention). Diagonals are normalized.
export function computeMove(out, axes, yaw, speed, dt) {
  let ax = axes.x
  let az = axes.z
  const len = Math.hypot(ax, az)
  if (len === 0) {
    out.x = 0
    out.z = 0
    return out
  }
  ax /= len
  az /= len
  const sin = Math.sin(yaw)
  const cos = Math.cos(yaw)
  const step = speed * dt
  // forward = (-sin, -cos), right = (cos, -sin)
  out.x = (ax * cos - az * sin) * step
  out.z = (-ax * sin - az * cos) * step
  return out
}

// Apply a mouse delta to look angles stored in `look` ({yaw, pitch}).
export function applyLook(look, dx, dy, sensitivity) {
  const k = BASE_LOOK * sensitivity
  const sx = Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, dx))
  const sy = Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, dy))
  look.yaw -= sx * k
  look.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, look.pitch - sy * k))
  return look
}
