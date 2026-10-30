import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Button from '../world/Button.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel06Logic } from './level06/createLevel06Logic.js'
import { BUTTONS, LEVEL06 } from './level06/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { resetSceneFx, setDarkness } from '../state/sceneFx.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door, glow } = LEVEL06

// Level 6: the room periodically goes dark and a glowing mark reveals the real button. Darkness is
// written to a shared plain object each frame (no React renders) and cleared when the level unmounts.
export default function Level06() {
  const worldRef = useRef(null)
  const glowRef = useRef(null)
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel06Logic(createLevelCallbacks(LEVEL06.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(door.x, door.z, 0.3, door.width, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL06.objective)
  useEffect(() => () => resetSceneFx(), []) // never leave the next level dark

  useFrame((_, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    logic.update(Math.min(delta, 0.05) * 1000)
    setDarkness(logic.getDarkness())
    if (glowRef.current) glowRef.current.visible = logic.isGlowVisible()
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l6-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            {/* the door lives in the left wall, so it is turned to face into the room */}
            <group position={[door.x, 0, door.z]} rotation={[0, Math.PI / 2, 0]}>
              <Door position={[0, 0, 0]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
            </group>
          </Interactable>

          <Sign text={LEVEL06.signText} position={[3.89, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={3.2} height={0.6} />

          {BUTTONS.map((b, i) => (
            <Button
              key={b.name}
              id={`l6-button-${b.name.toLowerCase()}`}
              position={[b.x, LEVEL06.buttonY, LEVEL06.buttonZ]}
              rotation={[0, 0, 0]}
              color={b.hex}
              prompt={`Press ${b.name}`}
              onPress={() => logic.pressButton(i)}
            />
          ))}
        </Room>
      </group>
      {/* The glowing mark is outside the raycast group: it is decoration and must never block interaction. */}
      <mesh ref={glowRef} position={[glow.x, glow.y, glow.z]} rotation={[Math.PI, 0, 0]} visible={false}>
        <coneGeometry args={[0.28, 0.55, 4]} />
        <meshBasicMaterial color="#9ef0ff" />
      </mesh>
      <Player boxes={boxes} start={LEVEL06.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
