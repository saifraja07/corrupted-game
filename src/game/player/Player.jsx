import { useEffect, useImperativeHandle, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { createPlayerInput } from './PlayerInput.js'
import { applyLook, clampDelta, computeMove } from './PlayerController.js'
import { moveWithCollisions } from './CollisionSystem.js'
import { useGameStore } from '../state/gameStore.js'
import { useSettingsStore } from '../state/settingsStore.js'
import { GAME_STATES as S, PLAYER } from '../core/GameConfig.js'

// First-person player. Position and look angles live in refs; nothing here re-renders React per frame.
// `modifiers` (optional) remaps input (reversed controls). `ref` exposes teleport(x, z, yaw) for fake exits.
export default function Player({ boxes, start = [0, 5], modifiers, ref }) {
  const canvas = useThree((s) => s.gl.domElement)
  const input = useRef(null)
  const state = useRef({
    pos: { x: start[0], z: start[1] },
    look: { yaw: 0, pitch: 0 },
    axes: { x: 0, z: 0 },
    move: { x: 0, z: 0 },
  })

  useImperativeHandle(
    ref,
    () => ({
      teleport(x, z, yaw = 0) {
        const s = state.current
        s.pos.x = x
        s.pos.z = z
        s.look.yaw = yaw
        s.look.pitch = 0
      },
    }),
    [],
  )

  // Input listeners + pointer lock / focus handling. All removed on unmount.
  useEffect(() => {
    const inp = createPlayerInput()
    input.current = inp
    inp.attach()

    const pauseIfPlaying = () => {
      inp.reset()
      const g = useGameStore.getState()
      if (g.status === S.PLAYING) g.pause()
    }
    const onLockChange = () => {
      if (document.pointerLockElement !== canvas) pauseIfPlaying()
    }
    const onMouseMove = (e) => {
      if (document.pointerLockElement !== canvas) return
      if (useGameStore.getState().status !== S.PLAYING) return
      applyLook(state.current.look, e.movementX, e.movementY, useSettingsStore.getState().mouseSensitivity)
    }
    const onVisibility = () => {
      if (document.hidden) pauseIfPlaying()
    }

    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pauseIfPlaying)
    return () => {
      inp.detach()
      input.current = null
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pauseIfPlaying)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    }
  }, [canvas])

  useFrame((frame, delta) => {
    const s = state.current
    const cam = frame.camera
    cam.rotation.order = 'YXZ'
    cam.rotation.set(s.look.pitch, s.look.yaw, 0)

    // Movement only while playing with the pointer locked.
    if (useGameStore.getState().status === S.PLAYING && document.pointerLockElement === canvas && input.current) {
      input.current.axes(s.axes)
      if (modifiers) modifiers.apply(s.axes)
      computeMove(s.move, s.axes, s.look.yaw, PLAYER.walkSpeed, clampDelta(delta))
      moveWithCollisions(s.pos, s.move.x, s.move.z, PLAYER.radius, boxes)
    }
    cam.position.set(s.pos.x, PLAYER.eyeHeight, s.pos.z)
  })

  return null
}
