import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'

// Door visual. Slides up when open. Optional getX()/getOpen() are read every frame so level logic can
// drive it without React re-renders (a dodging door moves sideways; a solved door opens). Collision is
// the caller's box, kept separate from visuals.
export default function Door({ position = [0, 0, 0], width = 1.2, height = 2.2, open = false, getX, getOpen, color = '#52525b' }) {
  const outer = useRef(null)
  const slider = useRef(null)
  useFrame((_, delta) => {
    if (outer.current && getX) outer.current.position.x = position[0] + getX()
    const g = slider.current
    if (!g) return
    const isOpen = getOpen ? getOpen() : open
    g.position.y = MathUtils.damp(g.position.y, isOpen ? height + 0.1 : 0, 6, Math.min(delta, 0.05))
  })
  return (
    <group ref={outer} position={position}>
      {/* fixed frame (moves sideways with a dodging door, but never slides up) */}
      <mesh position={[-(width / 2 + 0.05), (height + 0.1) / 2, 0]}>
        <boxGeometry args={[0.1, height + 0.1, 0.2]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[width / 2 + 0.05, (height + 0.1) / 2, 0]}>
        <boxGeometry args={[0.1, height + 0.1, 0.2]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[width + 0.2, 0.1, 0.2]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <group ref={slider}>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, 0.12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[width * 0.35, height * 0.48, 0.09]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#e4e4e7" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
