// A barrier that is open only while NOT being watched. Pure: the caller says whether it is observed each
// frame. Small delays stop it flickering when the view cone is crossed briefly. Safety rule: it never
// closes while `blocked` (the player is standing where it would close), so it cannot trap or crush anyone.
//   update(dtMs, observed, blocked) -> 'opened' | 'closed' | null
export function createUnobservedGate({ openAfterMs = 350, closeAfterMs = 120 } = {}) {
  let open = false
  let watchedMs = 0
  let unwatchedMs = 0
  return {
    isOpen: () => open,
    reset() {
      open = false
      watchedMs = 0
      unwatchedMs = 0
    },
    update(dtMs, observed, blocked = false) {
      if (observed) {
        unwatchedMs = 0
        watchedMs += dtMs
        if (open && !blocked && watchedMs >= closeAfterMs) {
          open = false
          return 'closed'
        }
      } else {
        watchedMs = 0
        unwatchedMs += dtMs
        if (!open && unwatchedMs >= openAfterMs) {
          open = true
          return 'opened'
        }
      }
      return null
    },
  }
}
