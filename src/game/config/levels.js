// Level order and metadata (pure data). Scene components are mapped in levels/levelComponents.js.
export const LEVELS = Object.freeze([
  Object.freeze({ id: 'level01', name: 'The Obvious Door' }),
  Object.freeze({ id: 'level02', name: 'The Easy Part' }),
  Object.freeze({ id: 'level03', name: 'Backwards' }),
  Object.freeze({ id: 'level04', name: 'The Wrong Exit' }),
  Object.freeze({ id: 'level05', name: 'Simple Instructions' }),
  Object.freeze({ id: 'level06', name: 'Lights Out' }),
  Object.freeze({ id: 'level07', name: 'Blink' }),
  Object.freeze({ id: 'level08', name: 'The Last Room', fakeEnding: true }), // "Last room. Probably."
  Object.freeze({ id: 'level09', name: 'Almost' }),
  Object.freeze({ id: 'level10', name: 'Stillness' }),
  Object.freeze({ id: 'level11', name: 'Which Way Out' }),
  // Levels 12-17 were added later. Ids are identifiers, not positions: the finale keeps the id 'level12' and is last
  // purely because it is last in this array. New levels go in BEFORE it (next id: level19).
  Object.freeze({ id: 'level13', name: 'Do Not Press' }),
  Object.freeze({ id: 'level14', name: "Time's Up" }),
  Object.freeze({ id: 'level15', name: 'Lean In' }),
  Object.freeze({ id: 'level16', name: 'Staring Contest' }),
  Object.freeze({ id: 'level17', name: 'Knock Knock' }),
  Object.freeze({ id: 'level18', name: 'The Honest Room' }),
  Object.freeze({ id: 'level12', name: 'Exit' }), // the true finale: always keep this one last
])

const indexOf = (id) => LEVELS.findIndex((l) => l.id === id)

export const isValidLevelId = (id) => indexOf(id) !== -1
export const getLevel = (id) => LEVELS[indexOf(id)] ?? null
export const getLevelNumber = (id) => (isValidLevelId(id) ? indexOf(id) + 1 : null)
export const hasFakeEnding = (id) => Boolean(getLevel(id)?.fakeEnding)
export const getFirstLevelId = () => LEVELS[0].id
// null after the last level
export const getNextLevelId = (id) => (isValidLevelId(id) ? (LEVELS[indexOf(id) + 1]?.id ?? null) : null)
