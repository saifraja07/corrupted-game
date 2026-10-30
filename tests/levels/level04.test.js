import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel04Logic } from '../../src/game/levels/level04/createLevel04Logic.js'
import { LEVEL04 } from '../../src/game/levels/level04/layout.js'
import { fillView } from '../../src/game/mechanics/lookAway.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const eye = { x: 0, y: 1.6, z: 0 }
const facingSign = () => fillView({}, eye, -Math.PI / 2, 0) // sign is on the right wall (+X)
const lookingAway = () => fillView({}, eye, Math.PI / 2, 0) // toward -X

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel04Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}
const fakeExit = (logic, times) => {
  for (let i = 0; i < times; i++) {
    expect(logic.useFakeExit()).toBe(true) // true => the scene teleports the player back
    vi.advanceTimersByTime(4000) // let dialogue cooldowns pass
  }
}

describe('Level 4: The Wrong Exit', () => {
  it('starts with a misleading sign, and the fake exit never completes the level', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.getSignText()).toBe('THE EXIT IS ON THE LEFT.')
    fakeExit(logic, 5)
    expect(logic.getFakeExitCount()).toBe(5)
    expect(logic.isExitDone()).toBe(false)
    vi.advanceTimersByTime(20000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('the real exit always works, even after many fake exits and without any sign change', () => {
    const { logic, onLevelComplete } = setup()
    fakeExit(logic, 6)
    expect(logic.useRealExit()).toBe(true)
    expect(logic.useRealExit()).toBe(false) // no duplicate completion
    expect(logic.useFakeExit()).toBe(false) // fake door inert once solved
    expect(logic.isDoorOpen()).toBe(true)
    vi.advanceTimersByTime(LEVEL04.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('can be solved immediately by trying the other door', () => {
    const { logic } = setup()
    expect(logic.useRealExit()).toBe(true)
    expect(logic.getFakeExitCount()).toBe(0)
  })

  it('the sign changes after the 2nd fake exit, but only while the player is NOT looking at it', () => {
    const { logic, messages } = setup()
    fakeExit(logic, 1)
    logic.update(lookingAway())
    expect(logic.getSignStage()).toBe(0) // not yet: only one fake exit

    fakeExit(logic, 1)
    logic.update(facingSign()) // watching
    logic.update(facingSign())
    expect(logic.getSignStage()).toBe(0)
    expect(logic.getSignText()).toBe('THE EXIT IS ON THE LEFT.')

    logic.update(lookingAway()) // looks away -> transformation happens
    expect(logic.getSignStage()).toBe(1)
    expect(logic.getSignText()).toBe('THE EXIT IS ON THE RIGHT.')
    expect(messages).toContain('Did that sign always say that?')
  })

  it('the sign change happens exactly once', () => {
    const { logic, messages } = setup()
    fakeExit(logic, 2)
    logic.update(lookingAway())
    fakeExit(logic, 2)
    logic.update(lookingAway())
    expect(logic.getSignStage()).toBe(1)
    expect(messages.filter((m) => m === 'Did that sign always say that?')).toHaveLength(1)
  })

  it('changing the displayed text never alters the real rules', () => {
    const { logic } = setup()
    fakeExit(logic, 2)
    logic.update(lookingAway())
    expect(logic.getFakeExitCount()).toBe(2)
    expect(logic.isExitDone()).toBe(false)
    expect(logic.useRealExit()).toBe(true)
  })
})

describe('Level 4 cleanup', () => {
  it('dispose drops pending sign changes and timers; restart begins with the original sign', () => {
    const { logic, onLevelComplete } = setup()
    fakeExit(logic, 2) // sign change queued, never applied
    logic.useRealExit()
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()

    logic.start()
    logic.update(lookingAway()) // stale queued change must not apply
    expect(logic.getSignStage()).toBe(0)
    expect(logic.getFakeExitCount()).toBe(0)
    expect(logic.isDoorOpen()).toBe(false)
  })
  it('a stopped level ignores input', () => {
    const { logic } = setup()
    logic.dispose()
    expect(logic.useFakeExit()).toBe(false)
    expect(logic.useRealExit()).toBe(false)
  })
})
