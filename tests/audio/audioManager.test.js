import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAudioManager } from '../../src/game/systems/AudioManager.js'
import { AMBIENT_CORRUPT, AMBIENT_DUCK, AMBIENT_FADE_MS, AMBIENT_ROOM, CORRUPT_LAYER_BY_STAGE, SOUNDS } from '../../src/game/config/audio.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

// A stand-in for Howl that records what it is asked to do.
function setup(extra = {}) {
  const howls = new Map() // file -> fake
  let clock = 1000
  const createHowl = vi.fn((src, opts) => {
    const h = {
      src,
      opts,
      vol: opts.volume,
      plays: 0,
      stops: 0,
      fades: [],
      unloaded: false,
      volume(v) {
        if (v === undefined) return this.vol
        this.vol = v
      },
      play() {
        this.plays++
      },
      stop() {
        this.stops++
      },
      fade(from, to, ms) {
        this.fades.push([from, to, ms])
        this.vol = to
      },
      unload() {
        this.unloaded = true
      },
    }
    howls.set(src.split('/').pop(), h)
    return h
  })
  const warn = vi.fn()
  const resumeContext = vi.fn()
  const audio = createAudioManager({ createHowl, warn, resumeContext, now: () => clock, baseUrl: '/sounds/', ...extra })
  return { audio, howls, createHowl, warn, resumeContext, tick: (ms) => (clock += ms), h: (file) => howls.get(file) }
}

describe('autoplay and unlock', () => {
  it('plays nothing before a user gesture, then works after unlock()', () => {
    const { audio, createHowl, resumeContext } = setup()
    expect(audio.play('button')).toBe(false)
    expect(createHowl).not.toHaveBeenCalled()
    expect(audio.unlock()).toBe(true)
    expect(audio.unlock()).toBe(false) // idempotent
    expect(resumeContext).toHaveBeenCalledTimes(1)
    expect(audio.play('button')).toBe(true)
  })
  it('survives an audio context that refuses to resume', () => {
    const { audio } = setup({ resumeContext: () => { throw new Error('nope') } })
    expect(() => audio.unlock()).not.toThrow()
    expect(audio.isUnlocked()).toBe(true)
  })
})

describe('one-shot sounds', () => {
  it('loads lazily from the configured URL and plays', () => {
    const { audio, createHowl, h } = setup()
    audio.unlock()
    expect(createHowl).not.toHaveBeenCalled()
    audio.play('button')
    expect(createHowl).toHaveBeenCalledTimes(1)
    expect(h('button.wav').src).toBe('/sounds/button.wav')
    expect(h('button.wav').plays).toBe(1)
    audio.play('button') // blocked by the interval guard but must not reload
    expect(createHowl).toHaveBeenCalledTimes(1)
  })

  it('computes volume as trim x category x master', () => {
    const { audio, h, tick } = setup()
    audio.unlock()
    audio.setVolumes({ master: 0.5, sfx: 0.5 })
    audio.play('door_slide') // trim 0.9, sfx category
    expect(h('door_slide.wav').vol).toBeCloseTo(0.9 * 0.5 * 0.5)
    tick(1000)
    audio.play('ui_click') // ui follows the effects slider
    expect(h('ui_click.wav').vol).toBeCloseTo(0.9 * 0.5 * 0.5)
  })

  it('does not play when muted or when volume is zero', () => {
    const { audio, h, tick } = setup()
    audio.unlock()
    audio.setVolumes({ muted: true })
    expect(audio.play('button')).toBe(false)
    audio.setVolumes({ muted: false, master: 0 })
    tick(1000)
    expect(audio.play('button')).toBe(false)
    expect(h('button.wav')?.plays ?? 0).toBe(0)
  })

  it('blocks rapid repeats per sound, not across sounds', () => {
    const { audio, h, tick } = setup()
    audio.unlock()
    expect(audio.play('door_slide')).toBe(true)
    expect(audio.play('door_slide')).toBe(false)
    expect(audio.play('button')).toBe(true) // a different sound is unaffected
    tick(SOUNDS.door_slide.minIntervalMs + 1)
    expect(audio.play('door_slide')).toBe(true)
    expect(h('door_slide.wav').plays).toBe(2)
  })

  it('ignores unknown sounds', () => {
    const { audio } = setup()
    audio.unlock()
    expect(audio.play('nope')).toBe(false)
    expect(audio.isAvailable('nope')).toBe(false)
  })

  it('playEvent maps game events to sounds, and ignores unmapped ones', () => {
    const { audio, h } = setup()
    audio.unlock()
    expect(audio.playEvent('door_locked')).toBe(true)
    expect(h('locked.wav').plays).toBe(1)
    expect(audio.playEvent('hint_1')).toBe(false)
    const multi = setup({ eventSounds: { both: ['button', 'locked'] } })
    multi.audio.unlock()
    expect(multi.audio.playEvent('both')).toBe(true)
    expect(multi.h('button.wav').plays).toBe(1)
    expect(multi.h('locked.wav').plays).toBe(1)
  })
})

