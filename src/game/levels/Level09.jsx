import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Room from '../world/Room.jsx'
import Door from '../world/Door.jsx'
import Sign from '../world/Sign.jsx'
import Interactable from '../world/Interactable.jsx'
import Player from '../player/Player.jsx'
import PlayerInteraction from '../player/PlayerInteraction.jsx'
import { makeBox, roomBoundsToBoxes } from '../player/CollisionSystem.js'
import { createLevel09Logic } from './level09/createLevel09Logic.js'
import { LEVEL09 } from './level09/layout.js'
import { createLevelCallbacks } from './levelCallbacks.js'
import { useLevelLifecycle } from '../../hooks/useLevelLifecycle.js'
import { useGameStore } from '../state/gameStore.js'

const { room, decoy, real } = LEVEL09

// Level 9: two doors. The obvious EXIT is a decoy that triggers a FAKE "Level complete" screen (recording
// nothing); having fallen for it unlocks the real door. The sign over the real door flips when it unlocks.
export default function Level09() {
  const worldRef = useRef(null)
  const [exited, setExited] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [logic] = useState(() => createLevel09Logic(createLevelCallbacks(LEVEL09.id)))

  const boxes = useMemo(
    () => [
      ...roomBoundsToBoxes(room.width, room.depth),
      makeBox(decoy.x, decoy.z, decoy.width, 0.3), // the decoy never opens
      makeBox(real.x, real.z, real.width, 0.3, () => !logic.isDoorOpen()),
    ],
    [logic],
  )

  useLevelLifecycle(logic, LEVEL09.objective)

  useFrame(() => {
    const now = logic.isRealUnlocked()
    if (now !== unlocked) setUnlocked(now) // React re-renders only when the real door unlocks
  })

  return (
    <>
      <group ref={worldRef}>
        <Room {...room}>
          <Interactable
            id="l9-decoy"
            prompt="Open Exit"
            onInteract={() => {
              if (logic.useDecoy()) {
                // First time only: show the fake "Level complete" screen. This records nothing and is undone
                // by the screen itself (loading bar, error, back here).
                if (useGameStore.getState().fakeLevelComplete()) globalThis.document?.exitPointerLock?.()
              }
            }}
          >
            <Door position={[decoy.x, 0, decoy.z]} width={decoy.width} height={decoy.height} />
          </Interactable>
          <Interactable
            id="l9-real"
            prompt="Open Door"
            enabled={!exited}
            onInteract={() => {
              if (logic.useRealExit()) setExited(true)
            }}
          >
            <Door position={[real.x, 0, real.z]} width={real.width} height={real.height} getOpen={logic.isDoorOpen} />
          </Interactable>
          <Sign text={decoy.signText} position={[decoy.x, 2.7, -5.98]} width={1.6} height={0.5} />
          <Sign text={unlocked ? real.unlockedText : real.lockedText} position={[real.x, 2.7, -5.98]} width={2.2} height={0.5} />
        </Room>
      </group>
      <Player boxes={boxes} start={LEVEL09.spawn} />
      <PlayerInteraction worldRef={worldRef} />
    </>
  )
}
