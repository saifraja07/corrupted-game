import { audio } from './audio.js'
import { useCorruptionFxStore } from '../state/corruptionFxStore.js'

// Applies an ambient event to the UI and audio. Everything it does is temporary and clears itself, and it
// touches ONLY the corruption-effects store and audio: never saves, settings, progress or gameplay state.
// Returns the id of a pending "reveal" timer (or null) so the caller can cancel it if the level ends first.
export function applyAmbientEvent(event, { fx = useCorruptionFxStore, audioManager = audio, schedule = (fn, ms) => setTimeout(fn, ms) } = {}) {
  const s = fx.getState()
  if (event.kind === 'notice') s.showNotice(event.text)
  else if (event.kind === 'objective') s.glitchObjective(event.text)
  else if (event.kind === 'fakeError') s.showFakeError()
  if (event.burst) s.burst()
  if (event.sound) audioManager.playEvent(event.sound)
  if (event.then) return schedule(() => fx.getState().showNotice(event.then.text), event.then.afterMs)
  return null
}
