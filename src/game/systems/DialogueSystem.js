// Dialogue engine: no React, no DOM. Lines are plain data (see config/dialogue.js):
//   { id, trigger, text, priority?, duration?, cooldown?, queue?, level?, minStage?, maxStage? }
// Rules: higher priority interrupts the current line; otherwise lines queue (bounded) unless
// queue === false. Each trigger is rate-limited (cooldown) and a line can't repeat too soon, so
// rapid or repeated game events never spam the player. Multiple lines on one trigger rotate in order.

export function createDialogueSystem({
  lines = [],
  level,
  getStage = () => 0, // lines may set minStage/maxStage to appear only at certain corruption stages
  now = () => Date.now(),
  scheduler,
  maxQueue = 3,
  minRepeatMs = 4000,
  defaultCooldown = 1500,
} = {}) {
  const setTimer = scheduler?.set ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = scheduler?.clear ?? ((id) => clearTimeout(id))

  const byTrigger = new Map()
  const ids = new Set()
  for (const l of lines) {
    if (!l || typeof l.id !== 'string' || typeof l.text !== 'string') throw new Error('Dialogue line needs string id and text')
    if (ids.has(l.id)) throw new Error(`Duplicate dialogue id "${l.id}"`)
    ids.add(l.id)
    if (l.level && l.level !== level) continue // level-specific lines only load for their level
    if (!l.trigger) continue
    if (!byTrigger.has(l.trigger)) byTrigger.set(l.trigger, [])
    byTrigger.get(l.trigger).push(l)
  }

  let active = null
  let timer = null
  let queue = []
  const lastShownAt = new Map()
  const lastTriggerAt = new Map()
  const rotation = new Map()
  const subscribers = new Set()

  const priorityOf = (l) => l.priority ?? 1
  const notify = () => {
    for (const cb of [...subscribers]) {
      try {
        cb(active)
      } catch (err) {
        console.error('[dialogue] subscriber error', err)
      }
    }
  }
  const stopTimer = () => {
    if (timer !== null) clearTimer(timer)
    timer = null
  }

  function display(line) {
    stopTimer()
    active = line
    lastShownAt.set(line.id, now())
    timer = setTimer(expire, line.duration ?? 3000)
    notify()
  }

  function showNext() {
    if (queue.length === 0) {
      active = null
      notify()
      return
    }
    let best = 0 // highest priority first, FIFO among equals
    for (let i = 1; i < queue.length; i++) if (priorityOf(queue[i]) > priorityOf(queue[best])) best = i
    display(queue.splice(best, 1)[0])
  }

  function expire() {
    timer = null
    showNext()
  }

  // Returns 'shown' | 'queued' | false.
  function present(line) {
    if (!active) {
      display(line)
      return 'shown'
    }
    if (priorityOf(line) > priorityOf(active)) {
      display(line) // interrupts; the interrupted line is dropped
      return 'shown'
    }
    if (line.queue !== false && queue.length < maxQueue && !queue.some((q) => q.id === line.id) && active.id !== line.id) {
      queue.push(line)
      return 'queued'
    }
    return false
  }

  return {
    trigger(name) {
      const stage = getStage()
      const candidates = byTrigger.get(name)?.filter((l) => stage >= (l.minStage ?? 0) && stage <= (l.maxStage ?? 99))
      if (!candidates || candidates.length === 0) return false
      const t = now()
      const last = lastTriggerAt.get(name)
      if (last !== undefined && t - last < (candidates[0].cooldown ?? defaultCooldown)) return false
      const idx = rotation.get(name) ?? 0
      const line = candidates[idx % candidates.length]
      const shownAt = lastShownAt.get(line.id)
      if (shownAt !== undefined && t - shownAt < minRepeatMs) return false
      const result = present(line)
      if (result) {
        rotation.set(name, idx + 1)
        lastTriggerAt.set(name, t)
      }
      return result
    },
    // Show a one-off line directly (same priority/queue rules).
    say(line) {
      return present(line)
    },
    // Cancel the current line (or a specific id, including queued copies); the next queued line shows.
    cancel(id) {
      if (id) queue = queue.filter((q) => q.id !== id)
      if (active && (!id || active.id === id)) {
        stopTimer()
        showNext()
        return true
      }
      return false
    },
    // Full reset: current line, queue, timers, and rate-limit memory. Subscribers are kept.
    clear() {
      stopTimer()
      queue = []
      lastShownAt.clear()
      lastTriggerAt.clear()
      rotation.clear()
      if (active) {
        active = null
        notify()
      }
    },
    getActive: () => active,
    queueLength: () => queue.length,
    subscribe(cb) {
      subscribers.add(cb)
      return () => subscribers.delete(cb)
    },
  }
}
