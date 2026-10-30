import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'

// A full-height sliding slab. Purely visual: collision is the caller's box (enabled while closed).
// getOpen() is read every frame, so level logic drives it without React renders.
export default function Gate({ position = [0, 0, 0], width = 2.4, height = 3.2, thickness = 0.4, getOpen }) {
  const slab = useRef(null)
  useFrame((_, delta) => {
    const g = slab.current
    if (g) g.position.y = MathUtils.damp(g.position.y, getOpen?.() ? height + 0.05 : 0, 8, Math.min(delta, 0.05))
  })
  return (
    <group position={position}>
      <group ref={slab}>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, thickness]} />
          <meshStandardMaterial color="#52525b" />
        </mesh>
        <mesh position={[0, height / 2, thickness / 2 + 0.01]}>
          <boxGeometry args={[width * 0.9, 0.08, 0.02]} />
          <meshStandardMaterial color="#a1a1aa" />
        </mesh>
      </group>
    </group>
  )
}
