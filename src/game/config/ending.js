// Ending copy as data. The secret pays off the HUD line shown late in the game ("STOP LOOKING FOR A DOOR.").

// After "The Last Room": a FALSE ending. It looks final, then the game "crashes" and carries on.
export const FAKE_ENDING_TEXT = {
  title: 'Exit found.',
  lines: ['Congratulations. You followed instructions.', 'Every one of them.', 'That was the problem.'],
}
export const FAKE_CRASH_TEXT = {
  title: 'FATAL ERROR',
  lines: ['The ending could not be found.'],
  reveal: 'Of course it could not. This was not the ending.',
}

// After the real final level.
export const TRUE_ENDING_TEXT = {
  title: 'Exit found. For real this time.',
  lines: ['Nothing here was ever trying to help.', 'You trusted nothing. It worked.', 'Thank you for playing.'],
}
export const ENDING_TEXT = TRUE_ENDING_TEXT

export const SECRET_TEXT = {
  title: 'There was never a door.',
  lines: ['You kept looking for one.', 'Corrupted was never a place you could leave.', 'Thank you for playing.'],
}
