import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { createLevel12Logic } from '../../src/game/levels/level12/createLevel12Logic.js'
import { LEVEL12 } from '../../src/game/levels/level12/layout.js'
import { registerMetaExit, triggerMetaExit, useMetaExitStore } from '../../src/game/state/metaExit.js'
import PauseMenu from '../../src/components/ui/PauseMenu.jsx'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel12Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe('Level 12: Exit', () => {
  it('the exit is available from the very first second: only finding it is hard', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useMetaExit()).toBe(true)
    expect(logic.useMetaExit()).toBe(false) // no duplicate completion
    vi.advanceTimersByTime(LEVEL12.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('every painted door is just a wall, however often you try them', () => {
    const { logic, messages, onLevelComplete } = setup()
    for (let round = 0; round < 8; round++) {
      LEVEL12.doorwayXs.forEach((_, i) => expect(logic.probeDoorway(i)).toBe(true))
      vi.advanceTimersByTime(3000)
    }
    expect(logic.getProbes()).toBe(8 * LEVEL12.doorwayXs.length)
    expect(logic.isExitDone()).toBe(false)
    expect(messages.some((m) => m && /That's a wall|Nope|Still a wall/.test(m))).toBe(true)
    vi.advanceTimersByTime(600000)
    expect(onLevelComplete).not.toHaveBeenCalledTimes(1)
  })

  it('ignores doorways that do not exist', () => {
    const { logic } = setup()
    for (const bad of [-1, 3, 1.5, NaN, undefined]) expect(logic.probeDoorway(bad)).toBe(false)
    expect(logic.getProbes()).toBe(0)
  })

  it('three hints escalate, and the last one says exactly what to do', () => {
    const { logic, messages } = setup()
    vi.advanceTimersByTime(LEVEL12.hint1Ms + 200)
    expect(messages).toContain('There is no door.')
    expect(messages).not.toContain('Press Escape. Then choose EXIT.')
    vi.advanceTimersByTime(LEVEL12.hint2Ms - LEVEL12.hint1Ms)
    expect(messages).toContain('Where do you go when you want out?')
    vi.advanceTimersByTime(LEVEL12.hint3Ms - LEVEL12.hint2Ms)
    expect(messages).toContain('Press Escape. Then choose EXIT.')
    expect(logic.isExitDone()).toBe(false)
  })

  it('hints stop once you have found it', () => {
    const { logic, messages } = setup()
    logic.useMetaExit()
    vi.advanceTimersByTime(LEVEL12.hint3Ms * 2)
    expect(messages).not.toContain('Press Escape. Then choose EXIT.')
    expect(messages).toContain('There it is.')
  })

  it('hints are spaced so each can be read, and get more direct', () => {
    expect(LEVEL12.hint1Ms).toBeLessThan(LEVEL12.hint2Ms)
    expect(LEVEL12.hint2Ms).toBeLessThan(LEVEL12.hint3Ms)
    expect(LEVEL12.hint3Ms).toBeLessThanOrEqual(180000) // a stuck player is told within three minutes
  })

  it('dispose leaves nothing behind and a restart is pristine', () => {
    const { logic, onLevelComplete } = setup()
    logic.probeDoorway(0)
    logic.useMetaExit()
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(600000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.useMetaExit()).toBe(false) // stopped
    logic.start()
    expect(logic.getProbes()).toBe(0)
    expect(logic.isExitDone()).toBe(false)
  })
})

describe('the pause menu EXIT bridge', () => {
  it('is unavailable until a level registers, then available, then gone again when it leaves', () => {
    expect(useMetaExitStore.getState().available).toBe(false)
    expect(triggerMetaExit()).toBe(false)
    const off = registerMetaExit(() => true)
    expect(useMetaExitStore.getState().available).toBe(true)
    expect(triggerMetaExit()).toBe(true)
    off()
    expect(useMetaExitStore.getState().available).toBe(false)
    expect(triggerMetaExit()).toBe(false)
  })
  it('a newer registration replaces an older one, and a stale unregister cannot remove it', () => {
    const offOld = registerMetaExit(() => false)
    const offNew = registerMetaExit(() => true)
    offOld() // e.g. React StrictMode tearing down the first mount
    expect(useMetaExitStore.getState().available).toBe(true)
    expect(triggerMetaExit()).toBe(true)
    offNew()
    expect(useMetaExitStore.getState().available).toBe(false)
  })
  it('reports whatever the level says (a level that refuses does not complete)', () => {
    const off = registerMetaExit(() => false)
    expect(triggerMetaExit()).toBe(false)
    off()
  })
  it('the real level logic works through the bridge', () => {
    const { logic, onLevelComplete } = setup()
    const off = registerMetaExit(() => logic.useMetaExit())
    expect(triggerMetaExit()).toBe(true)
    vi.advanceTimersByTime(LEVEL12.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
    off()
  })
})

describe('the pause menu', () => {
  const noop = () => {}
  const base = { onResume: noop, onRestart: noop, onSettings: noop, onQuit: noop }
  it('offers EXIT only when the level provides one, and never loses the normal Quit to menu', () => {
    const without = renderToString(h(PauseMenu, base))
    expect(without).not.toContain('>EXIT<')
    expect(without).toContain('Quit to menu')
    const withExit = renderToString(h(PauseMenu, { ...base, onMetaExit: noop }))
    expect(withExit).toContain('>EXIT<')
    expect(withExit).toContain('Quit to menu') // quitting for real is always still possible
    expect(withExit).toContain('Resume')
  })
})
