import { createLevelRuntime } from '../createLevelRuntime.js'
import { LEVEL01_DIALOGUE } from '../../config/dialogue.js'
import { obviousDoorPuzzle, OBVIOUS_DOOR_ID } from './obviousDoorPuzzle.js'
import { createDoorDodge } from './DoorDodge.js'
import { LEVEL01 } from './layout.js'

// Level 1 behavior with no React/Three.js: puzzle + dialogue (via the shared runtime) + the dodging door.
export function createLevel01Logic(options = {}) {
  const dodge = createDoorDodge({ ...LEVEL01.door })
  let doorOpen = false
  const reset = () => {
    dodge.reset()
    doorOpen = false
  }

  const rt = createLevelRuntime({
    levelId: LEVEL01.id,
    puzzles: [obviousDoorPuzzle],
    dialogueLines: LEVEL01_DIALOGUE,
    welcomeDelayMs: LEVEL01.welcomeDelayMs,
    completeDelayMs: LEVEL01.completeDelayMs,
    ...options,
    onStart: reset,
    onSolved: () => {
      doorOpen = true
    },
    onDispose: reset,
  })
  const manager = rt.manager
  const buttonPressed = () => Boolean(manager.get(OBVIOUS_DOOR_ID)?.getData()?.buttonPressed)

  return {
    start: rt.start,
    dispose: rt.dispose,

    // Call every frame while playing. player: { x, z }.
    update(player, dt) {
      if (!rt.isStarted()) return
      if (dodge.step(player, dt, !buttonPressed())) manager.dispatch('door_dodged')
    },
    pressButton() {
      if (!rt.isStarted() || buttonPressed()) return false
      manager.dispatch('button_pressed')
      return buttonPressed()
    },
    // The exit does nothing until the button has been pressed.
    useExit() {
      if (!rt.isStarted() || !buttonPressed() || manager.isCompleted(OBVIOUS_DOOR_ID)) return false
      manager.dispatch('exit_used')
      return manager.isCompleted(OBVIOUS_DOOR_ID)
    },

    getDoorX: () => dodge.x,
    isDoorOpen: () => doorOpen,
    isButtonPressed: buttonPressed,
    isExitDone: () => manager.isCompleted(OBVIOUS_DOOR_ID),
    getDodgeCount: () => dodge.dodges,
  }
}
