import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AMBIENT_CORRUPT, AMBIENT_ROOM, EVENT_SOUNDS, SOUNDS } from '../../src/game/config/audio.js'

const DIR = fileURLToPath(new URL('../../public/sounds/', import.meta.url))

// Minimal RIFF/WAVE reader: returns format info plus samples normalised to -1..1.
function readWav(path) {
  const buf = readFileSync(path)
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF')
  expect(buf.toString('ascii', 8, 12)).toBe('WAVE')
  let fmt = null
  let data = null
  for (let off = 12; off + 8 <= buf.length; ) {
    const id = buf.toString('ascii', off, off + 4)
    const size = buf.readUInt32LE(off + 4)
    const body = off + 8
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(body), channels: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14) }
    if (id === 'data') data = buf.subarray(body, body + size)
    off = body + size + (size % 2)
  }
  expect(fmt).not.toBe(null)
  expect(data).not.toBe(null)
  const samples = new Float32Array(data.length / 2)
  for (let i = 0; i < samples.length; i++) samples[i] = data.readInt16LE(i * 2) / 32768
  return { ...fmt, samples, seconds: samples.length / fmt.rate }
}

const files = Object.entries(SOUNDS)

describe('sound assets', () => {
  it('every configured sound has a file, and every file is configured', () => {
    for (const [id, def] of files) expect(existsSync(join(DIR, def.file)), `${id} -> ${def.file}`).toBe(true)
    const configured = new Set(files.map(([, d]) => d.file))
    for (const f of readdirSync(DIR).filter((n) => n.endsWith('.wav'))) expect(configured.has(f), `${f} is unused`).toBe(true)
  })

  for (const [id, def] of files) {
    describe(id, () => {
      const wav = () => readWav(join(DIR, def.file))

      it('is mono 16-bit PCM at a sane sample rate', () => {
        const w = wav()
        expect(w.format).toBe(1)
        expect(w.channels).toBe(1)
        expect(w.bits).toBe(16)
        expect(w.rate).toBeGreaterThanOrEqual(11025)
        expect(w.rate).toBeLessThanOrEqual(48000)
      })

      it('has a sensible length and is not silent', () => {
        const w = wav()
        expect(w.seconds).toBeGreaterThan(0.03)
        expect(w.seconds).toBeLessThan(6)
        const rms = Math.sqrt(w.samples.reduce((a, s) => a + s * s, 0) / w.samples.length)
        expect(rms).toBeGreaterThan(0.01)
      })

      it('is never loud: peak well below full scale, no clipping', () => {
        const w = wav()
        const peak = w.samples.reduce((m, s) => Math.max(m, Math.abs(s)), 0)
        expect(peak).toBeLessThanOrEqual(0.6)
        expect(peak).toBeGreaterThan(0.1)
      })

      if (!def.loop) {
        it('starts and ends smoothly (no click)', () => {
          const w = wav()
          expect(Math.abs(w.samples[0])).toBeLessThan(0.02)
          expect(Math.abs(w.samples[w.samples.length - 1])).toBeLessThan(0.02)
        })
      } else {
        it('loops seamlessly: the jump from last to first sample is no bigger than normal movement', () => {
          const s = wav().samples
          let sum = 0
          for (let i = 1; i < s.length; i++) sum += Math.abs(s[i] - s[i - 1])
          const typical = sum / (s.length - 1)
          expect(Math.abs(s[0] - s[s.length - 1])).toBeLessThan(typical * 4 + 0.01)
        })
        it('is long enough that the loop is not obviously repetitive', () => {
          expect(wav().seconds).toBeGreaterThanOrEqual(3)
        })
      }
    })
  }
})

describe('audio config consistency', () => {
  it('every event maps to sounds that exist', () => {
    for (const [event, target] of Object.entries(EVENT_SOUNDS)) {
      for (const id of Array.isArray(target) ? target : [target]) expect(SOUNDS[id], `${event} -> ${id}`).toBeDefined()
    }
  })
  it('ambient layers exist and loop; one-shots do not', () => {
    expect(SOUNDS[AMBIENT_ROOM].loop).toBe(true)
    expect(SOUNDS[AMBIENT_CORRUPT].loop).toBe(true)
    for (const [id, def] of files) if (id !== AMBIENT_ROOM && id !== AMBIENT_CORRUPT) expect(def.loop).toBeFalsy()
  })
  it('categories are known and per-sound trims are sane', () => {
    for (const [, def] of files) {
      expect(['ui', 'sfx', 'ambient']).toContain(def.category)
      expect(def.volume).toBeGreaterThan(0)
      expect(def.volume).toBeLessThanOrEqual(1)
    }
  })
  it('every dialogue/corruption event that should be audible is mapped', () => {
    for (const e of ['door_rejected', 'button_pressed', 'door_locked', 'fake_exit', 'controls_reversed', 'sign_changed', 'level_complete', 'corruption_stage_1', 'corruption_stage_2', 'corruption_stage_3']) {
      expect(EVENT_SOUNDS[e], e).toBeDefined()
    }
  })
})
