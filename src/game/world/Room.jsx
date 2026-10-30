import { STAGE_PROFILES } from '../config/corruption.js'
import { useGameStore } from '../state/gameStore.js'
import { devFlags } from '../core/devFlags.js'

// Reusable rectangular room. Centered on x/z origin, floor at y = 0.
// Walls are thin boxes so they can double as collision volumes later.
const WALL = 0.2

export default function Room({
  width = 8,
  depth = 12,
  height = 3.2,
  wallColor,
  floorColor,
  showCeiling = devFlags.showCeiling, // ?ceiling=0 hides it for development
  children,
}) {
  // Default surface colors follow the corruption stage (material change); explicit props still win.
  const palette = STAGE_PROFILES[useGameStore((st) => st.corruptionStage)]
  wallColor ??= palette.wall
  floorColor ??= palette.floor
  const hw = width / 2
  const hd = depth / 2
  return (
    <group>
      {/* floor */}
      <mesh position={[0, -WALL / 2, 0]} receiveShadow>
        <boxGeometry args={[width + WALL * 2, WALL, depth + WALL * 2]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
      {showCeiling && (
        <mesh position={[0, height + WALL / 2, 0]}>
          <boxGeometry args={[width + WALL * 2, WALL, depth + WALL * 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}
      {/* back / front walls */}
      <mesh position={[0, height / 2, -hd - WALL / 2]}>
        <boxGeometry args={[width + WALL * 2, height, WALL]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[0, height / 2, hd + WALL / 2]}>
        <boxGeometry args={[width + WALL * 2, height, WALL]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* side walls */}
      <mesh position={[-hw - WALL / 2, height / 2, 0]}>
        <boxGeometry args={[WALL, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[hw + WALL / 2, height / 2, 0]}>
        <boxGeometry args={[WALL, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* baseboards give the walls some depth against the floor */}
      <mesh position={[0, 0.08, -hd + 0.015]}>
        <boxGeometry args={[width, 0.16, 0.03]} />
        <meshStandardMaterial color={palette.trim} />
      </mesh>
      <mesh position={[0, 0.08, hd - 0.015]}>
        <boxGeometry args={[width, 0.16, 0.03]} />
        <meshStandardMaterial color={palette.trim} />
      </mesh>
      <mesh position={[-hw + 0.015, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.16, depth]} />
        <meshStandardMaterial color={palette.trim} />
      </mesh>
      <mesh position={[hw - 0.015, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.16, depth]} />
        <meshStandardMaterial color={palette.trim} />
      </mesh>
      {/* ceiling light panel (greys out with corruption) */}
      {showCeiling && (
        <mesh position={[0, height - 0.02, 0]}>
          <boxGeometry args={[Math.min(1.8, width * 0.4), 0.04, 0.8]} />
          <meshBasicMaterial color={palette.panel} />
        </mesh>
      )}
      {children}
    </group>
  )
}
