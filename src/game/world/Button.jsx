import Interactable from './Interactable.jsx'

// Wall button. Front faces +Z locally; rotate the group to mount on other walls.
export default function Button({ id, position, rotation, pressed = false, prompt = 'Press Button', onPress, enabled = true, range, color = '#ef4444' }) {
  return (
    <Interactable id={id} prompt={prompt} onInteract={onPress} enabled={enabled} range={range} position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#a1a1aa" />
      </mesh>
      <mesh position={[0, 0, pressed ? 0.03 : 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 20]} />
        <meshStandardMaterial color={pressed ? '#22c55e' : color} />
      </mesh>
    </Interactable>
  )
}
