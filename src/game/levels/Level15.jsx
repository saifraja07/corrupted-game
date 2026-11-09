import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel15Logic } from './level15/createLevel15Logic.js'
import { LEVEL15 } from './level15/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door } = LEVEL15

// Level 15: standing against the west wall makes it give way (a dark crack appears). The camera position is
// handed to the logic every frame; React only learns when the wall has given.
export default function Level15() {
  const worldRef = useRef(null)
  const cam = useRef({ x: 0, z: 0 })
  const [exited, setExited] = useState(false)
  const [open, setOpen] = useState(false)
  const [logic] = useState(() => createLevel15Logic(createLevelCallbacks(LEVEL15.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL15.objective)

  useFrame((frame, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    cam.current.x = frame.camera.position.x
    cam.current.z = frame.camera.position.z
    logic.update(cam.current, Math.min(delta, 0.05) * 1000)
    const now = logic.isUnlocked()
    if (now !== open) setOpen(now)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l15-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL15.signText} position={[0, 2.7, -5.98]} width={4} height={0.6} />
          <Sign text={LEVEL15.eastSignText} position={[3.89, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={2.4} height={0.6} />
          {open && (
            <mesh position={[-3.97, 1.4, LEVEL15.leanZ]}>
              <boxGeometry args={[0.04, 2.2, 1.4]} />
              <meshStandardMaterial color="#27272a" />
            </mesh>
          )}
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL15.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
