import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createAmbientEvents } from '../../game/systems/AmbientEvents.js'
import { applyAmbientEvent } from '../../game/systems/ambientEffects.js'
import { useGameStore } from '../../game/state/gameStore.js'
import { useDialogueStore } from '../../game/state/dialogueStore.js'
import { GAME_STATES as S } from '../../game/core/GameConfig.js'

// Ticks the ambient-event scheduler while playing (mount inside <Canvas>). A fresh, seeded scheduler per
// run means a restarted level behaves identically; it only advances in PLAYING, so pausing freezes it.
// Pending "just kidding" reveals are cancelled when the level changes, so one level's bait never lands in the next.
export default function AmbientEventsRunner() {
  const levelId = useGameStore((s) => s.levelId)
  const runId = useGameStore((s) => s.runId)
  const scheduler = useMemo(() => createAmbientEvents({ seed: `${levelId}:${runId}` }), [levelId, runId])
  const reveals = useRef(new Set())

  useEffect(() => {
    const pending = reveals.current
    return () => {
      for (const id of pending) clearTimeout(id)
      pending.clear()
    }
  }, [scheduler])

  useFrame((_, delta) => {
    const game = useGameStore.getState()
    if (game.status !== S.PLAYING) return
    const busy = Boolean(useDialogueStore.getState().message)
    const event = scheduler.update(Math.min(delta, 0.1) * 1000, game.corruptionStage, busy, game.corruptionIntensity)
    if (!event) return
    const timer = applyAmbientEvent(event)
    if (timer !== null) reveals.current.add(timer)
  })
  return null
}
