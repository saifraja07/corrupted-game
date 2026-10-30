import { CREDITS } from '../../game/config/credits.js'
import { GAME_TAGLINE, GAME_TITLE } from '../../game/config/meta.js'

// onSecret (optional) adds a tiny hidden door at the bottom: the secret ending. It is only faint, not
// invisible, and is a real focusable button so keyboard players can find it too.
export default function CreditsScreen({ onDone, doneLabel = 'Back', onSecret }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center gap-6 overflow-y-auto bg-zinc-100 px-6 py-12 text-center text-zinc-900" role="dialog" aria-label="Credits">
      <h2 className="text-4xl font-bold">{GAME_TITLE}</h2>
      <p className="-mt-4 text-zinc-500">{GAME_TAGLINE}</p>
      {CREDITS.authors.length > 0 && <p className="text-lg font-semibold">{CREDITS.authors.join(', ')}</p>}
      {CREDITS.sections.map((section) => (
        <section key={section.heading} className="max-w-md">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-zinc-500">{section.heading}</h3>
          {section.items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </section>
      ))}
      <p className="text-zinc-500">{CREDITS.closing}</p>
      <button type="button" autoFocus onClick={onDone} className="rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100">
        {doneLabel}
      </button>
      {onSecret && (
        <button
          type="button"
          onClick={onSecret}
          aria-label="Exit"
          className="mt-10 h-10 w-6 rounded-sm border border-zinc-400 opacity-25 hover:opacity-100 focus-visible:opacity-100"
        />
      )}
    </div>
  )
}
