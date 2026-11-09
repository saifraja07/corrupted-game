import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLevel15Logic } from '../../src/game/levels/level15/createLevel15Logic.js'
import { LEVEL15 } from '../../src/game/levels/level15/layout.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const AT_WALL = { x: -(LEVEL15.room.width / 2) + PLAYER.radius, z: 0 } // as close as collision lets the player get
const MIDDLE = { x: 0, z: 0 }

function setup() {
  const messages = []
  const onLevelComplete = vi.fn()
  const logic = createLevel15Logic({ onMessage: (l) => messages.push(l ? l.text : null), onLevelComplete })
  logic.start()
  return { logic, messages, onLevelComplete }
}

describe('Level 15: Lean In', () => {
  it('the wall position is reachable: the real closest approach counts as leaning', () => {
    expect(AT_WALL.x).toBeLessThanOrEqual(LEVEL15.leanX)
  })

  it('is solved by staying against the west wall long enough, then using the door', () => {
    const { logic, onLevelComplete } = setup()
    expect(logic.useExit()).toBe(false)
    logic.update(AT_WALL, LEVEL15.leanRequiredMs + 10)
    expect(logic.isUnlocked()).toBe(true)
    expect(logic.useExit()).toBe(true)
    expect(logic.useExit()).toBe(false)
    vi.advanceTimersByTime(LEVEL15.completeDelayMs + 10)
    expect(onLevelComplete).toHaveBeenCalledTimes(1)
  })

  it('builds up over many frames, and leaving the wall starts the count again', () => {
    const { logic } = setup()
    for (let t = 0; t < 4000; t += 16) logic.update(AT_WALL, 16)
    expect(logic.isUnlocked()).toBe(false)
    logic.update(MIDDLE, 16)
    expect(logic.getLeanMs()).toBe(0)
    for (let t = 0; t < 4000; t += 16) logic.update(AT_WALL, 16)
    expect(logic.isUnlocked()).toBe(false) // 4 s again, not 8
    for (let t = 0; t < 1200; t += 16) logic.update(AT_WALL, 16)
    expect(logic.isUnlocked()).toBe(true)
  })

  it('only the west wall counts: the east wall, the back wall and the middle do nothing', () => {
    const { logic } = setup()
    for (const p of [{ x: 3.7, z: 0 }, { x: 0, z: -5.7 }, { x: 0, z: 5.7 }, MIDDLE]) logic.update(p, LEVEL15.leanRequiredMs * 2)
    expect(logic.isUnlocked()).toBe(false)
  })

  it('asks what you are doing after a moment, only once', () => {
    const { logic, messages } = setup()
    logic.update(AT_WALL, LEVEL15.beginMs + 10)
    logic.update(AT_WALL, 100)
    logic.update(MIDDLE, 16)
    logic.update(AT_WALL, LEVEL15.beginMs + 10)
    expect(messages.filter((m) => m === 'What are you doing?')).toHaveLength(1)
  })

  it('hints: touch the walls, then the answer spelled out', () => {
    const { logic, messages } = setup()
    vi.advanceTimersByTime(LEVEL15.hint1Ms + 100)
    expect(messages).toContain('Have you tried touching the walls?')
    vi.advanceTimersByTime(LEVEL15.hint2Ms)
    expect(messages).toContain('Stand against the west wall. Stay there.')
    expect(logic.isUnlocked()).toBe(false)
  })

  it('no hints once the wall has given way', () => {
    const { logic, messages } = setup()
    logic.update(AT_WALL, LEVEL15.leanRequiredMs + 10)
    vi.advanceTimersByTime(LEVEL15.hint2Ms + 1000)
    expect(messages).not.toContain('Have you tried touching the walls?')
  })

  it('dispose leaves nothing behind', () => {
    const { logic } = setup()
    logic.update(AT_WALL, 2000)
    logic.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(logic.getLeanMs()).toBe(0)
  })
})
