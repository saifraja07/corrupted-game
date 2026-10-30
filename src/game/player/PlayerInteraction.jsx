import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster } from 'three'
import { interactionRegistry, pickInteraction, promptText, DEFAULT_RANGE } from '../systems/InteractionSystem.js'
import { useInteractionStore } from '../state/interactionStore.js'
import { useGameStore } from '../state/gameStore.js'
import { GAME_STATES as S } from '../core/GameConfig.js'

const CENTER = { x: 0, y: 0 }

// Raycasts from the screen center against `worldRef` (a group holding all solid/interactable objects),
// publishes the current target, and fires onInteract on a fresh E press.
export default function PlayerInteraction({ worldRef, maxDistance = DEFAULT_RANGE + 0.5 }) {
  const canvas = useThree((s) => s.gl.domElement)
  const raycaster = useRef(null)
  const hits = useRef([])
  const current = useRef(null) // latest picked { id, def }

  useEffect(() => {
    const rc = new Raycaster()
    rc.far = maxDistance // never test geometry beyond interaction reach
    raycaster.current = rc

    const onKey = (e) => {
      if (e.code !== 'KeyE' || e.repeat) return // one action per physical press
      if (useGameStore.getState().status !== S.PLAYING) return
      if (document.pointerLockElement !== canvas) return
      const target = current.current
      if (target && target.def.enabled !== false) target.def.onInteract?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      raycaster.current = null
      current.current = null
      useInteractionStore.getState().clearTarget()
    }
  }, [canvas, maxDistance])

  useFrame((frame) => {
    const world = worldRef.current
    const rc = raycaster.current
    const active = useGameStore.getState().status === S.PLAYING && document.pointerLockElement === canvas
    if (!active || !world || !rc) {
      if (current.current) {
        current.current = null
        useInteractionStore.getState().clearTarget()
      }
      return
    }
    rc.setFromCamera(CENTER, frame.camera)
    hits.current.length = 0
    rc.intersectObject(world, true, hits.current)
    const picked = pickInteraction(hits.current, interactionRegistry)
    current.current = picked
    if (picked) useInteractionStore.getState().setTarget(picked.id, promptText(picked.def))
    else useInteractionStore.getState().clearTarget()
  })

  return null
}
