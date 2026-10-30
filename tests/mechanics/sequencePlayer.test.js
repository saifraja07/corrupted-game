import { describe, it, expect } from 'vitest'
import { createSequencePlayer } from '../../src/game/mechanics/sequencePlayer.js'

// Run the player and record which item is lit, sampled every `dt` ms.
function record(player, ms, dt = 20) {
  const lit = []
  for (let t = 0; t < ms; t += dt) {
    player.update(dt)
    const a = player.getActive()
    if (a !== null && lit[lit.length - 1] !== a) lit.push(a)
    else if (a === null && lit[lit.length - 1] !== null) lit.push(null)
  }
  return lit.filter((x) => x !== null)
}

describe('sequence player', () => {
  it('is idle until played, and shows nothing during the lead-in', () => {
    const p = createSequencePlayer({ sequence: [2, 0, 3, 1] })
    expect(p.isPlaying()).toBe(false)
    expect(p.getActive()).toBe(null)
    p.play(1000)
    expect(p.isPlaying()).toBe(true)
    p.update(500)
    expect(p.getActive()).toBe(null) // still waiting
  })
  it('lights each item in order, one at a time, then finishes', () => {
    const p = createSequencePlayer({ sequence: [2, 0, 3, 1], stepMs: 700, gapMs: 300 })
    p.play(0)
    expect(record(p, 5000)).toEqual([2, 0, 3, 1])
    expect(p.isPlaying()).toBe(false)
    expect(p.getActive()).toBe(null)
  })
  it('has a dark gap between items so repeated colors are distinguishable', () => {
    const p = createSequencePlayer({ sequence: [1, 1], stepMs: 700, gapMs: 300 })
    p.play(0)
    p.update(100)
    expect(p.getActive()).toBe(1)
    p.update(700) // 800 ms: inside the gap
    expect(p.getActive()).toBe(null)
    p.update(300) // 1100 ms: second item
    expect(p.getActive()).toBe(1)
  })
  it('does nothing when time is not fed to it (so it pauses with the game), and can restart or stop', () => {
    const p = createSequencePlayer({ sequence: [0, 1] })
    p.play(0)
    expect(p.getActive()).toBe(0)
    for (let i = 0; i < 100; i++) expect(p.getActive()).toBe(0) // frozen: no update calls
    p.update(1000)
    p.play(0) // restart from the top
    expect(p.getActive()).toBe(0)
    p.stop()
    expect(p.isPlaying()).toBe(false)
    p.update(1000)
    expect(p.getActive()).toBe(null)
  })
})