describe('missing or broken files are handled gracefully', () => {
  it('a load error disables just that sound, warning once', () => {
    const { audio, createHowl, warn, tick } = setup()
    audio.unlock()
    audio.play('button')
    createHowl.mock.calls[0][1].onloaderror()
    createHowl.mock.calls[0][1].onloaderror() // repeated error: still one warning
    expect(warn).toHaveBeenCalledTimes(1)
    expect(audio.isAvailable('button')).toBe(false)
    tick(1000)
    expect(audio.play('button')).toBe(false)
    expect(audio.play('locked')).toBe(true) // others keep working
  })
  it('a Howl constructor that throws never reaches the game', () => {
    const { audio, warn } = setup({ createHowl: () => { throw new Error('no audio') } })
    audio.unlock()
    expect(() => audio.play('button')).not.toThrow()
    expect(audio.play('button')).toBe(false)
    expect(warn).toHaveBeenCalled()
  })
  it('a play error also disables the sound', () => {
    const { audio, createHowl } = setup()
    audio.unlock()
    audio.play('success')
    createHowl.mock.calls[0][1].onplayerror()
    expect(audio.isAvailable('success')).toBe(false)
  })
})

describe('ambient', () => {
  const roomTarget = (v = { master: 0.8, ambient: 0.7 }) => v.master * v.ambient
  it('waits for unlock, then fades both loops in; the corrupt layer starts silent', () => {
    const { audio, h } = setup()
    audio.startAmbient()
    expect(audio.isAmbientRunning()).toBe(false)
    audio.unlock()
    expect(audio.isAmbientRunning()).toBe(true)
    expect(h('ambient_room.wav').plays).toBe(1)
    expect(h('ambient_room.wav').opts.loop).toBe(true)
    expect(h('ambient_room.wav').fades.at(-1)).toEqual([0, roomTarget(), AMBIENT_FADE_MS])
    expect(h('ambient_corrupt.wav').vol).toBe(0)
  })

  it('the corrupt layer rises with the corruption stage', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.startAmbient()
    for (const stage of [1, 2, 3]) {
      audio.setAmbientStage(stage)
      expect(h('ambient_corrupt.wav').vol).toBeCloseTo(roomTarget() * CORRUPT_LAYER_BY_STAGE[stage])
    }
    audio.setAmbientStage(99) // clamped
    expect(h('ambient_corrupt.wav').vol).toBeCloseTo(roomTarget() * CORRUPT_LAYER_BY_STAGE[3])
    audio.setAmbientStage(0)
    expect(h('ambient_corrupt.wav').vol).toBe(0)
  })

  it('ducks while paused and restores afterwards', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.startAmbient()
    audio.duckAmbient(true)
    expect(h('ambient_room.wav').vol).toBeCloseTo(roomTarget() * AMBIENT_DUCK)
    audio.duckAmbient(false)
    expect(h('ambient_room.wav').vol).toBeCloseTo(roomTarget())
  })

  it('stopAmbient fades out, then stops; starting again during the fade cancels the stop', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.startAmbient()
    audio.stopAmbient()
    expect(h('ambient_room.wav').fades.at(-1)[1]).toBe(0)
    expect(h('ambient_room.wav').stops).toBe(0)
    vi.advanceTimersByTime(AMBIENT_FADE_MS + 50)
    expect(h('ambient_room.wav').stops).toBe(1)
    expect(audio.isAmbientRunning()).toBe(false)

    audio.startAmbient()
    audio.stopAmbient()
    audio.startAmbient() // back before the fade finished
    vi.advanceTimersByTime(AMBIENT_FADE_MS * 2)
    expect(audio.isAmbientRunning()).toBe(true)
    expect(h('ambient_room.wav').stops).toBe(1) // no stray stop
  })

  it('stopAmbient with no fade stops immediately, and is a no-op when nothing runs', () => {
    const { audio, h } = setup()
    audio.unlock()
    expect(() => audio.stopAmbient()).not.toThrow()
    audio.startAmbient()
    audio.stopAmbient({ fadeMs: 0 })
    expect(h('ambient_room.wav').stops).toBe(1)
  })

  it('does not double-start the loops when asked twice', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.startAmbient()
    audio.startAmbient()
    expect(h('ambient_room.wav').plays).toBe(1)
  })

  it('volume changes reach the running loops; mute silences them', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.startAmbient()
    audio.setVolumes({ ambient: 0.2 })
    expect(h('ambient_room.wav').vol).toBeCloseTo(0.8 * 0.2)
    audio.setVolumes({ muted: true })
    expect(h('ambient_room.wav').vol).toBe(0)
    audio.setVolumes({ muted: false })
    expect(h('ambient_room.wav').vol).toBeCloseTo(0.8 * 0.2)
  })

  it('a missing ambient file never stops the other layer or throws', () => {
    const { audio, createHowl, h } = setup()
    audio.unlock()
    audio.startAmbient()
    createHowl.mock.calls.find(([src]) => src.endsWith('ambient_corrupt.wav'))[1].onloaderror()
    expect(() => audio.setAmbientStage(3)).not.toThrow()
    expect(h('ambient_room.wav').plays).toBe(1)
  })
})

