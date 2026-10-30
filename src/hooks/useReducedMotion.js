import { useSyncExternalStore } from 'react'
import { useSettingsStore } from '../game/state/settingsStore.js'

const QUERY = '(prefers-reduced-motion: reduce)'
const subscribe = (cb) => {
  const mq = globalThis.matchMedia?.(QUERY)
  mq?.addEventListener?.('change', cb)
  return () => mq?.removeEventListener?.('change', cb)
}
const getSnapshot = () => Boolean(globalThis.matchMedia?.(QUERY).matches)

// True if the OS asks for reduced motion OR the in-game setting is on. Animated effects must honor it.
export function useReducedMotion() {
  const system = useSyncExternalStore(subscribe, getSnapshot, () => false)
  const setting = useSettingsStore((s) => s.reducedMotion)
  return system || setting
}
