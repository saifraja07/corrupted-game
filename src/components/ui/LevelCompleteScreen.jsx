import { useEffect, useRef, useState } from 'react'
import DialogueBox from './DialogueBox.jsx'
import { FAKE_LOADING_ERROR_MS, FAKE_LOADING_MS, fakeLoadingProgress } from '../../game/config/fakeouts.js'

const solid = 'rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100'
const quiet = 'rounded border-2 border-zinc-400 px-6 py-2 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-100'

// Keep the latest callback without restarting timers when the parent re-renders.
function useLatest(fn) {
  const ref = useRef(fn)
  useEffect(() => {
    ref.current = fn
  })
  return ref
}

// FAKE loading after a fake "Level complete": races to 90%, crawls, never reaches 100%.
function FakeLoading({ nextNumber, onDone, onQuit }) {
  const [ms, setMs] = useState(0)
  const done = useLatest(onDone)
  useEffect(() => {
    const id = setInterval(() => setMs((m) => m + 100), 100)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (ms >= FAKE_LOADING_MS) done.current()
  }, [ms, done])
  const pct = fakeLoadingProgress(ms)
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-zinc-100/95 text-zinc-900" role="dialog" aria-label="Loading">
      <h2 className="text-3xl font-bold">Loading level {nextNumber}...</h2>
      <div className="h-3 w-72 border-2 border-zinc-900" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full bg-zinc-900" style={{ width: `${pct}%` }} />
      </div>
      <p className="font-mono text-sm text-zinc-600">{pct}%</p>
      <button type="button" onClick={onQuit} className={quiet}>
        Main menu
      </button>
    </div>
  )
}

function FakeLoadError({ nextNumber, onDone, onQuit }) {
  const done = useLatest(onDone)
  useEffect(() => {
    const id = setTimeout(() => done.current(), FAKE_LOADING_ERROR_MS)
    return () => clearTimeout(id)
  }, [done])
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-100 text-center text-zinc-900" role="alertdialog" aria-label="Error">
      <h2 className="font-mono text-2xl font-bold">ERROR: LEVEL {nextNumber} NOT FOUND.</h2>
      <p className="text-zinc-600">You were not finished. Returning you to where you were.</p>
      <button type="button" onClick={onQuit} className={quiet}>
        Main menu
      </button>
    </div>
  )
}

// fake: this "Level complete" is a lie. Next level runs a fake loading bar, then an error, then onFakeResume()
// puts you straight back. Nothing is recorded. Main menu is always a real way out.
export default function LevelCompleteScreen({ levelNumber, levelName, hasNext, onNext, onFinish, onReplay, onQuit, fake = false, onFakeResume }) {
  const [phase, setPhase] = useState('idle') // idle | loading | error (fake only)
  if (fake && phase === 'loading') return <FakeLoading nextNumber={levelNumber + 1} onDone={() => setPhase('error')} onQuit={onQuit} />
  if (fake && phase === 'error') return <FakeLoadError nextNumber={levelNumber + 1} onDone={onFakeResume} onQuit={onQuit} />
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-zinc-100/95 text-zinc-900" role="dialog" aria-label="Level complete">
      <h2 className="text-4xl font-bold">Level {levelNumber} complete</h2>
      <p className="text-zinc-500">{levelName}</p>
      {hasNext ? (
        <button type="button" autoFocus onClick={fake ? () => setPhase('loading') : onNext} className={solid}>
          Next level
        </button>
      ) : (
        <button type="button" autoFocus onClick={onFinish} className={solid}>
          Continue
        </button>
      )}
      <button type="button" onClick={onReplay} className={quiet}>
        Play again
      </button>
      <button type="button" onClick={onQuit} className={quiet}>
        Main menu
      </button>
      <DialogueBox />
    </div>
  )
}
