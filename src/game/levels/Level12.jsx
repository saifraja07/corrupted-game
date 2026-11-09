import { useEffect, useMemo, useRef, useState } from 'react'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel12Logic } from './level12/createLevel12Logic.js'
import { LEVEL12 } from './level12/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { registerMetaExit } from '../state/metaExit.js'

const { room, doorway } = LEVEL12

// Level 18 (id level12): doors painted onto the wall, and nothing else. The real exit is the pause menu's EXIT button, which
// exists only while this level is loaded (see state/metaExit.js).
export default function Level12() {
  const worldRef = useRef(null)
  const [logic] = useState(() => createLevel12Logic(createLevelCallbacks(LEVEL12.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), ...LEVEL12.doorwayXs.map((x) => makeBox(x, doorway.z, doorway.width, 0.3))],
    [],
  )

  useLevelLifecycle(logic, LEVEL12.objective)
  useEffect(() => registerMetaExit(() => logic.useMetaExit()), [logic]) // the effect's cleanup removes the button

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          {LEVEL12.doorwayXs.map((x, i) => (
            <Interactable key={x} id={`l12-doorway-${i}`} prompt="Open Door" onInteract={() => logic.probeDoorway(i)}>
              <Door position={[x, 0, doorway.z]} width={doorway.width} height={doorway.height} color={doorway.color} />
            </Interactable>
          ))}
          <Sign text={LEVEL12.signText} position={[3.89, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={2.4} height={0.6} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL12.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
