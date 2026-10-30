// unsupportedReason (optional): shows why the game can't run here and disables Start/Continue.
import { GAME_TAGLINE, GAME_TITLE } from '../../game/config/meta.js'

export default function MainMenu({ onStart, onContinue, continueLabel, onSettings, onCredits, unsupportedReason }) {
  const solid = 'rounded border-2 border-zinc-900 px-8 py-3 text-lg font-semibold hover:bg-zinc-900 hover:text-zinc-100'
  const quiet = 'rounded border-2 border-zinc-400 px-8 py-2 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-100'
  return (
    <main className="flex h-full flex-col items-center justify-center gap-5 bg-zinc-100 text-zinc-900">
      {/* a static, faint colour-split on the title: no animation, so nothing to switch off for reduced motion */}
      <h1 className="text-6xl font-bold tracking-tight [text-shadow:2px_0_rgba(239,68,68,0.35),-2px_0_rgba(59,130,246,0.35)]">{GAME_TITLE}</h1>
      <p className="mb-2 text-zinc-500">{GAME_TAGLINE}</p>
      {unsupportedReason && (
        <p role="alert" className="max-w-md rounded border-2 border-zinc-900 px-4 py-2 text-center text-sm font-semibold">
          {unsupportedReason}
        </p>
      )}
      {onContinue && (
        <button type="button" autoFocus disabled={Boolean(unsupportedReason)} onClick={onContinue} className={`${solid} disabled:cursor-not-allowed disabled:opacity-40`}>
          {continueLabel ?? 'Continue'}
        </button>
      )}
      <button type="button" autoFocus={!onContinue} disabled={Boolean(unsupportedReason)} onClick={onStart} className={`${onContinue ? quiet : solid} disabled:cursor-not-allowed disabled:opacity-40`}>
        {onContinue ? 'New game' : 'Start'}
      </button>
      {onSettings && (
        <button type="button" onClick={onSettings} className={quiet}>
          Settings
        </button>
      )}
      {onCredits && (
        <button type="button" onClick={onCredits} className={quiet}>
          Credits
        </button>
      )}
    </main>
  )
}
