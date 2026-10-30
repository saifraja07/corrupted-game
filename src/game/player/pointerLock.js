import { useSyncExternalStore } from 'react'

// Pointer lock must be requested from a user gesture (click). Failures are non-fatal:
// the "click to play" overlay lets the player retry.
export function requestGameLock() {
  const canvas = document.querySelector('canvas')
  if (!canvas || document.pointerLockElement) return
  try {
    const p = canvas.requestPointerLock()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  } catch {
    /* ignore */
  }
}

const subscribe = (cb) => {
  document.addEventListener('pointerlockchange', cb)
  return () => document.removeEventListener('pointerlockchange', cb)
}
const getSnapshot = () => Boolean(document.pointerLockElement)

export function usePointerLocked() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
