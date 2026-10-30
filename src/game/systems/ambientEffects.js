import { audio } from './audio.js'
import { useCorruptionFxStore } from '../state/corruptionFxStore.js'

// Applies an ambient event to the UI and audio. Everything it does is temporary and clears itself:
// notices expire (CorruptionBanner), objective distortions are restored (GameHUD), bursts fade out.
export function applyAmbientEvent(event, { fx = useCorruptionFxStore, audioManager = audio } = {}) {
  const s = fx.getState()
  if (event.kind === 'notice') s.showNotice(event.text)
  else if (event.kind === 'objective') s.glitchObjective(event.text)
  if (event.burst) s.burst()
  if (event.sound) audioManager.playEvent(event.sound)
}
