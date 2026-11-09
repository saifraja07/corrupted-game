import { useEffect, useMemo, useState } from 'react'
import GameCanvas from './GameCanvas.jsx'
import GameErrorBoundary from '../components/ui/GameErrorBoundary.jsx'
import { detectSupport } from '../game/core/support.js'
import MainMenu from '../components/ui/MainMenu.jsx'
import PauseMenu from '../components/ui/PauseMenu.jsx'
import SettingsMenu from '../components/ui/SettingsMenu.jsx'
import CreditsScreen from '../components/ui/CreditsScreen.jsx'
import EndingScreen from '../components/ui/EndingScreen.jsx'
import TransitionScreen from '../components/ui/TransitionScreen.jsx'
import LevelCompleteScreen from '../components/ui/LevelCompleteScreen.jsx'
import GameHUD from '../components/ui/GameHUD.jsx'
import GlitchOverlay from '../components/effects/GlitchOverlay.jsx'
import CorruptionBanner from '../components/effects/CorruptionBanner.jsx'
import FakeErrorDialog from '../components/effects/FakeErrorDialog.jsx'
import { requestGameLock } from '../game/player/pointerLock.js'
import { useGameStore } from '../game/state/gameStore.js'
import { useProgressStore } from '../game/state/progressStore.js'
import { triggerMetaExit, useMetaExitStore } from '../game/state/metaExit.js'
import { getContinueLevelId } from '../game/state/progress.js'
import { getFirstLevelId, getLevel, getLevelNumber, getNextLevelId, hasFakeEnding } from '../game/config/levels.js'
import { GAME_STATES as S } from '../game/core/GameConfig.js'
import { audio } from '../game/systems/audio.js'
import { bindAudio } from '../game/systems/audioBridge.js'

export default function App() {
  const status = useGameStore((s) => s.status)
  const levelId = useGameStore((s) => s.levelId)
  const fakeComplete = useGameStore((s) => s.fakeComplete)
  const metaExitAvailable = useMetaExitStore((s) => s.available)
  const completedLevelIds = useProgressStore((s) => s.completedLevelIds)
  const { startGame, finishTransition, pause, resume, restartLevel, nextLevel, beginEnding, beginFakeEnding, endFakeEnding, resumeFromFake, quitToMenu } = useGameStore.getState()

  const support = useMemo(() => detectSupport(), [])

  // Which sub-screen (settings/credits) is open. Tied to the status it was opened in, so it can never
  // linger into a different game state.
  const [open, setOpen] = useState({ status: null, name: null })
  const overlay = open.status === status ? open.name : null
  const show = (name) => setOpen({ status, name })
  const close = () => setOpen({ status: null, name: null })

  // Audio follows the game via stores; unbinds (and silences) on unmount.
  useEffect(() => bindAudio({ audio }), [])

  // Escape toggles pause. (Pointer-lock exit also pauses; see Player.)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.repeat) return
      const { status: st } = useGameStore.getState()
      if (st === S.PLAYING) pause()
      else if (st === S.PAUSED) resume()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pause, resume])

  // Resume/restart/next clicks are user gestures, so pointer lock can be re-entered here.
  const handleResume = () => {
    if (resume()) requestGameLock()
  }
  const handleRestart = () => {
    if (restartLevel()) requestGameLock()
  }
  const handleNext = () => {
    if (nextLevel()) requestGameLock()
  }
  // The final level's real exit lives in the pause menu: take it, then go back to the game to watch it complete.
  const handleMetaExit = () => {
    if (triggerMetaExit() && resume()) requestGameLock()
  }
  const handleFakeResume = () => {
    if (resumeFromFake()) requestGameLock() // the fake "complete" screen is over: back to the level
  }

  if (status === S.MAIN_MENU) {
    if (overlay === 'settings') return <SettingsMenu onBack={close} />
    if (overlay === 'credits') return <CreditsScreen onDone={close} />
    const continueId = getContinueLevelId(completedLevelIds)
    return (
      <MainMenu
        onStart={() => startGame(getFirstLevelId())}
        onContinue={continueId ? () => startGame(continueId) : undefined}
        continueLabel={continueId ? `Continue (Level ${getLevelNumber(continueId)})` : undefined}
        onSettings={() => show('settings')}
        onCredits={() => show('credits')}
        unsupportedReason={support.reason}
      />
    )
  }

  // The ending is DOM-only; the 3D scene is unmounted to free the GPU.
  if (status === S.ENDING) return <EndingScreen onExit={quitToMenu} onReveal={() => audio.play('secret')} />
  // The FALSE ending: credits that turn out not to be the end. "Restart" carries on to the next level.
  if (status === S.FAKE_ENDING) return <EndingScreen variant="fake" onExit={quitToMenu} onContinue={endFakeEnding} />

  return (
    <div className="relative h-full w-full">
      <GameErrorBoundary onReset={quitToMenu}>
        <GameCanvas />
      </GameErrorBoundary>
      <GlitchOverlay />
      <CorruptionBanner />
      <FakeErrorDialog />
      {status === S.PLAYING && <GameHUD />}
      {status === S.TRANSITIONING && <TransitionScreen onDone={finishTransition} />}
      {status === S.PAUSED &&
        (overlay === 'settings' ? (
          <SettingsMenu onBack={close} />
        ) : (
          <PauseMenu onResume={handleResume} onRestart={handleRestart} onSettings={() => show('settings')} onQuit={quitToMenu} onMetaExit={metaExitAvailable ? handleMetaExit : undefined} />
        ))}
      {status === S.LEVEL_COMPLETE && (
        <LevelCompleteScreen
          levelNumber={getLevelNumber(levelId)}
          levelName={getLevel(levelId)?.name}
          fake={fakeComplete}
          onFakeResume={handleFakeResume}
          hasNext={fakeComplete || (Boolean(getNextLevelId(levelId)) && !hasFakeEnding(levelId))}
          onNext={handleNext}
          onFinish={hasFakeEnding(levelId) ? beginFakeEnding : beginEnding}
          onReplay={handleRestart}
          onQuit={quitToMenu}
        />
      )}
    </div>
  )
}
