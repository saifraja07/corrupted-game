// The Level 11 maze as data, plus the pure helpers that prove things about it (solvable, signs lie, decoys are
// dead ends). Grid rows run north (top, -Z) to south (bottom, +Z); columns run west (-X) to east (+X).
//   '#' wall   '.' floor   'S' start   'E' the real exit
export const CELL = 3 // metres per cell: corridors are 3 m wide, far wider than the player
export const GRID = Object.freeze([
  '.#...#E',
  '.###.#.',
  '.#.....',
  '.#.###.',
  '.#...#.',
  '.###.#.',
  'S....#.',
])
export const ROWS = GRID.length
export const COLS = GRID[0].length

const find = (ch) => {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (GRID[r][c] === ch) return [r, c]
  throw new Error(`maze has no '${ch}'`)
}
export const START = find('S')
export const EXIT = find('E')

export const isWall = (r, c) => r < 0 || c < 0 || r >= ROWS || c >= COLS || GRID[r][c] === '#'
export const isOpen = (r, c) => !isWall(r, c)
export const cellCenter = (r, c) => ({ x: (c - (COLS - 1) / 2) * CELL, z: (r - (ROWS - 1) / 2) * CELL })

// N is -Z (up the grid), E is +X.
export const DIRS = Object.freeze({ N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] })
export const DIR_NAMES = Object.freeze({ N: 'NORTH', E: 'EAST', S: 'SOUTH', W: 'WEST' })

export function openNeighbors(r, c) {
  return Object.values(DIRS)
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => isOpen(nr, nc))
}

const key = (r, c) => `${r},${c}`

// Steps from every reachable cell to `target` (breadth-first).
export function distancesTo([tr, tc]) {
  const dist = new Map([[key(tr, tc), 0]])
  const queue = [[tr, tc]]
  while (queue.length) {
    const [r, c] = queue.shift()
    for (const [nr, nc] of openNeighbors(r, c)) {
      if (!dist.has(key(nr, nc))) {
        dist.set(key(nr, nc), dist.get(key(r, c)) + 1)
        queue.push([nr, nc])
      }
    }
  }
  return dist
}
export const distanceAt = (dist, r, c) => dist.get(key(r, c)) ?? Infinity

// The shortest route from `from` to the exit, as a list of [r, c] cells (or null if there is none).
export function solutionPath(from = START, to = EXIT) {
  const dist = distancesTo(to)
  if (!dist.has(key(from[0], from[1]))) return null
  const path = [from]
  let [r, c] = from
  while (r !== to[0] || c !== to[1]) {
    const next = openNeighbors(r, c).find(([nr, nc]) => distanceAt(dist, nr, nc) === distanceAt(dist, r, c) - 1)
    ;[r, c] = next
    path.push(next)
  }
  return path
}

export function wallCells() {
  const out = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (GRID[r][c] === '#') out.push({ r, c, ...cellCenter(r, c) })
  return out
}

// Doors sit in the outer north/south walls, at the end of a corridor.
export const DECOYS = Object.freeze([
  { cell: [0, 0], wall: 'N' },
  { cell: [0, 2], wall: 'N' },
  { cell: [6, 6], wall: 'S' },
])
export const REAL_EXIT = Object.freeze({ cell: EXIT, wall: 'N' })

export function doorPlacement({ cell, wall }) {
  const { x } = cellCenter(cell[0], cell[1])
  const edge = (ROWS * CELL) / 2
  return wall === 'N' ? { x, z: -edge + 0.1, rotationY: 0 } : { x, z: edge - 0.1, rotationY: Math.PI }
}

// Signs that LIE: each hangs on a wall of `cell` and names a direction that leads away from the exit.
export const SIGNS = Object.freeze([
  { cell: [6, 0], wall: 'W', says: 'N' },
  { cell: [6, 2], wall: 'S', says: 'W' },
  { cell: [4, 4], wall: 'E', says: 'S' },
  { cell: [2, 2], wall: 'W', says: 'S' },
  { cell: [2, 4], wall: 'S', says: 'N' },
  { cell: [2, 6], wall: 'E', says: 'S' },
  { cell: [1, 6], wall: 'E', says: 'S' },
])

const ROT = { N: 0, S: Math.PI, W: Math.PI / 2, E: -Math.PI / 2 } // a sign on that wall faces into the cell

export function signPlacement({ cell, wall }) {
  const { x, z } = cellCenter(cell[0], cell[1])
  const [dr, dc] = DIRS[wall]
  const off = CELL / 2 - 0.06
  return { x: x + dc * off, z: z + dr * off, rotationY: ROT[wall] }
}

// Which way the player is facing (yaw 0 faces north/-Z; positive yaw turns left).
export function headingName(yaw) {
  const fx = -Math.sin(yaw)
  const fz = -Math.cos(yaw)
  if (Math.abs(fz) >= Math.abs(fx)) return fz < 0 ? 'NORTH' : 'SOUTH'
  return fx > 0 ? 'EAST' : 'WEST'
}
