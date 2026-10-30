import { describe, it, expect } from 'vitest'
import { create } from 'zustand'
import { bindAudio } from '../../src/game/systems/audioBridge.js'
import { createGameStore } from '../../src/game/state/gameStore.js'
import { DEFAULT_SETTINGS } from '../../src/game/core/GameConfig.js'
import { LEVELS } from '../../src/game/config/levels.js'

function setup() {
  const calls = []
  const rec = (name) => (...a) => calls.push([name, ...a])
  const audio = {
    unlock: rec('unlock'),
    play: rec('play'),
    setVolumes: rec('setVolumes'),
    startAmbient: rec('startAmbient'),
    stopAmbient: rec('stopAmbient'),
    duckAmbient: rec('duckAmbient'),
    setAmbientStage: rec('setAmbientStage'),
    stopAll: rec('stopAll'),
  }
  const gameStore = createGameStore()
  const settingsStore = create(() => ({ ...DEFAULT_SETTINGS }))
  const listeners = new Map()
  const doc = {
    addEventListener: (t, fn) => listeners.set(t, [...(listeners.get(t) ?? []), fn]),
    removeEventListener: (t, fn) => listeners.set(t, (listeners.get(t) ?? []).filter((f) => f !== fn)),
    emit: (t, e = {}) => [...(listeners.get(t) ?? [])].forEach((fn) => fn(e)),
    count: (t) => (listeners.get(t) ?? []).length,
  }
  const unbind = bindAudio({ audio, gameStore, settingsStore, doc })
  const names = () => calls.map((c) => c[0])
  const last = (name) => calls.filter((c) => c[0] === name).at(-1)
  return { calls, audio, gameStore, settingsStore, doc, unbind, names, last, clear: () => (calls.length = 0) }
}
const toPlaying = (g) => {
  g.getState().startGame('level01')
  g.getState().finishTransition()
}

describe('settings -> volumes', () => {
  it('applies the saved settings immediately and on every change', () => {
    const t = setup()
    expect(t.last('setVolumes')[1]).toEqual({ master: DEFAULT_SETTINGS.masterVolume, sfx: DEFAULT_SETTINGS.sfxVolume, ambient: DEFAULT_SETTINGS.ambientVolume, muted: false })
    t.settingsStore.setState({ masterVolume: 0.3, muted: true })
    expect(t.last('setVolumes')[1]).toMatchObject({ master: 0.3, muted: true })
  })
})

describe('game state -> audio', () => {
  it('follows the lifecycle: transition sound, ambient on play, duck on pause, jingle on completion', () => {
    const t = setup()
    t.clear()
    t.gameStore.getState().startGame('level01')
    expect(t.calls).toContainEqual(['play', 'transition'])
    expect(t.names()).toContain('stopAmbient')

    t.clear()
    t.gameStore.getState().finishTransition()
    expect(t.names()).toEqual(expect.arrayContaining(['duckAmbient', 'setAmbientStage', 'startAmbient']))
    expect(t.last('duckAmbient')[1]).toBe(false)

    t.clear()
    t.gameStore.getState().pause()
    expect(t.calls).toEqual([['duckAmbient', true]])

    t.clear()
    t.gameStore.getState().resume()
    expect(t.last('duckAmbient')[1]).toBe(false)
    expect(t.names()).toContain('startAmbient')

    t.clear()
    t.gameStore.getState().levelComplete()
    expect(t.calls).toContainEqual(['play', 'level_complete'])
    expect(t.names()).toContain('stopAmbient')
  })

  it('plays the ending sound on the ending and silences the menu', () => {
    const t = setup()
    t.gameStore.getState().startGame(LEVELS[LEVELS.length - 1].id) // the ending follows the LAST level
    t.gameStore.getState().finishTransition()
    t.gameStore.getState().levelComplete()
    t.clear()
    t.gameStore.getState().beginEnding()
    expect(t.calls).toContainEqual(['play', 'ending'])
    t.clear()
    t.gameStore.getState().quitToMenu()
    expect(t.names()).toContain('stopAmbient')
  })

  it('updates the ambient layer when the corruption stage changes (and only then)', () => {
    const t = setup()
    toPlaying(t.gameStore)
    t.clear()
    t.gameStore.getState().setCorruptionStage(2)
    expect(t.calls).toEqual([['setAmbientStage', 2]])
    t.clear()
    t.gameStore.getState().setObjective('x') // unrelated change
    expect(t.calls).toEqual([])
  })
})

describe('browser hooks', () => {
  it('unlocks on the first gesture, once, and removes its listeners', () => {
    const t = setup()
    t.doc.emit('pointerdown')
    t.doc.emit('keydown')
    expect(t.names().filter((n) => n === 'unlock')).toHaveLength(1)
    expect(t.doc.count('pointerdown')).toBe(0)
    expect(t.doc.count('keydown')).toBe(0)
  })
  it('plays a click for buttons only', () => {
    const t = setup()
    t.clear()
    t.doc.emit('click', { target: { closest: (sel) => (sel === 'button' ? {} : null) } })
    expect(t.calls).toEqual([['play', 'ui_click']])
    t.clear()
    t.doc.emit('click', { target: { closest: () => null } })
    t.doc.emit('click', { target: null })
    expect(t.calls).toEqual([])
  })
})

describe('unbind', () => {
  it('removes everything and stops audio; later changes are ignored', () => {
    const t = setup()
    t.unbind()
    expect(t.names().at(-1)).toBe('stopAll')
    expect(t.doc.count('click')).toBe(0)
    expect(t.doc.count('pointerdown')).toBe(0)
    t.clear()
    toPlaying(t.gameStore)
    t.settingsStore.setState({ masterVolume: 0.1 })
    expect(t.calls).toEqual([])
  })
})
