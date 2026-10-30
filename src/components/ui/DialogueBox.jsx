import { useDialogueStore } from '../../game/state/dialogueStore.js'
import { useGameStore } from '../../game/state/gameStore.js'
import { corruptText } from '../../game/systems/textCorruption.js'

// Presentation only. Content and timing come from the dialogue system.
export default function DialogueBox() {
  const message = useDialogueStore((s) => s.message)
  const stage = useGameStore((s) => s.corruptionStage)
  if (!message) return null
  return (
    <div
      key={message.id}
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-12 left-1/2 z-30 max-w-xl -translate-x-1/2 rounded bg-zinc-900/85 px-5 py-3 text-center text-lg font-medium text-zinc-50"
    >
      {corruptText(message.text, stage, message.id)}
    </div>
  )
}
