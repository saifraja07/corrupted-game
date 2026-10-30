// Can this browser run the game? Checked once at startup so unsupported devices get a clear message
// instead of a blank screen. Pure: the document is injectable for tests.
export function detectSupport(doc = globalThis.document) {
  if (!doc) return { ok: false, reason: 'No browser environment was found.' }
  try {
    const canvas = doc.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return { ok: false, reason: 'This browser or device does not support WebGL, which the game needs to draw its 3D rooms.' }
  } catch {
    return { ok: false, reason: 'WebGL could not be started in this browser.' }
  }
  if (typeof doc.documentElement?.requestPointerLock !== 'function') {
    return { ok: false, reason: 'This game needs a desktop browser with a mouse (pointer lock is not available here).' }
  }
  return { ok: true, reason: null }
}
