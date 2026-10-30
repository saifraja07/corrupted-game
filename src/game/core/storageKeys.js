// localStorage keys. The game was previously named "Brain.exe"; saved settings and progress used
// legacy keys. Loaders read the new key first and fall back to the legacy one, so nobody's save is lost.
// This is the only file allowed to mention the old name (a test enforces it).
export const STORAGE = Object.freeze({
  settings: 'corrupted:settings:v1',
  progress: 'corrupted:progress:v1',
})

export const LEGACY_STORAGE = Object.freeze({
  settings: 'brain-exe:settings:v1',
  progress: 'brain-exe:progress:v1',
})

// Read `key`, or the legacy key if the new one has never been written. Returns a string or null.
export function readWithLegacyFallback(storage, key, legacyKey) {
  return storage?.getItem(key) ?? storage?.getItem(legacyKey) ?? null
}
