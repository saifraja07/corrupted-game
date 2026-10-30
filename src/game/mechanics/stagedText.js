// Displayed instructions, kept apart from the real puzzle conditions: advancing the text never
// touches puzzle state, and puzzle state never depends on what the text says.
export function createStagedText(stages) {
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('stagedText needs at least one stage')
  let stage = 0
  return {
    get: () => stages[stage],
    getStage: () => stage,
    setStage(i) {
      if (!Number.isInteger(i) || i < 0 || i >= stages.length) return false
      stage = i
      return true
    },
    reset() {
      stage = 0
    },
  }
}
