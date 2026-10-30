// The troll door: when an approaching player gets close, it slides along its wall to the end
// farthest from the player. Pure math, no rendering. Always clamped inside [minX, maxX], so it can
// never leave the room, and once disabled it glides back to the center and stays there.
export function createDoorDodge({ minX, maxX, startX = 0, speed = 5.5, triggerDist = 3, z }) {
  const center = (minX + maxX) / 2
  let x = startX
  let targetX = startX
  let moving = false
  let dodges = 0

  return {
    get x() {
      return x
    },
    get dodges() {
      return dodges
    },
    get moving() {
      return moving
    },
    reset() {
      x = startX
      targetX = startX
      moving = false
      dodges = 0
    },
    // player: { x, z }. Returns true on the step a NEW dodge begins.
    step(player, dt, enabled = true) {
      let started = false
      if (!enabled) {
        targetX = center
        moving = x !== center
      } else if (!moving && Math.hypot(player.x - x, player.z - z) < triggerDist) {
        targetX = Math.abs(player.x - minX) >= Math.abs(player.x - maxX) ? minX : maxX
        moving = targetX !== x
        if (moving) {
          dodges++
          started = true
        }
      }
      if (moving) {
        const dx = targetX - x
        const stride = speed * dt
        if (Math.abs(dx) <= stride) {
          x = targetX
          moving = false
        } else {
          x += Math.sign(dx) * stride
        }
        x = Math.max(minX, Math.min(maxX, x))
      }
      return started
    },
  }
}
