import { useInteractionStore } from '../../game/state/interactionStore.js'

export default function InteractionPrompt() {
  const prompt = useInteractionStore((s) => s.prompt)
  if (!prompt) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-[56%] z-10 -translate-x-1/2 rounded bg-zinc-900/80 px-3 py-1.5 text-sm font-semibold text-zinc-100" role="status">
      {prompt}
    </div>
  )
}
