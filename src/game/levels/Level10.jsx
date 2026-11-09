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
import { createLevel10Logic } from './level10/createLevel10Logic.js'
import { LEVEL10 } from './level10/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door } = LEVEL10

// Level 10: the sign and the countdown say HURRY; standing perfectly still is what opens the exit.
// The countdown text is polled and only becomes React state when it actually changes (about once a second).
export default function Level10() {
  const worldRef = useRef(null)
  const cam = useRef({ x: 0, z: 0, yaw: 0, pitch: 0 })
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel10Logic(createLevelCallbacks(LEVEL10.id)))
  const [countdown, setCountdown] = useState(() => logic.getCountdownText())

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL10.objective)

  useFrame((frame, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const c = frame.camera
    const s = cam.current
    s.x = c.position.x
    s.z = c.position.z
    s.yaw = c.rotation.y
    s.pitch = c.rotation.x
    logic.update(s, Math.min(delta, 0.05) * 1000)
    const text = logic.getCountdownText()
    if (text !== countdown) setCountdown(text)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l10-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={countdown} position={[0, 2.7, -5.98]} width={3.4} height={0.6} />
          <Sign text={LEVEL10.hurrySign} position={[3.89, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={1.6} height={0.6} />
          <Button
            id="l10-decoy"
            position={LEVEL10.decoyButton.position}
            rotation={[0, LEVEL10.decoyButton.rotationY, 0]}
            prompt="Press to Open"
            onPress={() => logic.pressDecoy()}
          />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL10.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
