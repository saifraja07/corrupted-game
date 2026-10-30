// Level order and metadata (pure data). Scene components are mapped in levels/levelComponents.js.
export const LEVELS = Object.freeze([
  Object.freeze({ id: 'level01', name: 'The Obvious Door' }),
  Object.freeze({ id: 'level02', name: 'The Easy Part' }),
  Object.freeze({ id: 'level03', name: 'Backwards' }),
  Object.freeze({ id: 'level04', name: 'The Wrong Exit' }),
  Object.freeze({ id: 'level05', name: 'Simple Instructions' }),
  Object.freeze({ id: 'level06', name: 'Lights Out' }),
  Object.freeze({ id: 'level07', name: 'Blink' }),
  Object.freeze({ id: 'level08', name: 'The Last Room' }),
])

const indexOf = (id) => LEVELS.findIndex((l) => l.id === id)

export const isValidLevelId = (id) => indexOf(id) !== -1
export const getLevel = (id) => LEVELS[indexOf(id)] ?? null
export const getLevelNumber = (id) => (isValidLevelId(id) ? indexOf(id) + 1 : null)
export const getFirstLevelId = () => LEVELS[0].id
// null after the last level
export const getNextLevelId = (id) => (isValidLevelId(id) ? (LEVELS[indexOf(id) + 1]?.id ?? null) : null)
