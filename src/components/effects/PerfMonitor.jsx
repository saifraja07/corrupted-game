import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { createFpsMeter } from '../../game/core/fpsMeter.js'

// Dev-only (?stats=1). Shows real FPS and renderer resource counts so performance and leaks can be
// MEASURED in a real browser: after restarting a level several times, geometries/textures should
// return to the same numbers. Writes to a DOM node directly, so it never causes React renders.
export default function PerfMonitor() {
  const gl = useThree((s) => s.gl)
  const meter = useRef(null)
  const el = useRef(null)

  useEffect(() => {
    const div = document.createElement('div')
    div.setAttribute('data-perf-monitor', '')
    div.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;font:12px monospace;background:#000c;color:#7CFC7C;padding:4px 8px;pointer-events:none;white-space:pre'
    document.body.appendChild(div)
    el.current = div
    meter.current = createFpsMeter()
    return () => {
      div.remove()
      el.current = null
      meter.current = null
    }
  }, [])

  useFrame((_, delta) => {
    const r = meter.current?.tick(delta)
    if (!r || !el.current) return
    const { render, memory } = gl.info
    el.current.textContent =
      `${r.fps.toFixed(0)} fps  ${r.avgMs.toFixed(1)} ms (worst ${r.worstMs.toFixed(1)})\n` +
      `calls ${render.calls}  tris ${render.triangles}  geometries ${memory.geometries}  textures ${memory.textures}`
  })
  return null
}
