import { useEffect } from 'react'
import { usePointerLocked, requestGameLock } from '../../game/player/pointerLock.js'
import { useCorruptionFxStore } from '../../game/state/corruptionFxStore.js'
import { useGameStore } from '../../game/state/gameStore.js'
import InteractionPrompt from './InteractionPrompt.jsx'
import DialogueBox from './DialogueBox.jsx'

// Objective + dialogue always; crosshair and prompt while locked; "Click to play" when the pointer is free.
export default function GameHUD() {
  const locked = usePointerLocked()
  const objective = useGameStore((s) => s.objective)
  const glitch = useCorruptionFxStore((s) => s.objectiveGlitch)
  // A distorted objective is shown briefly, then the real one comes back.
  useEffect(() => {
    if (!glitch) return undefined
    const id = setTimeout(() => useCorruptionFxStore.getState().clearObjectiveGlitch(glitch.id), 2500)
    return () => clearTimeout(id)
  }, [glitch])
  return (
    <>
      {objective && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded bg-zinc-900/80 px-3 py-1.5 text-sm font-bold tracking-wide text-zinc-100">
          {glitch ? <span className="font-mono [text-shadow:1px_0_rgba(239,68,68,0.6)]">{glitch.text}</span> : objective}
        </div>
      )}
      <DialogueBox />
      {locked ? (
        <>
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/70" aria-hidden="true" />
          <InteractionPrompt />
        </>
      ) : (
        <button
          type="button"
          onClick={requestGameLock}
          className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100/60 text-xl font-semibold text-zinc-900"
        >
          Click to play
        </button>
      )}
    </>
  )
}
