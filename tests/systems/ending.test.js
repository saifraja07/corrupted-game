import { describe, it, expect } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { ENDING_PAGES, canRevealSecret, nextPage } from '../../src/game/systems/endingFlow.js'
import { createGameStore } from '../../src/game/state/gameStore.js'
import { canTransition, isGameplayActive } from '../../src/game/core/GameLifecycle.js'
import { sanitizeSettings } from '../../src/game/state/settingsStore.js'
import { DEFAULT_SETTINGS, GAME_STATES as S } from '../../src/game/core/GameConfig.js'
import { LEVELS } from '../../src/game/config/levels.js'
import SettingsMenu from '../../src/components/ui/SettingsMenu.jsx'
import CreditsScreen from '../../src/components/ui/CreditsScreen.jsx'
import EndingScreen from '../../src/components/ui/EndingScreen.jsx'
import MainMenu from '../../src/components/ui/MainMenu.jsx'
import PauseMenu from '../../src/components/ui/PauseMenu.jsx'
import LevelCompleteScreen from '../../src/components/ui/LevelCompleteScreen.jsx'

const FIRST = LEVELS[0].id
const LAST = LEVELS[LEVELS.length - 1].id
const noop = () => {}
const atComplete = (id) => {
  const g = createGameStore()
  g.getState().startGame(id)
  g.getState().finishTransition()
  g.getState().levelComplete()
  return g
}

describe('ending flow', () => {
  it('goes ending -> credits -> menu; the secret is only reachable from the credits', () => {
    expect(nextPage(ENDING_PAGES.ENDING)).toBe(ENDING_PAGES.CREDITS)
    expect(nextPage(ENDING_PAGES.CREDITS)).toBe(null)
    expect(nextPage(ENDING_PAGES.SECRET)).toBe(null)
    expect(canRevealSecret(ENDING_PAGES.CREDITS)).toBe(true)
    expect(canRevealSecret(ENDING_PAGES.ENDING)).toBe(false)
    expect(canRevealSecret(ENDING_PAGES.SECRET)).toBe(false)
  })
})

describe('ENDING game state', () => {
  it('is reachable only from the completion screen of the LAST level', () => {
    expect(atComplete(LAST).getState().beginEnding()).toBe(true)
    expect(atComplete(FIRST).getState().beginEnding()).toBe(false) // more levels remain
    const playing = createGameStore()
    playing.getState().startGame(LAST)
    playing.getState().finishTransition()
    expect(playing.getState().beginEnding()).toBe(false) // not at the completion screen
    expect(createGameStore().getState().beginEnding()).toBe(false)
  })
  it('only leads back to the main menu, and never has live gameplay', () => {
    expect(canTransition(S.ENDING, S.MAIN_MENU)).toBe(true)
    for (const s of [S.PLAYING, S.PAUSED, S.TRANSITIONING, S.LEVEL_COMPLETE, S.ENDING]) expect(canTransition(S.ENDING, s)).toBe(false)
    expect(isGameplayActive(S.ENDING)).toBe(false)
  })
  it('cannot begin twice, restart, or advance once the ending has started', () => {
    const g = atComplete(LAST)
    expect(g.getState().beginEnding()).toBe(true)
    expect(g.getState().beginEnding()).toBe(false)
    expect(g.getState().restartLevel()).toBe(false)
    expect(g.getState().nextLevel()).toBe(false)
    expect(g.getState().quitToMenu()).toBe(true)
    expect(g.getState().status).toBe(S.MAIN_MENU)
  })
})

describe('new audio settings', () => {
  it('default, validate and clamp', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS.sfxVolume).toBeGreaterThan(0)
    const s = sanitizeSettings({ sfxVolume: 9, ambientVolume: -1 })
    expect(s.sfxVolume).toBe(1)
    expect(s.ambientVolume).toBe(0)
    expect(sanitizeSettings({ sfxVolume: 'loud' }).sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume)
  })
  it('old saves without the new fields still load with defaults', () => {
    const s = sanitizeSettings({ masterVolume: 0.4, mouseSensitivity: 2, muted: false, reducedMotion: true })
    expect(s.masterVolume).toBe(0.4)
    expect(s.sfxVolume).toBe(DEFAULT_SETTINGS.sfxVolume)
  })
})

describe('screens (server render)', () => {
  it('settings menu exposes every control with a real label', () => {
    const html = renderToString(h(SettingsMenu, { onBack: noop }))
    for (const label of ['Master volume', 'Effects volume', 'Ambient volume', 'Mute all sound', 'Mouse sensitivity', 'Reduce motion', 'Back']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('type="range"')
    expect(html).toContain('type="checkbox"')
  })
  it('credits list what the game is built with and its original audio', () => {
    const html = renderToString(h(CreditsScreen, { onDone: noop }))
    expect(html).toContain('Built with')
    expect(html).toContain('Howler.js')
    expect(html).toContain('original')
  })
  it('the hidden exit exists only when a secret handler is supplied, and is a labeled button', () => {
    expect(renderToString(h(CreditsScreen, { onDone: noop }))).not.toContain('aria-label="Exit"')
    const html = renderToString(h(CreditsScreen, { onDone: noop, onSecret: noop }))
    expect(html).toContain('aria-label="Exit"')
    expect(html).toContain('<button')
  })
  it('the ending opens on its first page, not the secret', () => {
    const html = renderToString(h(EndingScreen, { onExit: noop }))
    expect(html).toContain('Exit found.')
    expect(html).toContain('Continue')
    expect(html).not.toContain('There was never a door.')
  })
  it('main and pause menus link to settings; credits only on the main menu', () => {
    const main = renderToString(h(MainMenu, { onStart: noop, onSettings: noop, onCredits: noop }))
    expect(main).toContain('Settings')
    expect(main).toContain('Credits')
    const bare = renderToString(h(MainMenu, { onStart: noop }))
    expect(bare).not.toContain('Settings')
    expect(renderToString(h(PauseMenu, { onResume: noop, onRestart: noop, onSettings: noop, onQuit: noop }))).toContain('Settings')
  })
  it('the last level offers Continue (to the ending) instead of Next level', () => {
    const base = { levelNumber: 4, levelName: 'x', onNext: noop, onFinish: noop, onReplay: noop, onQuit: noop }
    const last = renderToString(h(LevelCompleteScreen, { ...base, hasNext: false }))
    expect(last).toContain('Continue')
    expect(last).not.toContain('Next level')
    expect(renderToString(h(LevelCompleteScreen, { ...base, hasNext: true }))).toContain('Next level')
  })
})
