import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel16Logic } from './level16/createLevel16Logic.js'
import { LEVEL16 } from './level16/layout.js'
import { fillView } from '../mechanics/lookAway.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, eye } = LEVEL16

// Level 16: an eye on the east wall. The pupil shrinks as the stare is held (driven from the logic every frame,
// never through React state).
export default function Level16() {
  const worldRef = useRef(null)
  const pupil = useRef(null)
  const view = useRef({ x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: -1 })
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel16Logic(createLevelCallbacks(LEVEL16.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL16.objective)

  useFrame((frame, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const c = frame.camera
    logic.update(fillView(view.current, c.position, c.rotation.y, c.rotation.x), Math.min(delta, 0.05) * 1000)
    if (pupil.current) pupil.current.scale.setScalar(1 - logic.getStareProgress() * 0.6)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l16-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <group position={[eye.x, eye.y, eye.z]}>
            <mesh>
              <sphereGeometry args={[0.35, 24, 24]} />
              <meshStandardMaterial color="#f4f4f5" />
            </mesh>
            <mesh ref={pupil} position={[-0.27, 0, 0]}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial color="#09090b" />
            </mesh>
          </group>
          <Sign text={LEVEL16.signText} position={[3.89, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} width={2.4} height={0.5} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL16.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
