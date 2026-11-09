import { describe, it, expect } from 'vitest'
import {
  CELL, COLS, DECOYS, DIRS, EXIT, GRID, REAL_EXIT, ROWS, SIGNS, START,
  cellCenter, distanceAt, distancesTo, doorPlacement, headingName, isOpen, isWall, openNeighbors, signPlacement, solutionPath, wallCells,
} from '../../src/game/levels/level11/maze.js'
import { LEVEL11 } from '../../src/game/levels/level11/layout.js'
import { PLAYER } from '../../src/game/core/GameConfig.js'

const toExit = distancesTo(EXIT)
const onPath = new Set(solutionPath().map(([r, c]) => `${r},${c}`))
const openCells = () => {
  const out = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (isOpen(r, c)) out.push([r, c])
  return out
}

describe('the maze is well formed', () => {
  it('is a rectangle with exactly one start and one exit', () => {
    for (const row of GRID) expect(row.length).toBe(COLS)
    expect(GRID.join('').split('S')).toHaveLength(2)
    expect(GRID.join('').split('E')).toHaveLength(2)
    expect(isOpen(...START)).toBe(true)
    expect(isOpen(...EXIT)).toBe(true)
  })
  it('has corridors far wider than the player, so nobody can get snagged on a corner', () => {
    expect(CELL).toBeGreaterThanOrEqual(2.5)
    expect(CELL).toBeGreaterThan(PLAYER.radius * 8)
  })
  it('is big enough to explore, not a corridor', () => {
    expect(openCells().length).toBeGreaterThanOrEqual(25)
    expect(wallCells().length).toBeGreaterThanOrEqual(15)
  })
})

describe('the maze is beatable', () => {
  it('has a route from the start to the exit, step by step through open cells', () => {
    const path = solutionPath()
    expect(path).not.toBe(null)
    expect(path[0]).toEqual(START)
    expect(path[path.length - 1]).toEqual(EXIT)
    for (let i = 1; i < path.length; i++) {
      const [pr, pc] = path[i - 1]
      const [r, c] = path[i]
      expect(Math.abs(pr - r) + Math.abs(pc - c)).toBe(1)
      expect(isOpen(r, c)).toBe(true)
    }
  })
  it('the route is long enough to need real exploration', () => {
    expect(solutionPath().length).toBeGreaterThanOrEqual(12)
  })
  it('there are no sealed-off pockets: every open cell connects to the start and to the exit', () => {
    const fromStart = distancesTo(START)
    for (const [r, c] of openCells()) {
      expect(distanceAt(fromStart, r, c), `${r},${c} from start`).toBeLessThan(Infinity)
      expect(distanceAt(toExit, r, c), `${r},${c} to exit`).toBeLessThan(Infinity)
    }
  })
  it('the exit is in the opposite corner from the start (what the hint says)', () => {
    expect(EXIT[0]).toBe(0)
    expect(EXIT[1]).toBe(COLS - 1)
    expect(START[0]).toBe(ROWS - 1)
    expect(START[1]).toBe(0)
  })
})

describe('the decoys are real dead ends, and the signs all lie', () => {
  it('every decoy door sits at the end of a dead-end corridor, off the solution route', () => {
    expect(DECOYS.length).toBeGreaterThanOrEqual(3)
    for (const d of DECOYS) {
      expect(openNeighbors(...d.cell), `${d.cell}`).toHaveLength(1) // one way in, no way on
      expect(onPath.has(d.cell.join(',')), `${d.cell} is on the route`).toBe(false)
      expect(d.cell[0]).toBe(d.wall === 'N' ? 0 : ROWS - 1) // against the wall its door is in
    }
  })
  it('the real exit is at the end of the route, in the north wall', () => {
    expect(REAL_EXIT.cell).toEqual(EXIT)
    expect(REAL_EXIT.wall).toBe('N')
    expect(DECOYS.some((d) => d.cell.join() === EXIT.join())).toBe(false)
  })
  it('there are plenty of signs', () => {
    expect(SIGNS.length).toBeGreaterThanOrEqual(6)
  })
  for (const s of SIGNS) {
    it(`the sign in ${s.cell} on its ${s.wall} wall hangs on a real wall and points the wrong way`, () => {
      const [r, c] = s.cell
      expect(isOpen(r, c)).toBe(true)
      const [wr, wc] = DIRS[s.wall]
      expect(isWall(r + wr, c + wc)).toBe(true) // it is attached to something
      const [dr, dc] = DIRS[s.says]
      const [nr, nc] = [r + dr, c + dc]
      expect(isOpen(nr, nc)).toBe(true) // it names a way you could actually go ...
      expect(distanceAt(toExit, nr, nc)).toBeGreaterThanOrEqual(distanceAt(toExit, r, c)) // ... which is no closer to the exit
    })
  }
  it('no sign ever sends you along the real route', () => {
    for (const s of SIGNS) {
      const [r, c] = s.cell
      const [dr, dc] = DIRS[s.says]
      const next = solutionPath([r, c])?.[1]
      expect(next && next[0] === r + dr && next[1] === c + dc, `${s.cell}`).toBeFalsy()
    }
  })
})

describe('geometry', () => {
  const half = { x: (COLS * CELL) / 2, z: (ROWS * CELL) / 2 }
  it('cells map to world positions inside the room, start bottom-left and exit top-right', () => {
    for (const [r, c] of openCells()) {
      const p = cellCenter(r, c)
      expect(Math.abs(p.x)).toBeLessThan(half.x)
      expect(Math.abs(p.z)).toBeLessThan(half.z)
    }
    const s = cellCenter(...START)
    const e = cellCenter(...EXIT)
    expect(s.x).toBeLessThan(0)
    expect(s.z).toBeGreaterThan(0)
    expect(e.x).toBeGreaterThan(0)
    expect(e.z).toBeLessThan(0)
    expect(LEVEL11.spawn).toEqual([s.x, s.z])
    expect(LEVEL11.room).toMatchObject({ width: COLS * CELL, depth: ROWS * CELL })
  })
  it('doors are in the outer wall, within the corridor they serve, and face into the maze', () => {
    for (const d of [...DECOYS, REAL_EXIT]) {
      const p = doorPlacement(d)
      expect(Math.abs(p.z)).toBeGreaterThan(half.z - 0.2)
      expect(Math.abs(p.z)).toBeLessThan(half.z)
      expect(p.x).toBeCloseTo(cellCenter(...d.cell).x)
      expect(p.rotationY).toBe(d.wall === 'N' ? 0 : Math.PI)
    }
  })
  it('signs hang just inside their wall', () => {
    for (const s of SIGNS) {
      const p = signPlacement(s)
      const c = cellCenter(...s.cell)
      expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeGreaterThan(CELL / 2 - 0.2)
      expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeLessThan(CELL / 2)
    }
  })
})

describe('the compass in the objective', () => {
  it('names the way you face, matching how the player turns', () => {
    expect(headingName(0)).toBe('NORTH')
    expect(headingName(Math.PI / 2)).toBe('WEST') // turning left from north
    expect(headingName(-Math.PI / 2)).toBe('EAST')
    expect(headingName(Math.PI)).toBe('SOUTH')
    expect(headingName(-Math.PI)).toBe('SOUTH')
    expect(headingName(Math.PI * 2)).toBe('NORTH')
    expect(headingName(0.4)).toBe('NORTH')
    expect(headingName(1.2)).toBe('WEST')
  })
})
