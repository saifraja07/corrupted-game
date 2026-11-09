import { useEffect, useState } from 'react'
import { useCorruptionFxStore } from '../../game/state/corruptionFxStore.js'
import { FAKE_ERROR, FAKE_ERROR_TOTAL_MS } from '../../game/config/fakeouts.js'
import { GAME_TITLE } from '../../game/config/meta.js'

// A fake "not responding" window: bait. It sits in a corner, never takes focus or clicks (pointer-events
// none), the game keeps running underneath, and it reveals "just kidding" and disappears by itself within
// FAKE_ERROR_TOTAL_MS. Keyed by id so each new one starts fresh.
function Dialog({ id }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), FAKE_ERROR.checkingMs)
    const t2 = setTimeout(() => useCorruptionFxStore.getState().clearFakeError(id), FAKE_ERROR_TOTAL_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [id])
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-6 right-6 z-30 w-72 border-2 border-zinc-900 bg-zinc-100 font-mono text-xs text-zinc-900 shadow-lg">
      <div className="bg-zinc-900 px-2 py-1 font-bold text-zinc-100">{GAME_TITLE}</div>
      <div className="px-3 py-3">
        {revealed ? (
          <p className="font-bold">Just kidding.</p>
        ) : (
          <>
            <p className="font-bold">{GAME_TITLE} is not responding.</p>
            <p className="mt-1 text-zinc-600">Checking for a solution...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function FakeErrorDialog() {
  const fake = useCorruptionFxStore((s) => s.fakeError)
  return fake ? <Dialog key={fake.id} id={fake.id} /> : null
}
