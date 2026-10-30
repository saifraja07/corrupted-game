import { useMemo, useRef, useState } from 'react'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Button from '../world/Button.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel02Logic } from './level02/createLevel02Logic.js'
import { LEVEL02 } from './level02/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'

const { room, door, buttonA, buttonB } = LEVEL02

// Level 2 scene. Rules live in createLevel02Logic; this renders them and forwards player actions.
export default function Level02() {
  const worldRef = useRef(null)
  const [aPressed, setAPressed] = useState(false)
  const [bPressed, setBPressed] = useState(false)
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel02Logic(createLevelCallbacks(LEVEL02.id)))

  // The door blocks the player until the level is solved.
  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL02.objective)

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l2-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL02.signText} position={[3.89, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} />
          <Button
            id="l2-button-a"
            position={buttonA.position}
            rotation={[0, buttonA.rotationY, 0]}
            pressed={aPressed}
            onPress={() => {
              if (logic.pressA()) setAPressed(true)
            }}
          />
          <Button
            id="l2-button-b"
            position={buttonB.position}
            rotation={[buttonB.rotationX, 0, 0]}
            pressed={bPressed}
            onPress={() => {
              if (logic.pressB()) setBPressed(true)
            }}
          />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL02.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
