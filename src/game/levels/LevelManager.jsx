import { Suspense } from 'react'
import { useGameStore } from '../state/gameStore.js'
import { LEVEL_COMPONENTS } from './levelComponents.js'

// Mounts the current level. The key changes on every start, restart and next-level, so the previous
// scene (and its logic) is always unmounted and disposed before a fresh one begins.
export default function LevelManager() {
  const levelId = useGameStore((s) => s.levelId)
  const runId = useGameStore((s) => s.runId)
  const Level = levelId ? LEVEL_COMPONENTS[levelId] : null
  if (!Level) return null
  return (
    <Suspense fallback={null}>
      <Level key={`${levelId}:${runId}`} />
    </Suspense>
  )
}
