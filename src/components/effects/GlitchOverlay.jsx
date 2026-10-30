import { useState } from 'react'
import { useGameStore } from '../../game/state/gameStore.js'
import { useCorruptionFxStore } from '../../game/state/corruptionFxStore.js'
import { STAGE_PROFILES } from '../../game/config/corruption.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

// DOM overlay above the canvas: faint static scanlines from stage 2, plus one brief glitch burst each
// time corruption rises during play. Pointer-transparent, so it can never block the UI.
export default function GlitchOverlay() {
  const stage = useGameStore((s) => s.corruptionStage)
  const burstId = useCorruptionFxStore((s) => s.burstId)
  const reduced = useReducedMotion()
  const [initialBurst] = useState(burstId) // bursts from before this mount must not replay
  const scan = STAGE_PROFILES[stage].scanlines

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
      {scan > 0 && <div className="scanlines absolute inset-0" style={{ '--scan': scan }} />}
      {!reduced && burstId !== initialBurst && <div key={burstId} className="glitch-burst" />}
    </div>
  )
}
