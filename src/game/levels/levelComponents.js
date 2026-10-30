import { lazy } from 'react'

// Level scenes load on demand (code-split), so unplayed levels cost nothing up front.
// Every id in config/levels.js must have an entry here (checked by tests).
export const LEVEL_COMPONENTS = {
  level01: lazy(() => import('./Level01.jsx')),
  level02: lazy(() => import('./Level02.jsx')),
  level03: lazy(() => import('./Level03.jsx')),
  level04: lazy(() => import('./Level04.jsx')),
  level05: lazy(() => import('./Level05.jsx')),
  level06: lazy(() => import('./Level06.jsx')),
  level07: lazy(() => import('./Level07.jsx')),
  level08: lazy(() => import('./Level08.jsx')),
}
