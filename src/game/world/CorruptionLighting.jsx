import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { STAGE_PROFILES } from '../config/corruption.js'
import { lightMultiplier } from '../systems/corruptionEffects.js'
import { useGameStore } from '../state/gameStore.js'
import { sceneFx } from '../state/sceneFx.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

// Scene lighting, background and fog for the current corruption stage. The stage changes React state
// only when it rises; the slow light animation runs on refs inside useFrame (no per-frame renders).
export default function CorruptionLighting() {
  const stage = useGameStore((s) => s.corruptionStage)
  const reduced = useReducedMotion()
  const p = STAGE_PROFILES[stage]
  const ambient = useRef(null)
  const sun = useRef(null)

  useFrame((frame) => {
    // A level can darken the room (blackouts). Reduced motion keeps it much shallower, never fully dark.
    const blackout = 1 - (reduced ? 0.55 : 0.92) * sceneFx.darkness
    const m = lightMultiplier(p, frame.clock.elapsedTime, reduced) * blackout
    if (ambient.current) ambient.current.intensity = p.ambient * m
    if (sun.current) sun.current.intensity = p.directional * m
  })

  return (
    <>
      <color attach="background" args={[p.background]} />
      {p.fog && <fog attach="fog" args={[p.background, p.fog.near, p.fog.far]} />}
      <ambientLight ref={ambient} intensity={p.ambient} />
      <directionalLight ref={sun} position={[2, 3, 2]} intensity={p.directional} />
    </>
  )
}
