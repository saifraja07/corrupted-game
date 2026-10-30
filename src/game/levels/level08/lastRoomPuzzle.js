import { MAX_VARIANT } from './layout.js'

// "The Last Room": every door is fake. Using one sends you back to the start and transforms the room
// (and the first time, something appears). The real exit is not a door at all: you must WATCH the
// presence, walk up to it while keeping it in view, and follow it. The game hints at this twice.
// The rules here never depend on the room's variant, so no transformation can make it unsolvable.
export const LAST_ROOM_ID = 'last-room'

export const lastRoomPuzzle = {
  id: LAST_ROOM_ID,
  createState: () => ({ doorUses: 0, followed: false }),
  onActivate: (api) => {
    // Nothing tried for a while? Point at the doors.
    api.after(45000, () => {
      if (api.getData().doorUses === 0) api.emit('dialogue', { trigger: 'hint_try_door' })
    })
  },
  handlers: {
    door_used: (d, _p, api) => {
      d.doorUses++
      api.emit('effect', { effect: 'room_change', variant: Math.min(d.doorUses, MAX_VARIANT) })
      if (d.doorUses === 1) api.emit('dialogue', { trigger: 'presence_appears' })
      else if (d.doorUses === 2) api.emit('dialogue', { trigger: 'hint_stop_looking' })
      else if (d.doorUses === 4) api.emit('dialogue', { trigger: 'hint_watch' })
      else api.emit('dialogue', { trigger: 'door_fake' })
    },
    // Only possible once the presence has appeared (after the first door).
    follow: (d, _p, api) => {
      if (d.doorUses < 1 || d.followed) return
      d.followed = true
      api.emit('dialogue', { trigger: 'follow' })
    },
  },
  isComplete: (d) => d.followed,
  getProgress: (d) => (d.followed ? 1 : Math.min(d.doorUses, 3) / 6),
}
