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
import { createLevel14Logic } from './level14/createLevel14Logic.js'
import { LEVEL14 } from './level14/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, buttons } = LEVEL14

// Level 14: three buttons inside a hidden deadline. The pressed lamps are polled each frame and only become React
// state when the pattern changes (a press, or the deadline clearing them).
export default function Level14() {
  const worldRef = useRef(null)
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel14Logic(createLevelCallbacks(LEVEL14.id)))
  const [pressed, setPressed] = useState(() => logic.getPressed())

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL14.objective)

  useFrame(() => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const now = logic.getPressed()
    if (now.some((v, i) => v !== pressed[i])) setPressed([...now])
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l14-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={LEVEL14.signText} position={[3.89, 1.6, 3]} rotation={[0, -Math.PI / 2, 0]} width={2.4} height={0.6} />
          {buttons.map((b, i) => (
            <Button key={b.id} id={b.id} position={b.position} rotation={[0, b.rotationY, 0]} pressed={pressed[i]} onPress={() => logic.press(i)} />
          ))}
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL14.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
