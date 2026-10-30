import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import LevelManager from '../game/levels/LevelManager.jsx'
import CorruptionLighting from '../game/world/CorruptionLighting.jsx'
import { useGameStore } from '../game/state/gameStore.js'
import { devFlags } from '../game/core/devFlags.js'
import PerfMonitor from '../components/effects/PerfMonitor.jsx'
import AmbientEventsRunner from '../components/effects/AmbientEventsRunner.jsx'

// Postprocessing is code-split: it downloads only the first time corruption reaches stage 1.
const ScreenEffects = lazy(() => import('../components/effects/ScreenEffects.jsx'))

function CorruptionEffects() {
  const stage = useGameStore((s) => s.corruptionStage)
  if (stage < 1) return null
  return (
    <Suspense fallback={null}>
      <ScreenEffects />
    </Suspense>
  )
}

export default function GameCanvas() {
  return (
    <Canvas camera={{ fov: 70, near: 0.05, far: 50 }} dpr={[1, 2]}>
      <CorruptionLighting />
      <LevelManager />
      <CorruptionEffects />
      <AmbientEventsRunner />
      {devFlags.showStats && <PerfMonitor />}
    </Canvas>
  )
}
