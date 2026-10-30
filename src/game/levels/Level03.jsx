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
import { createLevel03Logic } from './level03/createLevel03Logic.js'
import { LEVEL03 } from './level03/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, button } = LEVEL03

export default function Level03() {
  const worldRef = useRef(null)
  const playerPos = useRef({ x: 0, z: 0 })
  const [calibrated, setCalibrated] = useState(false)
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel03Logic(createLevelCallbacks(LEVEL03.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL03.objective)

  useFrame((frame) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const p = playerPos.current
    p.x = frame.camera.position.x
    p.z = frame.camera.position.z
    logic.update(p)
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l3-exit"
            prompt="Open Exit"
            enabled={calibrated && !exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text="CALIBRATION" position={[button.position[0], 2.05, -5.98]} width={1.6} height={0.45} />
          <Button
            id="l3-calibrate"
            position={button.position}
            rotation={[0, button.rotationY, 0]}
            pressed={calibrated}
            prompt="Calibrate"
            onPress={() => {
              if (logic.pressCalibrate()) setCalibrated(true)
            }}
          />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL03.spawn} modifiers={logic.modifiers} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
