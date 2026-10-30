import { useMemo } from 'react'
import { EffectComposer, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import EffectsBoundary from './EffectsBoundary.jsx'
import { STAGE_PROFILES } from '../../game/config/corruption.js'
import { useGameStore } from '../../game/state/gameStore.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

function Composer({ stage }) {
  const reduced = useReducedMotion()
  const p = STAGE_PROFILES[stage]
  const offset = useMemo(() => new Vector2(p.chroma, p.chroma), [p.chroma])
  return (
    <EffectComposer multisampling={0}>
      <Vignette eskil={false} offset={0.25} darkness={p.vignette} />
      <ChromaticAberration offset={offset} radialModulation={false} modulationOffset={0} />
      {/* Film grain is the only per-frame effect; it is dropped entirely under reduced motion. */}
      {!reduced && p.noise > 0 ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={p.noise} /> : <></>}
    </EffectComposer>
  )
}

// Postprocessing only exists from stage 1 up: stage 0 pays no cost. Mount inside <Canvas>.
export default function ScreenEffects() {
  const stage = useGameStore((s) => s.corruptionStage)
  if (stage < 1) return null
  return (
    <EffectsBoundary>
      <Composer stage={stage} />
    </EffectsBoundary>
  )
}
