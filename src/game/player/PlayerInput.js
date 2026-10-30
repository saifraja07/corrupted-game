// Collects held movement keys. Knows nothing about cameras or movement math.
const KEY_AXES = {
  KeyW: ['z', 1],
  KeyS: ['z', -1],
  KeyA: ['x', -1],
  KeyD: ['x', 1],
}

export function createPlayerInput(target = window) {
  const held = new Set()
  let attached = false

  const onKeyDown = (e) => {
    if (KEY_AXES[e.code]) held.add(e.code)
  }
  const onKeyUp = (e) => held.delete(e.code)
  const reset = () => held.clear()

  return {
    attach() {
      if (attached) return
      attached = true
      target.addEventListener('keydown', onKeyDown)
      target.addEventListener('keyup', onKeyUp)
      target.addEventListener('blur', reset)
    },
    detach() {
      if (!attached) return
      attached = false
      target.removeEventListener('keydown', onKeyDown)
      target.removeEventListener('keyup', onKeyUp)
      target.removeEventListener('blur', reset)
      held.clear()
    },
    reset,
    // Writes strafe (x: right+) and forward (z: forward+) into `out`; returns it. No allocation.
    axes(out) {
      out.x = 0
      out.z = 0
      for (const code of held) {
        const [axis, sign] = KEY_AXES[code]
        out[axis] += sign
      }
      return out
    },
  }
}
