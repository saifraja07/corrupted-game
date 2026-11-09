import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Button from '../world/Button.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel17Logic } from './level17/createLevel17Logic.js'
import { LEVEL17 } from './level17/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, decoyButton } = LEVEL17

// Level 17: knock on the door seven times, slowly. The knock gap is measured in game time (the frame delta), so
// pausing never lets the player skip it.
export default function Level17() {
  const worldRef = useRef(null)
  const [logic] = useState(() => createLevel17Logic(createLevelCallbacks(LEVEL17.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL17.objective)

  useFrame((_, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    logic.update(Math.min(delta, 0.05) * 1000)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable id="l17-door" prompt="Knock" onInteract={() => logic.knock()}>
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL17.signText} position={[0, 2.7, -5.98]} width={3.4} height={0.6} />
          <Sign text={LEVEL17.decoySignText} position={[-3.89, 1.9, -1]} rotation={[0, Math.PI / 2, 0]} width={1.8} height={0.4} />
          <Button id="l17-decoy" position={decoyButton.position} rotation={[0, decoyButton.rotationY, 0]} prompt="Emergency Open" onPress={() => logic.pressDecoy()} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL17.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
