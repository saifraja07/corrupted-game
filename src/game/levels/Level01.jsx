import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Button from '../world/Button.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeDynamicBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel01Logic } from './level01/createLevel01Logic.js'
import { LEVEL01 } from './level01/layout.js'
import { useGameStore } from '../state/gameStore.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, button } = LEVEL01

// Scene for Level 1. All rules live in createLevel01Logic; this component renders them and forwards
// player actions. Remounted (via key) on every restart, so it always begins pristine.
export default function Level01() {
  const worldRef = useRef(null)
  const playerPos = useRef({ x: 0, z: 0 })
  const [pressed, setPressed] = useState(false)
  const [exited, setExited] = useState(false)

  const [logic] = useState(() => createLevel01Logic(createLevelCallbacks(LEVEL01.id)))

  const boxes = useMemo(
    () => [
      ...roomBoundsToBoxes(room.width, room.depth),
      // The exit door blocks the player while closed and follows its dodging position.
      makeDynamicBox(() => logic.getDoorX(), door.z, door.width, 0.3, () => !logic.isDoorOpen()),
    ],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL01.objective)

  useFrame((frame, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const p = playerPos.current
    p.x = frame.camera.position.x
    p.z = frame.camera.position.z
    logic.update(p, Math.min(delta, 0.05))
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="exit-door"
            prompt="Open Exit"
            enabled={pressed && !exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getX={logic.getDoorX} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL01.objective} position={[3.89, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
          <Button
            id="level01-button"
            position={button.position}
            rotation={[0, button.rotationY, 0]}
            pressed={pressed}
            prompt="Press Button"
            onPress={() => {
              if (logic.pressButton()) setPressed(true)
            }}
          />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL01.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
