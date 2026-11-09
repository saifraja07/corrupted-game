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
import { createLevel13Logic } from './level13/createLevel13Logic.js'
import { LEVEL13 } from './level13/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, redButton, greenButton } = LEVEL13

// Level 13: the sign forbids the red button; the red button (pressed three times) is the way out. The red count is
// polled each frame and only becomes React state when it changes.
export default function Level13() {
  const worldRef = useRef(null)
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel13Logic(createLevelCallbacks(LEVEL13.id)))
  const [unlocked, setUnlocked] = useState(false)

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL13.objective)

  useFrame(() => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const now = logic.isUnlocked()
    if (now !== unlocked) setUnlocked(now)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l13-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL13.signText} position={[0, 2.7, -5.98]} width={3.6} height={0.6} />
          <Sign text={LEVEL13.greenSignText} position={[3.89, 2.1, -1]} rotation={[0, -Math.PI / 2, 0]} width={2.4} height={0.5} />
          <Button id="l13-red" position={redButton.position} rotation={[0, redButton.rotationY, 0]} pressed={unlocked} prompt="Press Red Button" onPress={() => logic.pressRed()} />
          <Button id="l13-green" position={greenButton.position} rotation={[0, greenButton.rotationY, 0]} color="#22c55e" prompt="Press Green Button" onPress={() => logic.pressGreen()} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL13.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
