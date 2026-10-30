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
import { createLevel05Logic } from './level05/createLevel05Logic.js'
import { COLORS, LEVEL05 } from './level05/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door } = LEVEL05

// Level 5: the sign lies about the order; the lamps tell the truth. Lamp brightness is written straight
// to each material every frame (no React renders); only the door's "exited" flag is React state.
export default function Level05() {
  const worldRef = useRef(null)
  const lampMeshes = useRef([])
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel05Logic(createLevelCallbacks(LEVEL05.id)))

  const boxes = useMemo(
    () => [...roomBoundsToBoxes(room.width, room.depth), makeBox(0, door.z, door.width, 0.3, () => !logic.isDoorOpen())],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL05.objective)

  useFrame((_, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    logic.update(Math.min(delta, 0.05) * 1000)
    lampMeshes.current.forEach((mesh, i) => {
      if (mesh) mesh.material.emissiveIntensity = 0.12 + 1.9 * logic.getLampLevel(i)
    })
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l5-exit"
            prompt="Open Exit"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <Door position={[0, 0, door.z]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
          </Interactable>

          <Sign text={LEVEL05.signText} position={[-3.89, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} width={3.4} height={0.6} />

          {COLORS.map((c, i) => (
            <group key={c.name}>
              <mesh
                ref={(m) => {
                  lampMeshes.current[i] = m
                }}
                position={[LEVEL05.lampX, LEVEL05.lampY, LEVEL05.boardZ[i]]}
              >
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color={c.hex} emissive={c.hex} emissiveIntensity={0.12} />
              </mesh>
              <Button
                id={`l5-button-${c.name.toLowerCase()}`}
                position={[LEVEL05.buttonX, LEVEL05.buttonY, LEVEL05.boardZ[i]]}
                rotation={[0, -Math.PI / 2, 0]}
                color={c.hex}
                prompt={`Press ${c.name}`}
                onPress={() => logic.pressColor(i)}
              />
            </group>
          ))}
          <Button
            id="l5-replay"
            position={LEVEL05.replayButton.position}
            rotation={[0, LEVEL05.replayButton.rotationY, 0]}
            color="#e4e4e7"
            prompt="Replay Lamps"
            onPress={() => logic.replay()}
          />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL05.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
