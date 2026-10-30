import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Gate from '../world/Gate.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel07Logic } from './level07/createLevel07Logic.js'
import { LEVEL07 } from './level07/layout.js'
import { fillView } from '../mechanics/lookAway.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, gate, door } = LEVEL07
const sideWidth = room.width / 2 - gate.halfWidth // each solid barrier segment beside the gate
const sideX = gate.halfWidth + sideWidth / 2

// Level 7: a barrier with a gate that is open only while it is out of view. The gate's state is read every
// frame by Gate and by its collision box; React only knows whether the exit has been used.
export default function Level07() {
  const worldRef = useRef(null)
  const view = useRef({ x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: -1 })
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel07Logic(createLevelCallbacks(LEVEL07.id)))

  const boxes = useMemo(
    () => [
      ...roomBoundsToBoxes(room.width, room.depth),
      makeBox(-sideX, gate.z, sideWidth, gate.thickness), // solid barrier, left of the gate
      makeBox(sideX, gate.z, sideWidth, gate.thickness), // solid barrier, right of the gate
      makeBox(0, gate.z, gate.halfWidth * 2, gate.thickness, () => !logic.isGateOpen()), // the gate itself
      makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen()),
    ],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL07.objective)

  useFrame((frame, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const c = frame.camera
    logic.update(fillView(view.current, c.position, c.rotation.y, c.rotation.x), Math.min(delta, 0.05) * 1000)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          {[-sideX, sideX].map((x) => (
            <mesh key={x} position={[x, room.height / 2, gate.z]}>
              <boxGeometry args={[sideWidth, room.height, gate.thickness]} />
              <meshStandardMaterial color="#71717a" />
            </mesh>
          ))}
          <Gate position={[0, 0, gate.z]} width={gate.halfWidth * 2} height={gate.height} thickness={gate.thickness} getOpen={logic.isGateOpen} />
          <Interactable
            id="l7-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL07.signText} position={[-3.89, 1.6, 2]} rotation={[0, Math.PI / 2, 0]} width={3.2} height={0.6} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL07.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
