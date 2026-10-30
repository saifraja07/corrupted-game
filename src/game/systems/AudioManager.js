import { Howl, Howler } from 'howler'
import {
  AMBIENT_CORRUPT,
  AMBIENT_DUCK,
  AMBIENT_FADE_MS,
  AMBIENT_ROOM,
  AMBIENT_STAGE_FADE_MS,
  AUDIO_BASE_URL,
  CORRUPT_LAYER_BY_STAGE,
  EVENT_SOUNDS,
  SOUNDS,
} from '../config/audio.js'

const defaultCreateHowl = (src, opts) => new Howl({ src: [src], ...opts })
const clamp01 = (n) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0)

// Central audio. No React. Sounds load lazily on first use; a missing/broken file is skipped quietly.
// Nothing plays until unlock() (called from a real user gesture) to respect browser autoplay rules.
// Dependencies are injectable so tests run without any audio hardware.
export function createAudioManager({
  sounds = SOUNDS,
  eventSounds = EVENT_SOUNDS,
  createHowl = defaultCreateHowl,
  resumeContext = () => Howler.ctx?.resume?.(),
  baseUrl = AUDIO_BASE_URL,
  now = () => Date.now(),
  scheduler,
  warn = (...a) => console.warn(...a),
} = {}) {
  const setTimer = scheduler?.set ?? ((fn, ms) => setTimeout(fn, ms))
  const clearTimer = scheduler?.clear ?? ((id) => clearTimeout(id))

  const volumes = { master: 0.8, sfx: 1, ambient: 0.7, muted: false }
  const entries = new Map() // id -> { howl, failed, last }
  let unlocked = false
  let disposed = false
  let ambientWanted = false
  let ambientRunning = false
  let ambientStage = 0
  let ducked = false
  let stopTimer = null

  const categoryVolume = (def) => (def.category === 'ambient' ? volumes.ambient : volumes.sfx)
  const effective = (def, extra = 1) => (volumes.muted ? 0 : (def.volume ?? 1) * categoryVolume(def) * volumes.master * extra)

  function fail(id, reason) {
    const e = entries.get(id)
    if (e && !e.failed) {
      e.failed = true
      warn(`[audio] "${id}" unavailable, skipping (${reason ?? 'load error'})`)
    }
  }

  function entry(id) {
    const def = sounds[id]
    if (!def || disposed) return null
    let e = entries.get(id)
    if (e) return e
    e = { howl: null, failed: false, last: -Infinity }
    entries.set(id, e)
    try {
      e.howl = createHowl(baseUrl + def.file, {
        loop: Boolean(def.loop),
        volume: effective(def),
        preload: true,
        onloaderror: () => fail(id, 'load error'),
        onplayerror: () => fail(id, 'play error'),
      })
    } catch (err) {
      fail(id, err?.message)
    }
    return e
  }

  // ---- one-shots -----------------------------------------------------------------------------
  function play(id) {
    if (!unlocked || disposed) return false
    const def = sounds[id]
    const e = entry(id)
    if (!def || !e || e.failed || !e.howl) return false
    const vol = effective(def)
    if (vol <= 0) return false // muted or zeroed: don't even start it
    const t = now()
    if (t - e.last < (def.minIntervalMs ?? 60)) return false // duplicate / rapid-repeat guard
    e.last = t
    e.howl.volume(vol)
    e.howl.play()
    return true
  }

  function playEvent(name) {
    const target = eventSounds[name]
    if (!target) return false
    let any = false
    for (const id of Array.isArray(target) ? target : [target]) any = play(id) || any
    return any
  }

  // ---- ambient loops -------------------------------------------------------------------------
  const layers = () => [
    { id: AMBIENT_ROOM, level: 1 },
    { id: AMBIENT_CORRUPT, level: CORRUPT_LAYER_BY_STAGE[ambientStage] ?? 0 },
  ]

  function applyAmbient(fadeMs) {
    const duck = ducked ? AMBIENT_DUCK : 1
    for (const { id, level } of layers()) {
      const def = sounds[id]
      const e = entries.get(id)
      if (!def || !e || e.failed || !e.howl) continue
      const target = effective(def, level * duck)
      if (fadeMs > 0 && e.howl.fade) e.howl.fade(e.howl.volume(), target, fadeMs)
      else e.howl.volume(target)
    }
  }

  function cancelStop() {
    if (stopTimer !== null) clearTimer(stopTimer)
    stopTimer = null
  }

  function beginAmbient() {
    cancelStop()
    if (!ambientRunning) {
      for (const { id } of layers()) {
        const e = entry(id)
        if (!e || e.failed || !e.howl) continue
        e.howl.volume(0)
        e.howl.play()
      }
      ambientRunning = true
      applyAmbient(AMBIENT_FADE_MS)
    } else {
      applyAmbient(AMBIENT_FADE_MS) // came back while fading out
    }
  }

  function startAmbient() {
    ambientWanted = true
    if (unlocked && !disposed) beginAmbient()
  }

  function stopAmbient({ fadeMs = AMBIENT_FADE_MS } = {}) {
    ambientWanted = false
    if (!ambientRunning) return
    cancelStop()
    const finish = () => {
      stopTimer = null
      for (const { id } of layers()) entries.get(id)?.howl?.stop()
      ambientRunning = false
    }
    if (fadeMs <= 0) return finish()
    for (const { id } of layers()) {
      const e = entries.get(id)
      if (e && !e.failed && e.howl?.fade) e.howl.fade(e.howl.volume(), 0, fadeMs)
    }
    stopTimer = setTimer(finish, fadeMs + 20)
  }

  return {
    // Call from a user gesture (pointerdown/keydown). Idempotent.
    unlock() {
      if (unlocked || disposed) return false
      unlocked = true
      try {
        resumeContext()
      } catch {
        /* no audio context available */
      }
      if (ambientWanted) beginAmbient()
      return true
    },
    isUnlocked: () => unlocked,

    play,
    playEvent,
    isAvailable: (id) => Boolean(sounds[id]) && !(entries.get(id)?.failed ?? false),

    startAmbient,
    stopAmbient,
    isAmbientRunning: () => ambientRunning,
    setAmbientStage(stage) {
      ambientStage = Math.max(0, Math.min(CORRUPT_LAYER_BY_STAGE.length - 1, Math.trunc(stage) || 0))
      if (ambientRunning) applyAmbient(AMBIENT_STAGE_FADE_MS)
    },
    duckAmbient(on) {
      ducked = Boolean(on)
      if (ambientRunning) applyAmbient(300)
    },

    // patch: { master, sfx, ambient, muted }
    setVolumes(patch) {
      for (const k of ['master', 'sfx', 'ambient']) if (patch?.[k] !== undefined) volumes[k] = clamp01(patch[k])
      if (typeof patch?.muted === 'boolean') volumes.muted = patch.muted
      if (ambientRunning) applyAmbient(150)
    },
    getVolumes: () => ({ ...volumes }),

    // Silence everything immediately (level exit, quit).
    stopAll() {
      cancelStop()
      for (const e of entries.values()) e.howl?.stop()
      ambientRunning = false
      ambientWanted = false
    },
    dispose() {
      this.stopAll()
      for (const e of entries.values()) e.howl?.unload?.()
      entries.clear()
      disposed = true
    },
  }
}
