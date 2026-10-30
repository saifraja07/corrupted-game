import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel04Logic } from './level04/createLevel04Logic.js'
import { fillView } from '../mechanics/lookAway.js'
import { LEVEL04 } from './level04/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, doors, sign } = LEVEL04

export default function Level04() {
  const worldRef = useRef(null)
  const playerRef = useRef(null)
  const view = useRef({ x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: -1 })
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel04Logic(createLevelCallbacks(LEVEL04.id)))
  const [signText, setSignText] = useState(() => logic.getSignText())

  const boxes = useMemo(
    () => [
      ...roomBoundsToBoxes(room.width, room.depth),
      makeBox(doors.leftX, doors.z, doors.width, 0.3), // the fake door never opens
      makeBox(doors.rightX, doors.z, doors.width, 0.3, () => !logic.isDoorOpen()),
    ],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL04.objective)

  useFrame((frame) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const c = frame.camera
    logic.update(fillView(view.current, c.position, c.rotation.y, c.rotation.x))
    const text = logic.getSignText()
    if (text !== signText) setSignText(text) // React re-renders only when the sign actually changes
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          {/* Fake exit: identical to the real one, but it just sends the player back to the start. */}
          <Interactable
            id="l4-door-left"
            prompt="Open Exit"
            onInteract={() => {
              if (logic.useFakeExit()) playerRef.current?.teleport(LEVEL04.spawn[0], LEVEL04.spawn[1], 0)
            }}
          >
            <Door position={[doors.leftX, 0, doors.z]} width={doors.width} height={doors.height} />
          </Interactable>
          <Interactable
            id="l4-door-right"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useRealExit()) setExited(true)
            }}
          >
            <Door position={[doors.rightX, 0, doors.z]} width={doors.width} height={doors.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={signText} position={[sign.position.x, sign.position.y, sign.position.z]} rotation={[0, sign.rotationY, 0]} width={2.6} height={0.6} />
        </Room>
      </group>
      <Player ref={playerRef} boxes={boxes} start={LEVEL04.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
