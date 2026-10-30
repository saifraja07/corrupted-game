import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel06Logic } from '../../src/game/levels/level06/createLevel06Logic.js'
import { LEVEL06, BUTTONS } from '../../src/game/levels/level06/layout.js'
import { CORRECT_BUTTON, SIGN_BUTTON, BUTTON_COUNT } from '../../src/game/levels/level06/lightsOutPuzzle.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const FRAME = 1000 / 60
function setup() {
  const messages = []
  const events = []
  const onLevelComplete = vi.fn()
  const logic = createLevel06Logic({
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
// Play `ms` of game time, returning when the glow was visible (seconds).
function play(logic, ms) {
  const glowTimes = []
  for (let t = 0; t < ms; t += FRAME) {
    logic.update(FRAME)
    vi.advanceTimersByTime(FRAME)
    if (logic.isGlowVisible()) glowTimes.push(t / 1000)
  }
  return glowTimes
}

describe('Level 6: the design is fair', () => {
  it('the sign lies: it names a button that is not the answer', () => {
    expect(SIGN_BUTTON).not.toBe(CORRECT_BUTTON)
    expect(LEVEL06.signText).toBe(`PRESS THE ${BUTTONS[SIGN_BUTTON].name} BUTTON.`)
    expect(BUTTONS[CORRECT_BUTTON].x).toBe(LEVEL06.glow.x) // the glow hangs over the real button
    expect(BUTTONS).toHaveLength(BUTTON_COUNT)
  })

  it('the room is lit at first, goes dark on a schedule, and the glow shows only when it is properly dark', () => {
    const { logic } = setup()
    expect(play(logic, LEVEL06.cycle.firstMs - 500)).toEqual([]) // nothing before the first blackout
    const glow = play(logic, 12000)
    expect(glow.length).toBeGreaterThan(0)
    const visibleFor = glow.length * FRAME
    expect(visibleFor).toBeGreaterThanOrEqual(5000) // long enough to notice (~half a fade + hold + half a fade)
    expect(logic.isGlowVisible()).toBe(false) // gone again once the lights are back
    expect(logic.getDarkness()).toBe(0)
  })

  it('the blackouts keep coming, so the answer is never more than ~22 s away', () => {
    const { logic } = setup()
    const glow = play(logic, 3 * 60000)
    const bursts = glow.filter((t, i) => i === 0 || t - glow[i - 1] > 1)
    expect(bursts.length).toBeGreaterThanOrEqual(7)
  })
})

describe('Level 6: solving it', () => {
  it('the glowing button solves it, then the door opens and the level completes once', () => {
    const { logic, onLevelComplete, messages } = setup()
    expect(logic.pressButton(CORRECT_BUTTON)).toBe(true)
    expect(logic.isUnlocked()).toBe(true)
    expect(messages).toContain('Oh. You found it.')
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL06.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
    expect(logic.isDoorOpen()).toBe(true)
  })

  it('doing what the sign says never works, however many times, and never locks you out', () => {
    const { logic } = setup()
    for (let i = 0; i < 20; i++) logic.pressButton(SIGN_BUTTON)
    expect(logic.isUnlocked()).toBe(false)
    expect(logic.getWrongCount()).toBe(20)
    logic.pressButton(CORRECT_BUTTON)
    expect(logic.isUnlocked()).toBe(true) // still solvable
  })

  it('the door stays locked (with a line) until the right button is pressed', () => {
    const { logic, messages, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    expect(messages).toContain('Locked.')
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
  })

  it('ignores buttons that do not exist', () => {
    const { logic } = setup()
    for (const bad of [-1, 3, 1.5, NaN, undefined]) expect(logic.pressButton(bad)).toBe(false)
    expect(logic.getWrongCount()).toBe(0)
  })
})

describe('Level 6: nobody is left waiting in the dark (or the light)', () => {
  it('the second wrong press calls a blackout straight away, with a hint, long before the scheduled one', () => {
    const { logic, messages, events } = setup()
    logic.pressButton(SIGN_BUTTON)
    expect(logic.isBlackout()).toBe(false) // one mistake: nothing yet
    logic.pressButton(SIGN_BUTTON)
    expect(logic.isBlackout()).toBe(true)
    expect(events).toContain('hint_dark')
    expect(events.filter((e) => e === 'blackout_start')).toHaveLength(1)
    const glow = play(logic, 8000)
    expect(glow.length).toBeGreaterThan(0) // the mark appears within seconds
    expect(glow[0]).toBeLessThan(5)
    expect(messages).toContain('Some things are easier to see in the dark.')
  })

  it('a wrong press during a blackout does not restart or duplicate it', () => {
    const { logic, events } = setup()
    play(logic, LEVEL06.cycle.firstMs + 2000) // a scheduled blackout is underway
    const before = events.filter((e) => e === 'blackout_start').length
    logic.pressButton(SIGN_BUTTON)
    logic.pressButton(SIGN_BUTTON) // would call a blackout, but one is already running
    expect(events.filter((e) => e === 'blackout_start').length).toBe(before)
  })

  it('every blackout announces itself (so it can have a sound)', () => {
    const { logic, events } = setup()
    play(logic, 60000)
    expect(events.filter((e) => e === 'blackout_start').length).toBeGreaterThanOrEqual(3)
  })
})

describe('Level 6: cleanup', () => {
  it('dispose restores the light, leaves no timers, and restart begins again from the first delay', () => {
    const { logic, onLevelComplete } = setup()
    play(logic, LEVEL06.cycle.firstMs + 3000)
    expect(logic.getDarkness()).toBeGreaterThan(0)
    logic.pressButton(CORRECT_BUTTON)
    logic.useExit()
    logic.dispose()
    expect(logic.getDarkness()).toBe(0)
    expect(logic.isBlackout()).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(onLevelComplete).not.toHaveBeenCalled()
    expect(logic.pressButton(CORRECT_BUTTON)).toBe(false) // stopped
    logic.start()
    expect(logic.isUnlocked()).toBe(false)
    expect(play(logic, LEVEL06.cycle.firstMs - 500)).toEqual([])
  })
})
