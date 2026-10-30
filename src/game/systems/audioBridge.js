import { GAME_STATES as S } from '../core/GameConfig.js'
import { useGameStore } from '../state/gameStore.js'
import { useSettingsStore } from '../state/settingsStore.js'

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart']

// Connects audio to the rest of the game WITHOUT touching gameplay code: it only watches stores and
// the document. Returns an unbind() that removes every listener and subscription.
export function bindAudio({ audio, gameStore = useGameStore, settingsStore = useSettingsStore, doc = globalThis.document } = {}) {
  const applySettings = (s) =>
    audio.setVolumes({ master: s.masterVolume, sfx: s.sfxVolume, ambient: s.ambientVolume, muted: s.muted })
  applySettings(settingsStore.getState())
  const offSettings = settingsStore.subscribe(applySettings)

  function onStatus(state) {
    switch (state.status) {
      case S.MAIN_MENU:
        audio.duckAmbient(false)
        audio.stopAmbient()
        break
      case S.TRANSITIONING:
        audio.stopAmbient()
        audio.play('transition')
        break
      case S.PLAYING:
        audio.duckAmbient(false)
        audio.setAmbientStage(state.corruptionStage)
        audio.startAmbient()
        break
      case S.PAUSED:
        audio.duckAmbient(true)
        break
      case S.LEVEL_COMPLETE:
        audio.stopAmbient()
        audio.play('level_complete')
        break
      case S.ENDING:
        audio.stopAmbient()
        audio.play('ending')
        break
      default:
        break
    }
  }
  const offGame = gameStore.subscribe((state, prev) => {
    if (state.status !== prev.status) onStatus(state)
    if (state.corruptionStage !== prev.corruptionStage) audio.setAmbientStage(state.corruptionStage)
  })

  // Browsers only allow audio after a user gesture: unlock on the first one.
  const unlock = () => {
    audio.unlock()
    for (const t of UNLOCK_EVENTS) doc?.removeEventListener(t, unlock, true)
  }
  for (const t of UNLOCK_EVENTS) doc?.addEventListener(t, unlock, true)

  // One delegated listener gives every button a click sound.
  const onClick = (e) => {
    if (e.target?.closest?.('button')) audio.play('ui_click')
  }
  doc?.addEventListener('click', onClick, true)

  return function unbind() {
    offSettings()
    offGame()
    for (const t of UNLOCK_EVENTS) doc?.removeEventListener(t, unlock, true)
    doc?.removeEventListener('click', onClick, true)
    audio.stopAll()
  }
}
