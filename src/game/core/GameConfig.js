// Central, static game configuration. Keep gameplay constants here, not inline.
export const GAME_STATES = Object.freeze({
  MAIN_MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  TRANSITIONING: 'TRANSITIONING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  ENDING: 'ENDING',
})

export const PLAYER = Object.freeze({
  eyeHeight: 1.6,
  radius: 0.3,
  walkSpeed: 4,
})

export const DEFAULT_SETTINGS = Object.freeze({
  masterVolume: 0.8,
  sfxVolume: 1,
  ambientVolume: 0.7,
  mouseSensitivity: 1,
  muted: false,
  reducedMotion: false,
})
