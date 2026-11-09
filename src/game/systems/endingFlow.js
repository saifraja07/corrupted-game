// Ending screens as a tiny pure state machine.
//   true ending:  ending -> credits -> menu           (a secret ending is hidden in the credits)
//   fake ending:  ending -> credits -> crash -> the game carries on   (no secret: the credits are a lie)
export const ENDING_PAGES = Object.freeze({ ENDING: 'ending', CREDITS: 'credits', SECRET: 'secret', CRASH: 'crash' })

// Next page when the player continues; null means "leave" (menu for the true ending, next level for the fake).
export function nextPage(page, variant = 'true') {
  if (page === ENDING_PAGES.ENDING) return ENDING_PAGES.CREDITS
  if (page === ENDING_PAGES.CREDITS && variant === 'fake') return ENDING_PAGES.CRASH
  return null
}

export const canRevealSecret = (page, variant = 'true') => page === ENDING_PAGES.CREDITS && variant === 'true'
