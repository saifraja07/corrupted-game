import { useState } from 'react'
import CreditsScreen from './CreditsScreen.jsx'
import { ENDING_TEXT, SECRET_TEXT } from '../../game/config/ending.js'
import { ENDING_PAGES, canRevealSecret, nextPage } from '../../game/systems/endingFlow.js'

function TextPage({ title, lines, buttonLabel, onNext }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center text-zinc-900" role="dialog" aria-label={title}>
      <h2 className="text-4xl font-bold">{title}</h2>
      {lines.map((l) => (
        <p key={l} className="max-w-md text-lg text-zinc-600">
          {l}
        </p>
      ))}
      <button type="button" autoFocus onClick={onNext} className="mt-4 rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100">
        {buttonLabel}
      </button>
    </div>
  )
}

// Ending -> credits -> main menu, with a secret ending hidden in the credits. onReveal fires when it is found.
export default function EndingScreen({ onExit, onReveal }) {
  const [page, setPage] = useState(ENDING_PAGES.ENDING)
  const advance = () => {
    const next = nextPage(page)
    if (next) setPage(next)
    else onExit()
  }
  if (page === ENDING_PAGES.SECRET) return <TextPage title={SECRET_TEXT.title} lines={SECRET_TEXT.lines} buttonLabel="Main menu" onNext={onExit} />
  if (page === ENDING_PAGES.CREDITS) {
    return (
      <CreditsScreen
        doneLabel="Main menu"
        onDone={advance}
        onSecret={
          canRevealSecret(page)
            ? () => {
                onReveal?.()
                setPage(ENDING_PAGES.SECRET)
              }
            : undefined
        }
      />
    )
  }
  return <TextPage title={ENDING_TEXT.title} lines={ENDING_TEXT.lines} buttonLabel="Continue" onNext={advance} />
}
