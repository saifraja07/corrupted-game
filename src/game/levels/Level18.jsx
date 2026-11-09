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
import { createLevel18Logic } from './level18/createLevel18Logic.js'
import { LEVEL18 } from './level18/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, leftButton, rightButton, signLines } = LEVEL18

// Level 18: the sign is honest. The left button's lamp is polled each frame and only becomes React state when it
// changes (a press, or the wait being reset).
export default function Level18() {
  const worldRef = useRef(null)
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel18Logic(createLevelCallbacks(LEVEL18.id)))
  const [leftPressed, setLeftPressed] = useState(false)

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL18.objective)

  useFrame((_, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    logic.update(Math.min(delta, 0.05) * 1000)
    const now = logic.isLeftPressed()
    if (now !== leftPressed) setLeftPressed(now)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l18-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          {signLines.map((line, i) => (
            <Sign key={line} text={line} position={[-2.6, 2.5 - i * 0.7, -5.98]} width={2.8} height={0.55} />
          ))}
          <Button id="l18-left" position={leftButton.position} rotation={[0, leftButton.rotationY, 0]} pressed={leftPressed} prompt="Press Left Button" onPress={() => logic.pressLeft()} />
          <Button id="l18-right" position={rightButton.position} rotation={[0, rightButton.rotationY, 0]} prompt="Press Right Button" onPress={() => logic.pressRight()} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL18.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
