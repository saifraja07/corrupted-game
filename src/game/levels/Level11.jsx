import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel11Logic } from './level11/createLevel11Logic.js'
import { CELL, DECOYS, DIR_NAMES, REAL_EXIT, SIGNS, cellCenter, doorPlacement, headingName, signPlacement, solutionPath, wallCells } from './level11/maze.js'
import { LEVEL11 } from './level11/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const { room, door } = LEVEL11
const WALLS = wallCells()
const TRAIL = solutionPath().map(([r, c]) => cellCenter(r, c))

// Level 11: a maze. Wall cells are solid blocks; every sign lies; decoy doors send you back to the start; the
// real exit is labelled NO EXIT. The objective shows a compass heading, since "EXIT: NORTH" must mean something.
export default function Level11() {
  const worldRef = useRef(null)
  const playerRef = useRef(null)
  const trailRef = useRef(null)
  const heading = useRef('')
  const [exited, setExited] = useState(false)
  const [logic] = useState(() => createLevel11Logic(createLevelCallbacks(LEVEL11.id)))

  const boxes = useMemo(() => {
    const doorBox = (placement, enabled) => makeBox(placement.x, placement.z, door.width, 0.3, enabled)
    return [
      ...roomBoundsToBoxes(room.width, room.depth),
      ...WALLS.map((w) => makeBox(w.x, w.z, CELL, CELL)),
      ...DECOYS.map((d) => doorBox(doorPlacement(d))), // decoys never open
      doorBox(doorPlacement(REAL_EXIT), () => !logic.isDoorOpen()),
    ]
  }, [logic])

  useLevelLifecycle(logic, LEVEL11.objective)

  useFrame((frame) => {
    if (useGameStore.getState().status !== S.PLAYING) return
    const name = headingName(frame.camera.rotation.y)
    if (name !== heading.current) {
      heading.current = name
      useGameStore.getState().setObjective(`${LEVEL11.objective} (${name})`)
    }
    if (trailRef.current) trailRef.current.visible = logic.isTrailOn()
  })

  const exit = doorPlacement(REAL_EXIT)
  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          {WALLS.map((w) => (
            <mesh key={`${w.r}-${w.c}`} position={[w.x, room.height / 2, w.z]}>
              <boxGeometry args={[CELL, room.height, CELL]} />
              <meshStandardMaterial color="#8a8d95" />
            </mesh>
          ))}

          {DECOYS.map((d, i) => {
            const p = doorPlacement(d)
            return (
              <group key={`${d.cell}`}>
                <Interactable
                  id={`l11-decoy-${i}`}
                  prompt="Open Exit"
                  onInteract={() => {
                    if (logic.useDecoy(i)) playerRef.current?.teleport(LEVEL11.spawn[0], LEVEL11.spawn[1], 0)
                  }}
                >
                  <group position={[p.x, 0, p.z]} rotation={[0, p.rotationY, 0]}>
                    <Door position={[0, 0, 0]} width={door.width} height={door.height} />
                  </group>
                </Interactable>
                <Sign text="EXIT" position={[p.x, 2.7, p.z + (p.rotationY === 0 ? -0.06 : 0.06)]} rotation={[0, p.rotationY, 0]} width={1.4} height={0.5} />
              </group>
            )
          })}

          <Interactable
            id="l11-exit"
            prompt="Open Door"
            enabled={!exited}
            onInteract={() => {
              if (logic.useExit()) setExited(true)
            }}
          >
            <group position={[exit.x, 0, exit.z]}>
              <Door position={[0, 0, 0]} width={door.width} height={door.height} getOpen={logic.isDoorOpen} />
            </group>
          </Interactable>
          <Sign text="NO EXIT" position={[exit.x, 2.7, exit.z - 0.06]} width={1.8} height={0.5} />

          {SIGNS.map((s) => {
            const p = signPlacement(s)
            return <Sign key={`${s.cell}-${s.wall}`} text={`EXIT: ${DIR_NAMES[s.says]}`} position={[p.x, 1.7, p.z]} rotation={[0, p.rotationY, 0]} width={2.2} height={0.5} />
          })}
        </Room>
      </group>

      {/* The last-resort trail: outside the raycast group, so it can never block anything. */}
      <group ref={trailRef} visible={false}>
        {TRAIL.map((t) => (
          <mesh key={`${t.x},${t.z}`} position={[t.x, 0.03, t.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35, 16]} />
            <meshBasicMaterial color="#9ef0ff" />
          </mesh>
        ))}
      </group>

      <Player ref={playerRef} boxes={boxes} start={LEVEL11.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
