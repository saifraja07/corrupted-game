// Reversible changes to how input maps to movement ("reversed controls"). One instance per level,
// passed to the Player; clear() must run on level exit so nothing leaks into other levels.
export function createControlModifiers() {
  const flags = { invertForward: false, invertStrafe: false }
  const flip = (n) => (n === 0 ? 0 : -n) // avoid producing -0
  return {
    set(patch) {
      for (const key of Object.keys(flags)) if (typeof patch?.[key] === 'boolean') flags[key] = patch[key]
    },
    clear() {
      flags.invertForward = false
      flags.invertStrafe = false
    },
    isActive: () => flags.invertForward || flags.invertStrafe,
    get: () => ({ ...flags }),
    // Mutates and returns axes ({x: strafe right+, z: forward+}). No allocation.
    apply(axes) {
      if (flags.invertForward) axes.z = flip(axes.z)
      if (flags.invertStrafe) axes.x = flip(axes.x)
      return axes
    },
  }
}
