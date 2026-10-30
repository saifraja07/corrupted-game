// Ending screens as a tiny pure state machine. The secret is only reachable from the credits.
export const ENDING_PAGES = Object.freeze({ ENDING: 'ending', CREDITS: 'credits', SECRET: 'secret' })

// Next page when the player continues; null means "leave to the main menu".
export function nextPage(page) {
  if (page === ENDING_PAGES.ENDING) return ENDING_PAGES.CREDITS
  return null
}

export const canRevealSecret = (page) => page === ENDING_PAGES.CREDITS
