import { createCorruptionSystem } from '../systems/CorruptionSystem.js'
import { useGameStore } from './gameStore.js'
import { useCorruptionFxStore } from './corruptionFxStore.js'
import { parseDevFlags } from '../core/devFlags.js'

// Developer preview: open the game with ?corruption=0..3 to pin the stage (events are then ignored).
export function readDevStage(search = globalThis.location?.search ?? '') {
  return parseDevFlags(search).corruptionStage
}

// The one live corruption engine. It pushes the stage into gameStore (what React reads) and fires a
// single glitch burst only when corruption rises DURING play, never at level start.
export const corruption = createCorruptionSystem({
  devStage: readDevStage(),
  onChange: (stage, prev, reason) => {
    useGameStore.getState().setCorruptionStage(stage)
    if (reason === 'event' && stage > prev) useCorruptionFxStore.getState().stageRose(stage)
    if (reason !== 'event') useCorruptionFxStore.getState().reset()
  },
})

export const startCorruptionForLevel = (levelId) => corruption.startLevel(levelId)
export const reportGameEvent = (name) => corruption.report(name)
export const resetCorruption = () => corruption.reset()
