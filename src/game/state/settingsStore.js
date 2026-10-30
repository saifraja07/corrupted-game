import { create } from 'zustand'
import { DEFAULT_SETTINGS } from '../core/GameConfig.js'
import { LEGACY_STORAGE, STORAGE, readWithLegacyFallback } from '../core/storageKeys.js'

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

// Validate untrusted data (localStorage); fall back per-field to defaults.
export function sanitizeSettings(raw) {
  const d = DEFAULT_SETTINGS
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    masterVolume: isNum(r.masterVolume) ? clamp(r.masterVolume, 0, 1) : d.masterVolume,
    sfxVolume: isNum(r.sfxVolume) ? clamp(r.sfxVolume, 0, 1) : d.sfxVolume,
    ambientVolume: isNum(r.ambientVolume) ? clamp(r.ambientVolume, 0, 1) : d.ambientVolume,
    mouseSensitivity: isNum(r.mouseSensitivity) ? clamp(r.mouseSensitivity, 0.1, 3) : d.mouseSensitivity,
    muted: typeof r.muted === 'boolean' ? r.muted : d.muted,
    reducedMotion: typeof r.reducedMotion === 'boolean' ? r.reducedMotion : d.reducedMotion,
  }
}

export function loadSettings(storage = globalThis.localStorage) {
  try {
    const text = readWithLegacyFallback(storage, STORAGE.settings, LEGACY_STORAGE.settings)
    return sanitizeSettings(text ? JSON.parse(text) : null)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function save(settings) {
  try {
    globalThis.localStorage?.setItem(STORAGE.settings, JSON.stringify(settings))
  } catch {
    /* storage unavailable or full; settings just won't persist */
  }
}

export const useSettingsStore = create((set, get) => ({
  ...loadSettings(),
  updateSettings: (patch) => {
    const s = get()
    const current = Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((k) => [k, s[k]]))
    const next = sanitizeSettings({ ...current, ...patch })
    set(next)
    save(next)
  },
}))
