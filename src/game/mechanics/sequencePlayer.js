// Plays a fixed sequence on a timeline (for "watch the lamps" puzzles). Pure and time-driven: the caller
// feeds it elapsed milliseconds, so it pauses with the game and is fully deterministic.
//   play(leadMs): start (waiting leadMs first)  stop(): cancel  update(dtMs)
//   getActive(): index of the item lit right now, or null  isPlaying(): still running
export function createSequencePlayer({ sequence, stepMs = 700, gapMs = 300 }) {
  const slot = stepMs + gapMs
  const total = sequence.length * slot
  let elapsed = null // null = idle; negative = still in the lead-in
  return {
    play(leadMs = 0) {
      elapsed = -Math.max(0, leadMs)
    },
    stop() {
      elapsed = null
    },
    update(dtMs) {
      if (elapsed === null) return
      elapsed += dtMs
      if (elapsed >= total) elapsed = null
    },
    getActive() {
      if (elapsed === null || elapsed < 0) return null
      const step = Math.floor(elapsed / slot)
      return elapsed - step * slot < stepMs ? sequence[step] : null
    },
    isPlaying: () => elapsed !== null,
  }
}
