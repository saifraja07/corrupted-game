// "The Obvious Door": the visible exit dodges you; the real solution is a button behind you.
// The puzzle owns the RULES. The door's movement is level logic (DoorDodge) that reports events here.
export const OBVIOUS_DOOR_ID = 'obvious-door'

export const obviousDoorPuzzle = {
  id: OBVIOUS_DOOR_ID,
  createState: () => ({ buttonPressed: false, dodges: 0, exitUsed: false }),
  handlers: {
    door_dodged: (d, _p, api) => {
      if (d.buttonPressed) return
      d.dodges++
      // Escalating nudges so the solution stays discoverable.
      if (d.dodges === 4) api.emit('dialogue', { trigger: 'hint_1' })
      else if (d.dodges === 8) api.emit('dialogue', { trigger: 'hint_2' })
      else api.emit('dialogue', { trigger: 'door_rejected' })
    },
    button_pressed: (d, _p, api) => {
      if (d.buttonPressed) return
      d.buttonPressed = true
      api.emit('dialogue', { trigger: 'button_pressed' })
    },
    // The exit only works once the button has been pressed, in any order of exploration.
    exit_used: (d) => {
      if (d.buttonPressed) d.exitUsed = true
    },
  },
  isComplete: (d) => d.exitUsed,
  getProgress: (d) => (d.exitUsed ? 1 : d.buttonPressed ? 0.5 : 0),
}
