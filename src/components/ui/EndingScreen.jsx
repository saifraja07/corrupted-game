import { useEffect, useRef, useState } from 'react'
import CreditsScreen from './CreditsScreen.jsx'
import { FAKE_CRASH_TEXT, FAKE_ENDING_TEXT, SECRET_TEXT, TRUE_ENDING_TEXT } from '../../game/config/ending.js'
import { FAKE_CRASH_MS } from '../../game/config/fakeouts.js'
import { ENDING_PAGES, canRevealSecret, nextPage } from '../../game/systems/endingFlow.js'

function TextPage({ title, lines, buttonLabel, onNext, children }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center text-zinc-900" role="dialog" aria-label={title}>
      <h2 className="text-4xl font-bold">{title}</h2>
      {lines.map((l) => (
        <p key={l} className="max-w-md text-lg text-zinc-600">
          {l}
        </p>
      ))}
      {children}
      <button type="button" autoFocus onClick={onNext} className="mt-4 rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100">
        {buttonLabel}
      </button>
    </div>
  )
}

// The false ending's "crash": a fake error that reveals itself after FAKE_CRASH_MS. Nobody is trapped:
// "Restart" works immediately, and "Main menu" is a real exit.
function CrashPage({ onContinue, onExit }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), FAKE_CRASH_MS)
    return () => clearTimeout(id)
  }, [])
  return (
    <TextPage title={FAKE_CRASH_TEXT.title} lines={FAKE_CRASH_TEXT.lines} buttonLabel="Restart" onNext={onContinue}>
      {revealed && <p className="max-w-md text-lg font-semibold text-zinc-900">{FAKE_CRASH_TEXT.reveal}</p>}
      <button type="button" onClick={onExit} className="rounded border-2 border-zinc-400 px-6 py-2 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-100">
        Main menu
      </button>
    </TextPage>
  )
}

// variant 'true': ending -> credits -> menu (secret ending hidden in the credits). onReveal fires when it is found.
// variant 'fake': ending -> credits -> crash -> onContinue (the game carries on). onExit is always a real way out.
export default function EndingScreen({ onExit, onReveal, onContinue, variant = 'true' }) {
  const [page, setPage] = useState(ENDING_PAGES.ENDING)
  const latest = useRef({ onExit, onContinue })
  useEffect(() => {
    latest.current = { onExit, onContinue }
  })
  const advance = () => {
    const next = nextPage(page, variant)
    if (next) setPage(next)
    else onExit()
  }
  if (page === ENDING_PAGES.SECRET) return <TextPage title={SECRET_TEXT.title} lines={SECRET_TEXT.lines} buttonLabel="Main menu" onNext={onExit} />
  if (page === ENDING_PAGES.CRASH) return <CrashPage onContinue={() => latest.current.onContinue?.()} onExit={() => latest.current.onExit()} />
  if (page === ENDING_PAGES.CREDITS) {
    return (
      <CreditsScreen
        doneLabel="Main menu" // in the fake ending this label is part of the lie
        onDone={advance}
        onSecret={
          canRevealSecret(page, variant)
            ? () => {
                onReveal?.()
                setPage(ENDING_PAGES.SECRET)
              }
            : undefined
        }
      />
    )
  }
  const text = variant === 'fake' ? FAKE_ENDING_TEXT : TRUE_ENDING_TEXT
  return <TextPage title={text.title} lines={text.lines} buttonLabel="Continue" onNext={advance} />
}
