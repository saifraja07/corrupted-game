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
import { requestGameLock } from '../game/player/pointerLock.js'
import { useGameStore } from '../game/state/gameStore.js'
import { useProgressStore } from '../game/state/progressStore.js'
import { getContinueLevelId } from '../game/state/progress.js'
import { getFirstLevelId, getLevel, getLevelNumber, getNextLevelId } from '../game/config/levels.js'
import { GAME_STATES as S } from '../game/core/GameConfig.js'
import { audio } from '../game/systems/audio.js'
import { bindAudio } from '../game/systems/audioBridge.js'

export default function App() {
  const status = useGameStore((s) => s.status)
  const levelId = useGameStore((s) => s.levelId)
  const completedLevelIds = useProgressStore((s) => s.completedLevelIds)
  const { startGame, finishTransition, pause, resume, restartLevel, nextLevel, beginEnding, quitToMenu } = useGameStore.getState()

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

  return (
    <div className="relative h-full w-full">
      <GameErrorBoundary onReset={quitToMenu}>
        <GameCanvas />
      </GameErrorBoundary>
      <GlitchOverlay />
      <CorruptionBanner />
      {status === S.PLAYING && <GameHUD />}
      {status === S.TRANSITIONING && <TransitionScreen onDone={finishTransition} />}
      {status === S.PAUSED &&
        (overlay === 'settings' ? (
          <SettingsMenu onBack={close} />
        ) : (
          <PauseMenu onResume={handleResume} onRestart={handleRestart} onSettings={() => show('settings')} onQuit={quitToMenu} />
        ))}
      {status === S.LEVEL_COMPLETE && (
        <LevelCompleteScreen
          levelNumber={getLevelNumber(levelId)}
          levelName={getLevel(levelId)?.name}
          hasNext={Boolean(getNextLevelId(levelId))}
          onNext={handleNext}
          onFinish={beginEnding}
          onReplay={handleRestart}
          onQuit={quitToMenu}
        />
      )}
    </div>
  )
}
