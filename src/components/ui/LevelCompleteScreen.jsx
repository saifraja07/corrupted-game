import DialogueBox from './DialogueBox.jsx'

export default function LevelCompleteScreen({ levelNumber, levelName, hasNext, onNext, onFinish, onReplay, onQuit }) {
  const solid = 'rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100'
  const quiet = 'rounded border-2 border-zinc-400 px-6 py-2 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-100'
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-zinc-100/95 text-zinc-900" role="dialog" aria-label="Level complete">
      <h2 className="text-4xl font-bold">Level {levelNumber} complete</h2>
      <p className="text-zinc-500">{levelName}</p>
      {hasNext ? (
        <button type="button" autoFocus onClick={onNext} className={solid}>
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
