import { useEffect, useRef } from 'react'
import { interactionRegistry } from '../systems/InteractionSystem.js'

// Wrap any 3D children to make them interactable. Behavior is supplied via props; the
// interaction system only sees the registered contract.
export default function Interactable({ id, prompt, onInteract, enabled = true, range, children, ...groupProps }) {
  // One stable def object registered per id; its fields are refreshed when props change.
  const def = useRef({ prompt, onInteract, enabled, range })

  useEffect(() => {
    def.current.prompt = prompt
    def.current.onInteract = onInteract
    def.current.enabled = enabled
    def.current.range = range
  }, [prompt, onInteract, enabled, range])

  useEffect(() => {
    const d = def.current
    return interactionRegistry.register(id, d)
  }, [id])

  return (
    <group userData={{ interactableId: id }} {...groupProps}>
      {children}
    </group>
  )
}
