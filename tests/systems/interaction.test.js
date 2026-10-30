import { describe, it, expect, vi } from 'vitest'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import {
  createInteractionRegistry,
  pickInteraction,
  resolveInteractableId,
  promptText,
} from '../../src/game/systems/InteractionSystem.js'

// Real Three.js raycasting (no renderer needed). Player ray: from origin looking down -Z.
const mat = new MeshBasicMaterial()
const box = (x, y, z, w = 1, h = 1, d = 0.2) => {
  const m = new Mesh(new BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  return m
}
function castFromOrigin(world) {
  world.updateMatrixWorld(true)
  const rc = new Raycaster(new Vector3(0, 0, 0), new Vector3(0, 0, -1), 0, 10)
  return rc.intersectObject(world, true)
}
function button(id, z) {
  const g = new Group()
  g.userData = { interactableId: id }
  g.add(box(0, 0, z, 0.4, 0.4, 0.1)) // child mesh, id lives on the parent group
  return g
}

describe('registry', () => {
  it('registers, unregisters, and ignores stale unregisters', () => {
    const r = createInteractionRegistry()
    const def = { prompt: 'X' }
    const off = r.register('a', def)
    expect(r.has('a')).toBe(true)
    off()
    expect(r.has('a')).toBe(false)
    const off1 = r.register('a', def)
    const def2 = { prompt: 'Y' }
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    r.register('a', def2) // duplicate replaces
    off1() // stale: must not remove def2
    expect(r.get('a')).toBe(def2)
  })
})

describe('target picking', () => {
  it('resolves the id from a child mesh via its parent', () => {
    const g = button('b', -2)
    expect(resolveInteractableId(g.children[0])).toBe('b')
    expect(resolveInteractableId(box(0, 0, 0))).toBe(null)
  })

  it('targets an interactable in range', () => {
    const r = createInteractionRegistry()
    r.register('b', { prompt: 'Press Button', range: 2.5 })
    const world = new Group()
    world.add(button('b', -2))
    const t = pickInteraction(castFromOrigin(world), r)
    expect(t?.id).toBe('b')
    expect(promptText(t.def)).toBe('[E] Press Button')
  })

  it('rejects an interactable beyond its range', () => {
    const r = createInteractionRegistry()
    r.register('b', { prompt: 'P', range: 2.5 })
    const world = new Group()
    world.add(button('b', -4))
    expect(pickInteraction(castFromOrigin(world), r)).toBe(null)
  })

  it('is blocked by a wall between the player and the object', () => {
    const r = createInteractionRegistry()
    r.register('b', { prompt: 'P', range: 5 })
    const world = new Group()
    world.add(box(0, 0, -1.5, 4, 4, 0.2)) // wall
    world.add(button('b', -3)) // behind the wall, within range
    expect(pickInteraction(castFromOrigin(world), r)).toBe(null)
  })

  it('ignores disabled and unregistered interactables', () => {
    const r = createInteractionRegistry()
    const world = new Group()
    world.add(button('b', -2))
    expect(pickInteraction(castFromOrigin(world), r)).toBe(null) // unregistered
    r.register('b', { prompt: 'P', enabled: false })
    expect(pickInteraction(castFromOrigin(world), r)).toBe(null)
  })

  it('returns null when nothing is hit', () => {
    expect(pickInteraction([], createInteractionRegistry())).toBe(null)
  })

  it('picks the nearest of two overlapping interactables', () => {
    const r = createInteractionRegistry()
    r.register('near', { prompt: 'N' })
    r.register('far', { prompt: 'F' })
    const world = new Group()
    world.add(button('far', -2.2))
    world.add(button('near', -1.5))
    expect(pickInteraction(castFromOrigin(world), r)?.id).toBe('near')
  })
})
