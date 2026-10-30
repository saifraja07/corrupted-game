// Interaction logic with no React and no rendering. The system never knows what an object *does*;
// it only finds the object the player is looking at and calls its onInteract().
//
// Interactable contract (def):
//   { prompt: string, onInteract: () => void, enabled?: boolean (default true), range?: number }

export const DEFAULT_RANGE = 2.5

export function createInteractionRegistry() {
  const map = new Map()
  return {
    // Returns an unregister function. Re-registering an id replaces it (with a warning).
    register(id, def) {
      if (map.has(id)) console.warn(`[interaction] duplicate interactable id "${id}" replaced`)
      map.set(id, def)
      return () => {
        if (map.get(id) === def) map.delete(id)
      }
    },
    get: (id) => map.get(id),
    has: (id) => map.has(id),
    clear: () => map.clear(),
    get size() {
      return map.size
    },
  }
}

// Shared registry used by the game. Tests create their own.
export const interactionRegistry = createInteractionRegistry()

// Walk up the parent chain looking for the id tagged on an Object3D (userData.interactableId).
export function resolveInteractableId(object) {
  for (let o = object; o; o = o.parent) {
    const id = o.userData?.interactableId
    if (id) return id
  }
  return null
}

// `hits` must be sorted nearest-first (Three.js Raycaster does this).
// Only the FIRST hit matters: if it is a wall (or anything not interactable) the view is blocked,
// so objects behind walls can never be targeted.
export function pickInteraction(hits, registry) {
  const first = hits[0]
  if (!first) return null
  const id = resolveInteractableId(first.object)
  if (!id) return null
  const def = registry.get(id)
  if (!def || def.enabled === false) return null
  if (first.distance > (def.range ?? DEFAULT_RANGE)) return null
  return { id, def, distance: first.distance }
}

export function promptText(def) {
  return `[E] ${def.prompt}`
}
