import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel16Logic } from '../../src/game/levels/level16/createLevel16Logic.js'
import { LEVEL16 } from '../../src/game/levels/level16/layout.js'
import { fillView } from '../../src/game/mechanics/lookAway.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const EYE_POS = { x: 0, y: 1.6, z: 0 }
const atEye = () => fillView({}, EYE_POS, -Math.PI / 2, 0) // yaw -90 degrees looks along +X, at the east wall
const awayFromEye = () => fillView({}, EYE_POS, Math.PI / 2, 0)
const nearEye = (degrees) => fillView({}, EYE_POS, -Math.PI / 2 + (degrees * Math.PI) / 180, 0)

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel16Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

// Frames of ~16 ms, like the scene.
const frames = (logic, view, ms) => {
  for (let t = 0; t < ms; t += 16) logic.update(view, 16)
}

describe('Level 16: Staring Contest', () => {
  it('is solved by holding the eye\'s gaze for six seconds, then using the door', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    frames(logic, atEye(), LEVEL16.stareRequiredMs + 100)
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL16.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('a stare that is too short does nothing', () => {
    const { logic } = setup()
    frames(logic, atEye(), LEVEL16.stareRequiredMs - 500)
    expect(logic.isUnlocked()).toBe(false)
    expect(logic.getStareProgress()).toBeGreaterThan(0.8)
  })

  it('looking away for more than a moment starts the contest over; a brief glance does not', () => {
    const { logic } = setup()
    frames(logic, atEye(), 3000)
    frames(logic, awayFromEye(), 100) // within the grace period
    frames(logic, atEye(), 3100)
    expect(logic.isUnlocked()).toBe(true)

    const second = setup().logic
    frames(second, atEye(), 3000)
    frames(second, awayFromEye(), 600) // beyond it
    expect(second.getStareProgress()).toBe(0)
    frames(second, atEye(), 3100)
    expect(second.isUnlocked()).toBe(false)
  })

  it('"looking at it" is a real cone: a few degrees off is fine, far off is not', () => {
    const { logic } = setup()
    frames(logic, nearEye(5), LEVEL16.stareRequiredMs + 100)
    expect(logic.isUnlocked()).toBe(true)
    const off = setup().logic
    frames(off, nearEye(40), LEVEL16.stareRequiredMs * 2)
    expect(off.isUnlocked()).toBe(false)
  })

  it('comments along the way, and calls you a coward for abandoning a long stare', () => {
    const { logic, messages } = setup()
    frames(logic, atEye(), LEVEL16.stare1Ms + 100)
    expect(messages).toContain('Stop that.')
    frames(logic, awayFromEye(), 600)
    vi.advanceTimersByTime(3000) // let the queued line play
    expect(messages).toContain('Coward.')
  })

  it('hints: it wants a staring contest, then the answer spelled out', () => {
    const { logic, messages } = setup()
    vi.advanceTimersByTime(LEVEL16.hint1Ms + 100)
    expect(messages).toContain('It wants a staring contest.')
    vi.advanceTimersByTime(LEVEL16.hint2Ms)
    expect(messages).toContain('Look at the eye. Do not look away. Six seconds.')
    expect(logic.isUnlocked()).toBe(false)
  })

  it('dispose leaves nothing behind', () => {
    const { logic } = setup()
    frames(logic, atEye(), 3000)
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(logic.getStareProgress()).toBe(0)
  })
})
