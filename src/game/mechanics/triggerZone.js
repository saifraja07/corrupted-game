// Edge-triggered region test on the floor plane. update(pos) returns true only on the frame the
// player ENTERS the zone (once, unless once:false), so mechanics start at a precise moment.
export function createTriggerZone({ contains, once = true }) {
  let inside = false
  let fired = false
  return {
    update(pos) {
      const now = Boolean(contains(pos))
      const entered = now && !inside && !(once && fired)
      inside = now
      if (entered) fired = true
      return entered
    },
    reset() {
      inside = false
      fired = false
    },
    hasFired: () => fired,
  }
}
