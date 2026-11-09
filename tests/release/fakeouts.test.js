import { describe, it, expect } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { createGameStore } from '../../src/game/state/gameStore.js'
import { createProgressStore } from '../../src/game/state/progressStore.js'
import { canTransition, isGameplayActive } from '../../src/game/core/GameLifecycle.js'
import { GAME_STATES as S } from '../../src/game/core/GameConfig.js'
import { LEVELS, getNextLevelId, hasFakeEnding } from '../../src/game/config/levels.js'
import { ENDING_PAGES, canRevealSecret, nextPage } from '../../src/game/systems/endingFlow.js'
import { FAKE_CRASH_TEXT, FAKE_ENDING_TEXT, TRUE_ENDING_TEXT } from '../../src/game/config/ending.js'
import EndingScreen from '../../src/components/ui/EndingScreen.jsx'
import LevelCompleteScreen from '../../src/components/ui/LevelCompleteScreen.jsx'

const FAKE_END_LEVEL = LEVELS.find((l) => l.fakeEnding).id
const playing = (id) => {
  const g = createGameStore()
  g.getState().startGame(id)
  g.getState().finishTransition()
  return g
}
const noop = () => {}

describe('the fake "Level complete" screen', () => {
  it('shows only while playing, records nothing, and hands you straight back', () => {
    const g = playing('level09')
    g.getState().markPuzzleComplete('p')
    const run = g.getState().runId
    expect(g.getState().fakeLevelComplete()).toBe(true)
    expect(g.getState().status).toBe(S.LEVEL_COMPLETE)
    expect(g.getState().fakeComplete).toBe(true)
    expect(g.getState().completedPuzzles).toEqual(['p']) // untouched
    expect(g.getState().resumeFromFake()).toBe(true)
    expect(g.getState().status).toBe(S.PLAYING)
    expect(g.getState().fakeComplete).toBe(false)
    expect(g.getState().levelId).toBe('level09') // same level, same run: the level was never reloaded
    expect(g.getState().runId).toBe(run)
  })

  it('cannot be started from anywhere but live play', () => {
    expect(createGameStore().getState().fakeLevelComplete()).toBe(false)
    const g = playing('level09')
    g.getState().pause()
    expect(g.getState().fakeLevelComplete()).toBe(false)
  })

  it('a REAL completion screen can never be "resumed" into the level', () => {
    const g = playing('level09')
    g.getState().levelComplete()
    expect(g.getState().fakeComplete).toBe(false)
    expect(g.getState().resumeFromFake()).toBe(false)
    expect(g.getState().status).toBe(S.LEVEL_COMPLETE)
  })

  it('while it is showing, nothing can skip ahead: no next level, no ending, no fake ending', () => {
    const g = playing(FAKE_END_LEVEL)
    g.getState().fakeLevelComplete()
    expect(g.getState().nextLevel()).toBe(false)
    expect(g.getState().beginEnding()).toBe(false)
    expect(g.getState().beginFakeEnding()).toBe(false)
  })

  it('there is always a real way out: restart and quit both work from it', () => {
    const a = playing('level09')
    a.getState().fakeLevelComplete()
    expect(a.getState().restartLevel()).toBe(true)
    expect(a.getState().fakeComplete).toBe(false)
    const b = playing('level09')
    b.getState().fakeLevelComplete()
    expect(b.getState().quitToMenu()).toBe(true)
    expect(b.getState().status).toBe(S.MAIN_MENU)
    expect(b.getState().fakeComplete).toBe(false)
  })

  it('a real completion afterwards works normally and clears the flag', () => {
    const g = playing('level09')
    g.getState().fakeLevelComplete()
    g.getState().resumeFromFake()
    expect(g.getState().levelComplete()).toBe(true)
    expect(g.getState().nextLevel()).toBe(true)
    expect(g.getState().fakeComplete).toBe(false)
  })

  it('never writes progress: that only happens through the real completion path', () => {
    const progress = createProgressStore({ completedLevelIds: [] })
    const g = playing('level01')
    g.getState().fakeLevelComplete()
    g.getState().resumeFromFake()
    expect(progress.getState().completedLevelIds).toEqual([]) // nothing in the game store touches it
  })

  it('shows as an ordinary completion screen, with a Next level button and a real Main menu', () => {
    const props = { levelNumber: 9, levelName: 'Almost', hasNext: true, onNext: noop, onFinish: noop, onReplay: noop, onQuit: noop, fake: true, onFakeResume: noop }
    const html = renderToString(h(LevelCompleteScreen, props))
    expect(html).toMatch(/Level\D*9\D*complete/) // server rendering splits the number into its own text node
    for (const text of ['Almost', 'Next level', 'Play again', 'Main menu']) expect(html).toContain(text)
  })
})

