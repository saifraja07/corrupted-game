import { createPuzzleManager } from '../puzzles/PuzzleManager.js'
import { createPuzzleRegistry } from '../puzzles/puzzleRegistry.js'
import { createDialogueSystem } from '../systems/DialogueSystem.js'
import { CORRUPTION_DIALOGUE } from '../config/dialogue.js'

const noop = () => {}

// Shared, framework-free scaffolding every level uses: its own puzzle registry/manager, dialogue
// system, tracked timers, and start()/dispose() that can cycle (StrictMode, restart) without leaking.
// A level is "solved" when all required puzzles complete; then the level_complete line plays and
// onLevelComplete fires exactly once after completeDelayMs.
export function createLevelRuntime({
  levelId,
  puzzles,
  requiredPuzzleIds = puzzles.map((p) => p.id),
  dialogueLines,
  welcomeDelayMs = 800,
  completeDelayMs = 2200,
  onMessage = noop,
  onLevelComplete = noop,
  onPuzzleCompleted = noop,
  onStart = noop, // level-specific reset, called on every start
  onSolved = noop,
  onEvent = noop, // every puzzle event ({ puzzleId, type, payload }), e.g. custom 'effect' events
  onDispose = noop,
  getStage = () => 0, // current corruption stage (filters stage-gated dialogue)
  onGameEvent = noop, // (name) => new stage number if the event raised corruption, else null
  onLevelStart = noop,
  onLevelDispose = noop,
  scheduler,
  now,
} = {}) {
  const setTimer = scheduler?.set ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = scheduler?.clear ?? ((id) => clearTimeout(id))

  const registry = createPuzzleRegistry()
  for (const p of puzzles) registry.register(p)
  const manager = createPuzzleManager({ registry, scheduler })
  const dialogue = createDialogueSystem({ lines: [...dialogueLines, ...CORRUPTION_DIALOGUE], level: levelId, getStage, scheduler, now })

  let started = false
  let solved = false
  let unsubs = []
  const timers = new Set()

  const later = (ms, fn) => {
    const id = setTimer(() => {
      timers.delete(id)
      if (started) fn()
    }, ms)
    timers.add(id)
  }

  // A named gameplay moment: lets corruption react first (so stage-gated lines see the new stage), then
  // plays the event's line, then the line announcing a stage change.
  function fire(name) {
    const raised = onGameEvent(name)
    dialogue.trigger(name)
    if (typeof raised === 'number') dialogue.trigger(`corruption_stage_${raised}`)
  }

  function handleEvent(e) {
    onEvent(e)
    if (e.type === 'dialogue') {
      fire(e.payload.trigger)
    } else if (e.type === 'puzzleCompleted') {
      onPuzzleCompleted(e.puzzleId)
      if (!solved && manager.areAllCompleted(requiredPuzzleIds)) {
        solved = true
        onSolved()
        fire('level_complete')
        later(completeDelayMs, onLevelComplete) // once per run: `solved` latches
      }
    }
  }

  return {
    manager,
    dialogue,
    fire,
    isStarted: () => started,
    isSolved: () => solved,
    start() {
      if (started) return false
      started = true
      solved = false
      onStart()
      onLevelStart()
      unsubs = [dialogue.subscribe(onMessage), manager.subscribe(handleEvent)]
      for (const p of puzzles) manager.load(p.id)
      later(welcomeDelayMs, () => dialogue.trigger('level_start'))
      return true
    },
    dispose() {
      if (!started) return false
      started = false
      for (const id of timers) clearTimer(id)
      timers.clear()
      dialogue.clear() // notifies subscribers with null so the UI line disappears
      for (const off of unsubs) off()
      unsubs = []
      manager.unloadAll()
      onDispose()
      onLevelDispose()
      return true
    },
  }
}
