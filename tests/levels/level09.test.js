import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel09Logic } from '../../src/game/levels/level09/createLevel09Logic.js'
import { LEVEL09 } from '../../src/game/levels/level09/layout.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel09Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe('Level 9: Almost', () => {
  it('the obvious exit triggers the fake screen exactly once, and never completes the level', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useDecoy()).toBe(true) // first time: the scene shows the fake "Level complete"
    expect(logic.useDecoy()).toBe(false) // never again
    expect(logic.useDecoy()).toBe(false)
    expect(logic.getDecoyUses()).toBe(3)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.isExitDone()).toBe(false)
  })

  it('the real door is locked until you have fallen for the fake, so the fake cannot be skipped', () => {
    const { logic, messages } = setup()
    expect(logic.isRealUnlocked()).toBe(false)
    for (let i = 0; i < 5; i++) expect(logic.useRealExit()).toBe(false)
    expect(messages).toContain('Locked.')
    expect(logic.isExitDone()).toBe(false)
    logic.useDecoy()
    expect(logic.isRealUnlocked()).toBe(true)
  })

  it('falling for it unlocks the real door; using it completes the level once', () => {
    const { logic, messages, onLevelComplete } = setup()
    logic.useDecoy()
    vi.advanceTimersByTime(6000) // the fake screen takes a few seconds to run its course
    expect(logic.useRealExit()).toBe(true)
    expect(logic.useRealExit()).toBe(false)
    expect(messages).toContain('Fine. Go on, then.')
    expect(logic.isDoorOpen()).toBe(true)
    vi.advanceTimersByTime(LEVEL09.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('the gloating line arrives after the fake screen has run its course, and later decoy uses get remarks', () => {
    const { logic, messages } = setup()
    logic.useDecoy()
    vi.advanceTimersByTime(LEVEL09.fakeBackMs - 100)
    expect(messages).not.toContain('Did you really think it would be that easy?')
    vi.advanceTimersByTime(300)
    expect(messages).toContain('Did you really think it would be that easy?')
    vi.advanceTimersByTime(6000)
    logic.useDecoy()
    expect(messages.some((m) => m && /finished with you|Nothing there/.test(m))).toBe(true)
  })

  it('nobody is left guessing: a hint points at the obvious exit if it has not been tried for a minute', () => {
    const idle = setup()
    vi.advanceTimersByTime(LEVEL09.hintObviousMs - 100)
    expect(idle.messages).not.toContain('The obvious exit is right there. Use it.')
    vi.advanceTimersByTime(200)
    expect(idle.messages).toContain('The obvious exit is right there. Use it.')
    const active = setup()
    active.logic.useDecoy()
    vi.advanceTimersByTime(LEVEL09.hintObviousMs * 2)
    expect(active.messages).not.toContain('The obvious exit is right there. Use it.')
  })

  it('dispose leaves nothing behind, and a restarted level asks for the fake again', () => {
    const { logic, onLevelComplete } = setup()
    logic.useDecoy()
    logic.useRealExit()
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.useDecoy()).toBe(false) // stopped
    logic.start()
    expect(logic.isRealUnlocked()).toBe(false)
    expect(logic.useDecoy()).toBe(true) // the fake happens again
  })
})