describe('volumes', () => {
  it('clamps to 0..1 and ignores junk', () => {
    const { audio } = setup()
    audio.setVolumes({ master: 5, sfx: -2, ambient: NaN, muted: 'yes' })
    expect(audio.getVolumes()).toEqual({ master: 1, sfx: 0, ambient: 0, muted: false })
  })
})

describe('teardown', () => {
  it('stopAll silences everything and leaves no timers', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.startAmbient()
    audio.play('button')
    audio.stopAmbient()
    audio.stopAll()
    expect(vi.getTimerCount()).toBe(0)
    expect(h('button.wav').stops).toBe(1)
    expect(audio.isAmbientRunning()).toBe(false)
  })
  it('dispose unloads sounds and refuses further playback', () => {
    const { audio, h } = setup()
    audio.unlock()
    audio.play('button')
    audio.dispose()
    expect(h('button.wav').unloaded).toBe(true)
    expect(audio.play('locked')).toBe(false)
    expect(audio.startAmbient()).toBeUndefined()
    expect(audio.isAmbientRunning()).toBe(false)
  })
})

describe('configured sound names are real', () => {
  it('the ambient ids used by the manager exist in the sound table', () => {
    expect(SOUNDS[AMBIENT_ROOM]).toBeDefined()
    expect(SOUNDS[AMBIENT_CORRUPT]).toBeDefined()
  })
})