describe('the false ending', () => {
  const complete = (id) => {
    const g = playing(id)
    g.getState().levelComplete()
    return g
  }

  it('is flagged on exactly one level, and that level has somewhere to go afterwards', () => {
    expect(LEVELS.filter((l) => l.fakeEnding)).toHaveLength(1)
    expect(hasFakeEnding(FAKE_END_LEVEL)).toBe(true)
    expect(getNextLevelId(FAKE_END_LEVEL)).not.toBe(null)
  })

  it('begins only on that level\'s completion screen', () => {
    expect(complete(FAKE_END_LEVEL).getState().beginFakeEnding()).toBe(true)
    expect(complete('level01').getState().beginFakeEnding()).toBe(false)
    expect(playing(FAKE_END_LEVEL).getState().beginFakeEnding()).toBe(false)
    expect(createGameStore().getState().beginFakeEnding()).toBe(false)
  })

  it('carries on to the next level, fresh, when it is over', () => {
    const g = complete(FAKE_END_LEVEL)
    g.getState().beginFakeEnding()
    const run = g.getState().runId
    expect(g.getState().status).toBe(S.FAKE_ENDING)
    expect(g.getState().endFakeEnding()).toBe(true)
    expect(g.getState().status).toBe(S.TRANSITIONING)
    expect(g.getState().levelId).toBe(getNextLevelId(FAKE_END_LEVEL))
    expect(g.getState().runId).toBe(run + 1)
    expect(g.getState().finishTransition()).toBe(true)
    expect(g.getState().endFakeEnding()).toBe(false) // only possible during the fake ending
  })

  it('is no trap: quitting to the menu works throughout, and it never leads straight back into play', () => {
    const g = complete(FAKE_END_LEVEL)
    g.getState().beginFakeEnding()
    expect(canTransition(S.FAKE_ENDING, S.PLAYING)).toBe(false)
    expect(canTransition(S.FAKE_ENDING, S.PAUSED)).toBe(false)
    expect(isGameplayActive(S.FAKE_ENDING)).toBe(false)
    expect(g.getState().quitToMenu()).toBe(true)
    expect(g.getState().status).toBe(S.MAIN_MENU)
  })

  it('does not stop the real ending from happening after the real last level', () => {
    const last = LEVELS[LEVELS.length - 1].id
    const g = complete(last)
    expect(g.getState().beginFakeEnding()).toBe(false)
    expect(g.getState().beginEnding()).toBe(true)
    expect(g.getState().status).toBe(S.ENDING)
  })

  it('is a different journey from the true ending: it crashes, and has no secret', () => {
    expect(nextPage(ENDING_PAGES.ENDING, 'fake')).toBe(ENDING_PAGES.CREDITS)
    expect(nextPage(ENDING_PAGES.CREDITS, 'fake')).toBe(ENDING_PAGES.CRASH)
    expect(nextPage(ENDING_PAGES.CRASH, 'fake')).toBe(null)
    expect(nextPage(ENDING_PAGES.CREDITS, 'true')).toBe(null)
    expect(canRevealSecret(ENDING_PAGES.CREDITS, 'fake')).toBe(false)
    expect(canRevealSecret(ENDING_PAGES.CREDITS, 'true')).toBe(true)
  })

  it('opens like an ending, with its own words, and the true ending has different ones', () => {
    const fake = renderToString(h(EndingScreen, { variant: 'fake', onExit: noop, onContinue: noop }))
    expect(fake).toContain(FAKE_ENDING_TEXT.title)
    expect(fake).not.toContain(TRUE_ENDING_TEXT.title)
    const real = renderToString(h(EndingScreen, { onExit: noop }))
    expect(real).toContain(TRUE_ENDING_TEXT.title)
    expect(FAKE_CRASH_TEXT.reveal.length).toBeGreaterThan(10)
  })

  it('the Level 8 completion screen offers Continue (not Next level), leading to it', () => {
    const props = { levelNumber: 8, levelName: 'The Last Room', hasNext: false, onNext: noop, onFinish: noop, onReplay: noop, onQuit: noop }
    const html = renderToString(h(LevelCompleteScreen, props))
    expect(html).toContain('Continue')
    expect(html).not.toContain('Next level')
  })
})
