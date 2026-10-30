import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel08Logic } from './level08/createLevel08Logic.js'
import { DOOR, LEVEL08, getRoomLayout } from './level08/layout.js'
import { fillView } from '../mechanics/lookAway.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

// A dark, faceless figure. It is MOUNTED only once it exists (not hidden): Three.js raycasts ignore
// `visible`, so an invisible presence would silently block the player from targeting things behind it.
function Presence({ groupRef, start, enabled, onFollow }) {
  return (
    <Interactable id="l8-presence" prompt="Follow" enabled={enabled} onInteract={onFollow}>
      <group ref={groupRef} position={[start.x, 0, start.z]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.26, 0.3, 1.8, 14]} />
          <meshStandardMaterial color="#0b0b0e" />
        </mesh>
        <mesh position={[0, 2.0, 0]}>
          <sphereGeometry args={[0.22, 14, 14]} />
          <meshStandardMaterial color="#0b0b0e" />
        </mesh>
      </group>
    </Interactable>
  )
}

// Scene for Level 8. All rules live in createLevel08Logic; the room's size, doors, sign and collision
// are derived from the current variant, and React only re-renders when that variant (or the
// presence's existence) actually changes. The presence's per-frame position is written to a ref.
export default function Level08() {
  const worldRef = useRef(null)
  const playerRef = useRef(null)
  const presenceRef = useRef(null)
  const view = useRef({ x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: -1 })
  const [logic] = useState(() => createLevel08Logic(createLevelCallbacks(LEVEL08.id)))
  const [variant, setVariant] = useState(0)
  const [presenceOn, setPresenceOn] = useState(false)
  const [done, setDone] = useState(false)

  const layout = useMemo(() => getRoomLayout(variant), [variant])
  const boxes = useMemo(
    () => [
      ...roomBoundsToBoxes(layout.room.width, layout.room.depth),
      ...layout.doors.map((d) => makeBox(d.x, layout.doorZ, DOOR.width, 0.3)), // fake doors never open
    ],
    [layout],
  )

  useLevelLifecycle(logic, LEVEL08.objective)

  useFrame((frame, delta) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const c = frame.camera
    logic.update(fillView(view.current, c.position, c.rotation.y, c.rotation.x), Math.min(delta, 0.05))
    if (logic.getVariant() !== variant) setVariant(logic.getVariant())
    if (logic.isPresenceVisible() !== presenceOn) setPresenceOn(logic.isPresenceVisible())
    const g = presenceRef.current
    if (g) {
      const p = logic.getPresence()
      g.position.set(p.x, 0, p.z)
    }
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...layout.room}>
          {layout.doors.map((d) => (
            <Interactable
              key={d.id}
              id={d.id}
              prompt="Open Exit"
              enabled={!done}
              onInteract={() => {
                if (logic.useDoor(d.index)) {
                  const [sx, sz] = logic.getSpawn() // the room may just have changed
                  playerRef.current?.teleport(sx, sz, 0)
                }
              }}
            >
              <Door position={[d.x, 0, layout.doorZ]} width={DOOR.width} height={DOOR.height} />
            </Interactable>
          ))}
          <Sign text={layout.sign} position={[layout.room.width / 2 - 0.11, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} width={2.8} height={0.6} />
          {presenceOn && (
            <Presence
              groupRef={presenceRef}
              start={logic.getPresence()}
              enabled={!done}
              onFollow={() => {
                if (logic.followPresence()) setDone(true)
              }}
            />
          )}
        </Room>
      </group>
      <Player ref={playerRef} boxes={boxes} start={getRoomLayout(0).spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
