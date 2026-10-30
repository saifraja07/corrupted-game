import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

// Draw text to a canvas texture: no font files or network needed.
function makeTextTexture(text, w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#18181b'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, w - 8, h - 8)
  ctx.fillStyle = '#18181b'
  const family = 'ui-sans-serif, system-ui, sans-serif'
  const maxSize = Math.min(56, Math.floor(h * 0.6))
  ctx.font = `bold ${maxSize}px ${family}`
  // Long text shrinks to fit (down to a readable minimum) instead of being squashed sideways.
  const fit = (w - 40) / Math.max(1, ctx.measureText(text).width)
  ctx.font = `bold ${Math.max(18, Math.floor(maxSize * Math.min(1, fit)))}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2, w - 40)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  return tex
}

// Static wall sign. Front faces +Z locally. (Interactive/changing signs come with corruption.)
export default function Sign({ text, position, rotation, width = 2, height = 0.6 }) {
  const texture = useMemo(() => makeTextTexture(text, 512, Math.round((512 * height) / width)), [text, width, height])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}
