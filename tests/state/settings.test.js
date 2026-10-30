import { describe, it, expect } from 'vitest'
import { sanitizeSettings, loadSettings } from '../../src/game/state/settingsStore.js'
import { DEFAULT_SETTINGS } from '../../src/game/core/GameConfig.js'

describe('settings validation', () => {
  it('falls back to defaults on garbage', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ masterVolume: 'loud', muted: 'yes' })).toEqual(DEFAULT_SETTINGS)
  })
  it('clamps out-of-range numbers', () => {
    const s = sanitizeSettings({ masterVolume: 5, mouseSensitivity: -1 })
    expect(s.masterVolume).toBe(1)
    expect(s.mouseSensitivity).toBe(0.1)
  })
  it('survives corrupt JSON in storage', () => {
    const storage = { getItem: () => '{not json' }
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })
})
