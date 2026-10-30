import { describe, it, expect } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import MainMenu from '../../src/components/ui/MainMenu.jsx'
import PauseMenu from '../../src/components/ui/PauseMenu.jsx'
import LevelCompleteScreen from '../../src/components/ui/LevelCompleteScreen.jsx'
import DialogueBox from '../../src/components/ui/DialogueBox.jsx'
import InteractionPrompt from '../../src/components/ui/InteractionPrompt.jsx'

const noop = () => {}

describe('UI renders (server-side smoke test)', () => {
  it('main menu has a Start button', () => {
    expect(renderToString(h(MainMenu, { onStart: noop }))).toContain('Start')
  })
  it('pause menu offers resume, restart and quit', () => {
    const html = renderToString(h(PauseMenu, { onResume: noop, onRestart: noop, onQuit: noop }))
    for (const label of ['Resume', 'Restart level', 'Quit to menu']) expect(html).toContain(label)
  })
  it('level complete screen shows the level, offers next/replay/menu', () => {
    const props = { levelNumber: 1, levelName: 'The Obvious Door', hasNext: true, onNext: noop, onReplay: noop, onQuit: noop }
    const html = renderToString(h(LevelCompleteScreen, props))
    for (const text of ['The Obvious Door', 'Next level', 'Play again', 'Main menu']) expect(html).toContain(text)
  })
  it('the last level has no Next button', () => {
    const props = { levelNumber: 2, levelName: 'The Easy Part', hasNext: false, onNext: noop, onReplay: noop, onQuit: noop }
    expect(renderToString(h(LevelCompleteScreen, props))).not.toContain('Next level')
  })
  it('main menu shows Continue only when there is something to continue', () => {
    expect(renderToString(h(MainMenu, { onStart: noop }))).not.toContain('Continue')
    const html = renderToString(h(MainMenu, { onStart: noop, onContinue: noop, continueLabel: 'Continue (Level 2)' }))
    expect(html).toContain('Continue (Level 2)')
    expect(html).toContain('New game')
  })
  // Server rendering always sees a store's initial state, so only the empty states are checkable here.
  it('dialogue box and interaction prompt render nothing when idle', () => {
    expect(renderToString(h(DialogueBox))).toBe('')
    expect(renderToString(h(InteractionPrompt))).toBe('')
  })
})

describe('module graph', () => {
  it('the app, scene and level modules all import without errors', async () => {
    const mods = await Promise.all([
      import('../../src/app/App.jsx'),
      import('../../src/app/GameCanvas.jsx'),
      import('../../src/game/levels/Level01.jsx'),
      import('../../src/game/levels/Level02.jsx'),
      import('../../src/game/levels/Level03.jsx'),
      import('../../src/game/levels/Level04.jsx'),
      import('../../src/game/levels/Level05.jsx'),
      import('../../src/game/levels/Level06.jsx'),
      import('../../src/game/levels/Level07.jsx'),
      import('../../src/game/levels/Level08.jsx'),
      import('../../src/components/ui/GameHUD.jsx'),
    ])
    for (const m of mods) expect(typeof m.default).toBe('function')
  })
})
