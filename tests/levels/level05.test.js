import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel05Logic } from '../../src/game/levels/level05/createLevel05Logic.js'
import { COLORS, LEVEL05 } from '../../src/game/levels/level05/layout.js'
import { SEQUENCE, SIGN_ORDER, COLOR_COUNT } from '../../src/game/levels/level05/sequencePuzzle.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup() {
  const messages = []
  const events = []
  const onLevelComplete = vi.fn()
  const logic = createLevel05Logic({
    onMessage: (l) => messages.push(l ? l.text : null),
    onGameEvent: (name) => {
      events.push(name)
      return null
    },
    onLevelComplete,
  })
  logic.start()
  return { logic, messages, events, onLevelComplete }
}

// Watch the lamps for `ms` and return the order they lit in (what a player would see).
function watchLamps(logic, ms) {
  const seen = []
  for (let t = 0; t < ms; t += 20) {
    logic.update(20)
    for (let i = 0; i < COLOR_COUNT; i++) {
      if (logic.getLampLevel(i) === 1 && seen[seen.length - 1] !== i) seen.push(i)
    }
    if (COLOR_COUNT && [0, 1, 2, 3].every((i) => logic.getLampLevel(i) === 0)) seen.push(null)
  }
  return seen.filter((x) => x !== null)
}

describe('Level 5: the design is fair', () => {
  it('the sign lies: its order is not the answer, and following it fails on the very first press', () => {
    expect(SEQUENCE).not.toEqual(SIGN_ORDER)
    expect(SEQUENCE[0]).not.toBe(SIGN_ORDER[0])
    expect(new Set(SEQUENCE).size).toBe(COLOR_COUNT) // every color used once
    expect(LEVEL05.signText).toBe(`PRESS: ${SIGN_ORDER.map((i) => COLORS[i].name).join(', ')}.`)
  })

  it('the lamps tell the truth: on their own they play exactly the solution', () => {
    const { logic } = setup()
    expect(watchLamps(logic, LEVEL05.introLeadMs + 6000)).toEqual([...SEQUENCE])
  })

  it('replay shows the same sequence again, any time, at no cost', () => {
    const { logic } = setup()
    watchLamps(logic, LEVEL05.introLeadMs + 6000) // intro finished
    expect(logic.isReplaying()).toBe(false)
    logic.pressColor(SEQUENCE[0])
    expect(logic.replay()).toBe(true)
    expect(watchLamps(logic, 6000)).toEqual([...SEQUENCE])
    expect(logic.getProgress()).toBe(1) // replaying did not reset the player's progress
    expect(logic.getWrongCount()).toBe(0)
  })
})

describe('Level 5: solving it', () => {
  it('pressing the lamp order solves it, the door then opens, and the level completes once', () => {
    const { logic, onLevelComplete, messages } = setup()
    for (const c of SEQUENCE) expect(logic.pressColor(c)).toBe(true)
    expect(logic.isSolved()).toBe(true)
    expect(messages).toContain('That was not what the sign said.')
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    expect(logic.isDoorOpen()).toBe(true)
    vi.advanceTimersByTime(LEVEL05.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('following the sign never works, however many times, and never locks you out', () => {
    const { logic } = setup()
    for (let round = 0; round < 10; round++) for (const c of SIGN_ORDER) logic.pressColor(c)
    expect(logic.isSolved()).toBe(false)
    expect(logic.getWrongCount()).toBeGreaterThan(5)
    for (const c of SEQUENCE) logic.pressColor(c) // still perfectly solvable afterwards
    expect(logic.isSolved()).toBe(true)
  })

  it('a mistake only resets progress; correct presses in between do not carry over', () => {
    const { logic } = setup()
    logic.pressColor(SEQUENCE[0])
    logic.pressColor(SEQUENCE[1])
    expect(logic.getProgress()).toBe(2)
    logic.pressColor(SEQUENCE[0]) // wrong here (should be index 2)
    expect(logic.getProgress()).toBe(0)
    expect(logic.getWrongCount()).toBe(1)
  })

  it('the door refuses (with a line) until the order is right', () => {
    const { logic, messages, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    expect(messages).toContain('The door wants the order first.')
    vi.advanceTimersByTime(30000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('ignores impossible button numbers', () => {
    const { logic } = setup()
    for (const bad of [-1, 4, 1.5, NaN, undefined]) expect(logic.pressColor(bad)).toBe(false)
    expect(logic.getWrongCount()).toBe(0)
  })
})

describe('Level 5: help arrives, and the game reacts to struggling', () => {
  it('after three mistakes the lamps replay by themselves and a hint appears', () => {
    const { logic, messages, events } = setup()
    watchLamps(logic, LEVEL05.introLeadMs + 6000)
    expect(logic.isReplaying()).toBe(false)
    const wrong = SIGN_ORDER[0] // red: wrong as the first press
    logic.pressColor(wrong)
    logic.pressColor(wrong)
    expect(logic.isReplaying()).toBe(false) // two mistakes: no help yet
    logic.pressColor(wrong)
    expect(logic.isReplaying()).toBe(true) // the third triggers a replay
    expect(events).toContain('hint_lamps')
    vi.advanceTimersByTime(5000)
    expect(messages).toContain('Perhaps the lamps have something to say.')
    expect(watchLamps(logic, 6000)).toEqual([...SEQUENCE])
  })

  it('every correct step announces itself (so it can click), and mistakes sound different', () => {
    const { logic, events } = setup()
    logic.pressColor(SEQUENCE[0]) // correct first press
    const wrongSecond = [0, 1, 2, 3].find((c) => c !== SEQUENCE[1]) // genuinely wrong at step two
    logic.pressColor(wrongSecond)
    expect(events).toContain('sequence_step')
    expect(events).toContain('sequence_wrong')
  })

  it('a pressed button lights its lamp briefly, then it goes dark again', () => {
    const { logic } = setup()
    logic.pressColor(2)
    expect(logic.getLampLevel(2)).toBeGreaterThan(0)
    expect(logic.getLampLevel(3)).toBe(0)
    logic.update(LEVEL05.flashMs + 10)
    expect(logic.getLampLevel(2)).toBe(0)
  })
})

describe('Level 5: cleanup', () => {
  it('dispose stops the lamps, the timers and any pending completion; restart is pristine', () => {
    const { logic, onLevelComplete } = setup()
    logic.pressColor(2)
    for (const c of SEQUENCE) logic.pressColor(c)
    logic.useExit()
    logic.dispose()
    expect(logic.isReplaying()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.pressColor(SEQUENCE[0])).toBe(false) // stopped
    logic.start()
    expect(logic.isSolved()).toBe(false)
    expect(logic.getProgress()).toBe(0)
    expect(logic.isReplaying()).toBe(true) // the intro plays again
  })
})
