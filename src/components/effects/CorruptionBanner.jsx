import { useEffect } from 'react'
import { useCorruptionFxStore } from '../../game/state/corruptionFxStore.js'

// A short, high-contrast notice when corruption rises. Static text (no animation); clears itself.
export default function CorruptionBanner() {
  const banner = useCorruptionFxStore((s) => s.banner)
  useEffect(() => {
    if (!banner) return undefined
    const id = setTimeout(() => useCorruptionFxStore.getState().clearBanner(banner.id), 4500)
    return () => clearTimeout(id)
  }, [banner])
  if (!banner) return null
  return (
    <div role="status" className="pointer-events-none absolute left-1/2 top-4 z-30 max-w-lg -translate-x-1/2 border-2 border-zinc-900 bg-zinc-100 px-4 py-2 text-center font-mono text-sm font-bold tracking-wide text-zinc-900">
      {banner.text}
    </div>
  )
}
