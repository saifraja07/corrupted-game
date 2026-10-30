import { GAME_STATES as S } from './GameConfig.js'

// Explicit transition table: from -> allowed targets. Anything else is rejected.
const ALLOWED = Object.freeze({
  [S.MAIN_MENU]: [S.TRANSITIONING],
  [S.TRANSITIONING]: [S.PLAYING, S.MAIN_MENU],
  [S.PLAYING]: [S.PAUSED, S.LEVEL_COMPLETE, S.MAIN_MENU],
  [S.PAUSED]: [S.PLAYING, S.MAIN_MENU, S.TRANSITIONING, S.LEVEL_COMPLETE],
  [S.LEVEL_COMPLETE]: [S.TRANSITIONING, S.MAIN_MENU, S.ENDING],
  [S.ENDING]: [S.MAIN_MENU],
})

export function canTransition(from, to) {
  return Boolean(ALLOWED[from]?.includes(to))
}

// Input (movement, interaction) is only live while actually playing.
export function isGameplayActive(state) {
  return state === S.PLAYING
}
