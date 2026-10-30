// Reusable puzzle lifecycle. No React, no Three.js: fully testable.
//
// A puzzle DEFINITION is plain data + functions:
//   {
//     id: 'obvious-door',
//     createState: () => ({ ... }),                 // fresh state; called on init and on every reset
//     handlers: { eventType: (state, payload, api) => void },   // may mutate its own state
//     isComplete: (state) => boolean,
//     isFailed?: (state) => boolean,
//     getProgress?: (state) => number (0..1),
//     onInit?, onActivate?, onReset?, onCleanup?: (api) => void,
//   }
// `api` offered to handlers/hooks: { getData(), emit(type, payload), after(ms, fn), cancel(id) }.
// Timers created with api.after() are cancelled on completion, reset and cleanup, and only fire
// while the puzzle is active, so no stray timer outlives its level.

export const PUZZLE_STATUS = Object.freeze({
  CREATED: 'created',
  INITIALIZED: 'initialized',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISPOSED: 'disposed',
})
const ST = PUZZLE_STATUS

export function validatePuzzleDefinition(def) {
  if (!def || typeof def !== 'object') throw new Error('Puzzle definition must be an object')
  if (typeof def.id !== 'string' || !def.id) throw new Error('Puzzle definition needs a string id')
  if (typeof def.createState !== 'function') throw new Error(`Puzzle "${def.id}" needs createState()`)
  if (typeof def.isComplete !== 'function') throw new Error(`Puzzle "${def.id}" needs isComplete()`)
  if (!def.handlers || typeof def.handlers !== 'object') throw new Error(`Puzzle "${def.id}" needs handlers`)
  return def
}

export function createPuzzle(def, { scheduler } = {}) {
  validatePuzzleDefinition(def)
  const setTimer = scheduler?.set ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = scheduler?.clear ?? ((id) => clearTimeout(id))

  let status = ST.CREATED
  let data = null
  const listeners = new Map() // type -> Set<cb>; '*' receives (type, payload)
  const timers = new Set()

  const safe = (fn, ...args) => {
    try {
      return fn(...args)
    } catch (err) {
      console.error(`[puzzle:${def.id}]`, err) // a buggy puzzle must not crash the game loop
      return undefined
    }
  }

  function emit(type, payload) {
    const direct = listeners.get(type)
    if (direct) for (const cb of [...direct]) safe(cb, payload)
    const any = listeners.get('*')
    if (any) for (const cb of [...any]) safe(cb, type, payload)
  }

  function clearTimers() {
    for (const id of timers) clearTimer(id)
    timers.clear()
  }

  const api = {
    getData: () => data,
    emit,
    after(ms, fn) {
      const id = setTimer(() => {
        timers.delete(id)
        if (status === ST.ACTIVE) safe(fn)
      }, ms)
      timers.add(id)
      return id
    },
    cancel(id) {
      if (timers.delete(id)) clearTimer(id)
    },
  }

  function evaluate() {
    if (def.getProgress) emit('progress', safe(def.getProgress, data))
    if (def.isFailed && safe(def.isFailed, data)) {
      status = ST.FAILED
      clearTimers()
      emit('failed', { id: def.id })
    } else if (safe(def.isComplete, data)) {
      status = ST.COMPLETED // latch: a completed puzzle ignores further events, so it fires once
      clearTimers()
      emit('completed', { id: def.id })
    }
  }

  return {
    id: def.id,
    get status() {
      return status
    },
    getData: () => data,

    init() {
      if (status !== ST.CREATED) return false
      data = def.createState()
      status = ST.INITIALIZED
      if (def.onInit) safe(def.onInit, api)
      return true
    },
    activate() {
      if (status !== ST.INITIALIZED) return false
      status = ST.ACTIVE
      if (def.onActivate) safe(def.onActivate, api)
      return true
    },
    // Returns true if a handler ran. Ignored unless active.
    dispatch(type, payload) {
      if (status !== ST.ACTIVE) return false
      const handler = def.handlers[type]
      if (typeof handler !== 'function') return false
      safe(handler, data, payload, api)
      evaluate()
      return true
    },
    // Back to a pristine, inactive state (call activate() to play again).
    reset() {
      if (status === ST.CREATED || status === ST.DISPOSED) return false
      clearTimers()
      data = def.createState()
      status = ST.INITIALIZED
      if (def.onReset) safe(def.onReset, api)
      emit('reset', { id: def.id })
      return true
    },
    // Permanent teardown: timers, listeners and state are released. Idempotent.
    cleanup() {
      if (status === ST.DISPOSED) return false
      clearTimers()
      if (def.onCleanup) safe(def.onCleanup, api)
      status = ST.DISPOSED
      data = null
      listeners.clear()
      return true
    },
    // Subscribe to 'completed' | 'failed' | 'progress' | 'reset' | custom (e.g. 'dialogue') | '*'.
    on(type, cb) {
      if (status === ST.DISPOSED) return () => {}
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(cb)
      return () => listeners.get(type)?.delete(cb)
    },
  }
}
