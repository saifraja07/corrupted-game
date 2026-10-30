import { describe, it, expect, vi } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { detectSupport } from '../../src/game/core/support.js'
import GameErrorBoundary from '../../src/components/ui/GameErrorBoundary.jsx'
import MainMenu from '../../src/components/ui/MainMenu.jsx'

// Fake documents: canvas contexts and pointer lock are injectable.
const doc = ({ contexts = ['webgl2'], pointerLock = true, throws = false } = {}) => ({
  createElement: () => ({
    getContext: (kind) => {
      if (throws) throw new Error('blocked')
      return contexts.includes(kind) ? {} : null
    },
  }),
  documentElement: pointerLock ? { requestPointerLock() {} } : {},
})

describe('browser support detection', () => {
  it('accepts a browser with WebGL2 and pointer lock', () => {
    expect(detectSupport(doc())).toEqual({ ok: true, reason: null })
  })
  it('falls back to WebGL1', () => {
    expect(detectSupport(doc({ contexts: ['webgl'] })).ok).toBe(true)
  })
  it('explains missing WebGL', () => {
    const r = detectSupport(doc({ contexts: [] }))
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/WebGL/)
  })
  it('survives a browser that throws when creating a context', () => {
    const r = detectSupport(doc({ throws: true }))
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/WebGL/)
  })
  it('explains missing pointer lock (touch-only devices)', () => {
    const r = detectSupport(doc({ pointerLock: false }))
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/desktop|mouse/)
  })
  it('handles having no document at all', () => {
    expect(detectSupport(null).ok).toBe(false)
  })
})

describe('main menu on an unsupported browser', () => {
  const noop = () => {}
  it('shows the reason and disables Start and Continue, but keeps Settings and Credits usable', () => {
    const html = renderToString(h(MainMenu, { onStart: noop, onContinue: noop, onSettings: noop, onCredits: noop, unsupportedReason: 'No WebGL here.' }))
    expect(html).toContain('No WebGL here.')
    expect(html).toContain('role="alert"')
    expect((html.match(/disabled=""/g) ?? []).length).toBe(2) // Continue + New game
    expect(html).toContain('Settings')
    expect(html).toContain('Credits')
  })
  it('is fully enabled when supported', () => {
    const html = renderToString(h(MainMenu, { onStart: noop }))
    expect(html).not.toContain('disabled=""') // the attribute (the CSS class names mention "disabled:" too)
    expect(html).not.toContain('role="alert"')
  })
})

describe('GameErrorBoundary', () => {
  it('captures the error into state', () => {
    const err = new Error('boom')
    expect(GameErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err })
  })
  it('renders its children while healthy', () => {
    const inst = new GameErrorBoundary({ children: 'scene' })
    inst.state = { error: null }
    expect(inst.render()).toBe('scene')
  })
  it('shows a way back to the menu after a crash, and the button resets and notifies the app', () => {
    const onReset = vi.fn()
    const inst = new GameErrorBoundary({ onReset })
    inst.state = { error: new Error('boom') }
    const html = renderToString(inst.render())
    expect(html).toContain('Something went wrong')
    expect(html).toContain('Back to main menu')
    expect(html).toContain('role="alert"')
    inst.setState = vi.fn()
    inst.reset()
    expect(inst.setState).toHaveBeenCalledWith({ error: null })
    expect(onReset).toHaveBeenCalledTimes(1)
  })
  it('logs the crash for debugging', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    new GameErrorBoundary({}).componentDidCatch(new Error('x'))
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
