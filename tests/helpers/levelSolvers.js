import { createLevel01Logic } from '../../src/game/levels/level01/createLevel01Logic.js'
import { createLevel02Logic } from '../../src/game/levels/level02/createLevel02Logic.js'
import { createLevel03Logic } from '../../src/game/levels/level03/createLevel03Logic.js'
import { createLevel04Logic } from '../../src/game/levels/level04/createLevel04Logic.js'
import { createLevel05Logic } from '../../src/game/levels/level05/createLevel05Logic.js'
import { SEQUENCE } from '../../src/game/levels/level05/sequencePuzzle.js'
import { createLevel06Logic } from '../../src/game/levels/level06/createLevel06Logic.js'
import { CORRECT_BUTTON } from '../../src/game/levels/level06/lightsOutPuzzle.js'
import { createLevel07Logic } from '../../src/game/levels/level07/createLevel07Logic.js'
import { fillView } from '../../src/game/mechanics/lookAway.js'
import { createLevel09Logic } from '../../src/game/levels/level09/createLevel09Logic.js'
import { createLevel10Logic } from '../../src/game/levels/level10/createLevel10Logic.js'
import { createLevel11Logic } from '../../src/game/levels/level11/createLevel11Logic.js'
import { createLevel12Logic } from '../../src/game/levels/level12/createLevel12Logic.js'
import { createLevel08Logic } from '../../src/game/levels/level08/createLevel08Logic.js'
import { createLevel13Logic } from '../../src/game/levels/level13/createLevel13Logic.js'
import { createLevel14Logic } from '../../src/game/levels/level14/createLevel14Logic.js'
import { createLevel15Logic } from '../../src/game/levels/level15/createLevel15Logic.js'
import { createLevel16Logic } from '../../src/game/levels/level16/createLevel16Logic.js'
import { createLevel17Logic } from '../../src/game/levels/level17/createLevel17Logic.js'
import { createLevel18Logic } from '../../src/game/levels/level18/createLevel18Logic.js'
import { LEVEL13 } from '../../src/game/levels/level13/layout.js'
import { LEVEL15 } from '../../src/game/levels/level15/layout.js'
import { LEVEL16 } from '../../src/game/levels/level16/layout.js'
import { LEVEL17 } from '../../src/game/levels/level17/layout.js'
import { LEVEL18 } from '../../src/game/levels/level18/layout.js'

// Each level's intended solution, expressed through its logic API. Returns true when the exit worked.
export const SOLVERS = {
  level01: (l) => {
    l.pressButton()
    return l.useExit()
  },
  level02: (l) => {
    l.pressA()
    l.pressB()
    return l.useExit()
  },
  level03: (l) => {
    l.update({ x: 0, z: 1 })
    l.pressCalibrate()
    return l.useExit()
  },
  level04: (l) => {
    l.useFakeExit()
    return l.useRealExit()
  },
  level05: (l) => {
    for (const color of SEQUENCE) l.pressColor(color) // the order the lamps show
    return l.useExit()
  },
  level06: (l) => {
    l.pressButton(CORRECT_BUTTON) // the one the glow marks, not the one the sign names
    return l.useExit()
  },
  level07: (l) => {
    // Near the gate but looking sideways (it opens), then on the far side of it, then the exit.
    l.update(fillView({}, { x: 0, y: 1.6, z: 1.5 }, -Math.PI / 2, 0), 500)
    l.update(fillView({}, { x: 0, y: 1.6, z: -3 }, 0, 0), 16)
    return l.useExit()
  },
  level09: (l) => {
    l.useDecoy() // falling for the fake "Level complete" is what unlocks the real door
    return l.useRealExit()
  },
  level10: (l) => {
    const still = { x: 0, z: 5, yaw: 0, pitch: 0 }
    l.update(still, 0)
    l.update(still, 9000) // eight seconds of doing nothing
    return l.useExit()
  },
  level11: (l) => l.useExit(), // the maze itself is proven solvable separately, with a simulated player
  level12: (l) => l.useMetaExit(), // the pause menu's EXIT button, reached through the same logic call
  level08: (l) => {
    l.useDoor(0) // every door is fake; the first one makes the presence appear
    return l.followPresence()
  },
  level13: (l) => {
    for (let i = 0; i < LEVEL13.redPressesRequired; i++) l.pressRed() // disobey the sign
    return l.useExit()
  },
  level14: (l) => {
    l.press(0) // all three, one straight after the other: inside any window
    l.press(1)
    l.press(2)
    return l.useExit()
  },
  level15: (l) => {
    l.update({ x: LEVEL15.leanX - 0.1, z: 0 }, LEVEL15.leanRequiredMs + 10) // stand against the west wall
    return l.useExit()
  },
  level16: (l) => {
    // Face the eye (yaw -90 degrees looks along +X) and keep looking.
    l.update(fillView({}, { x: 0, y: 1.6, z: 0 }, -Math.PI / 2, 0), LEVEL16.stareRequiredMs + 10)
    return l.useExit()
  },
  level17: (l) => {
    for (let i = 0; i < LEVEL17.knocksRequired; i++) {
      l.update(LEVEL17.knockGapMs + 10) // one knock at a time
      l.knock()
    }
    return l.isExitDone()
  },
  level18: (l) => {
    l.pressLeft()
    l.update(LEVEL18.waitMs + 10) // believe the sign: wait five seconds
    return l.useExit()
  },
}

export const FACTORIES = { level01: createLevel01Logic, level02: createLevel02Logic, level03: createLevel03Logic, level04: createLevel04Logic, level05: createLevel05Logic, level06: createLevel06Logic, level07: createLevel07Logic, level08: createLevel08Logic, level09: createLevel09Logic, level10: createLevel10Logic, level11: createLevel11Logic, level12: createLevel12Logic, level13: createLevel13Logic, level14: createLevel14Logic, level15: createLevel15Logic, level16: createLevel16Logic, level17: createLevel17Logic, level18: createLevel18Logic }
