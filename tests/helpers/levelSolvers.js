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
import { createLevel08Logic } from '../../src/game/levels/level08/createLevel08Logic.js'

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
  level08: (l) => {
    l.useDoor(0) // every door is fake; the first one makes the presence appear
    return l.followPresence()
  },
}

export const FACTORIES = { level01: createLevel01Logic, level02: createLevel02Logic, level03: createLevel03Logic, level04: createLevel04Logic, level05: createLevel05Logic, level06: createLevel06Logic, level07: createLevel07Logic, level08: createLevel08Logic }
