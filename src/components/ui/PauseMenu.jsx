export default function PauseMenu({ onResume, onRestart, onSettings, onQuit }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-zinc-900/70 text-zinc-100" role="dialog" aria-label="Paused">
      <h2 className="text-3xl font-bold">Paused</h2>
      <button type="button" autoFocus onClick={onResume} className="rounded border-2 border-zinc-100 px-6 py-2 font-semibold hover:bg-zinc-100 hover:text-zinc-900">
        Resume
      </button>
      <button type="button" onClick={onRestart} className="rounded border-2 border-zinc-400 px-6 py-2 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-900">
        Restart level
      </button>
      {onSettings && (
        <button type="button" onClick={onSettings} className="rounded border-2 border-zinc-400 px-6 py-2 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-900">
          Settings
        </button>
      )}
      <button type="button" onClick={onQuit} className="rounded border-2 border-zinc-400 px-6 py-2 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-900">
        Quit to menu
      </button>
    </div>
  )
}
