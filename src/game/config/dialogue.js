// Dialogue content as data. Presentation lives in components/ui/DialogueBox.jsx.
export const LEVEL01_DIALOGUE = [
  { id: 'l1_welcome', level: 'level01', trigger: 'level_start', text: 'Welcome! This should be easy.', priority: 1, duration: 3500 },

  { id: 'l1_reject_1', level: 'level01', trigger: 'door_rejected', text: "You're getting closer. Technically.", priority: 2, duration: 2800 },
  { id: 'l1_reject_2', level: 'level01', trigger: 'door_rejected', text: 'Have you considered walking faster?', priority: 2, duration: 2800 },
  { id: 'l1_reject_3', level: 'level01', trigger: 'door_rejected', text: "Excellent. You're losing an argument with a door.", priority: 2, duration: 3200 },
  { id: 'l1_reject_4', level: 'level01', trigger: 'door_rejected', text: 'This is a perfectly normal door.', priority: 2, duration: 2800 },

  { id: 'l1_hint_1', level: 'level01', trigger: 'hint_1', text: 'Interesting strategy. Not a good one, but interesting.', priority: 3, duration: 3500 },
  { id: 'l1_hint_2', level: 'level01', trigger: 'hint_2', text: 'Not everything worth finding is in front of you.', priority: 3, duration: 4000 },

  { id: 'l1_button', level: 'level01', trigger: 'button_pressed', text: "That wasn't supposed to work.", priority: 3, duration: 3000 },
  { id: 'l1_complete', level: 'level01', trigger: 'level_complete', text: "Congratulations. You followed instructions. That's unfortunate.", priority: 4, duration: 4000 },
]

export const LEVEL02_DIALOGUE = [
  { id: 'l2_welcome', level: 'level02', trigger: 'level_start', text: 'Another room. Another door. Try not to overthink it.', priority: 1, duration: 3800 },
  { id: 'l2_a', level: 'level02', trigger: 'button_a', text: 'Well, that was suspiciously easy.', priority: 2, duration: 3000 },
  { id: 'l2_b', level: 'level02', trigger: 'button_b', text: 'Fine. You found the other one.', priority: 2, duration: 3000 },
  { id: 'l2_locked', level: 'level02', trigger: 'door_locked', text: 'The door disagrees.', priority: 3, duration: 2500 },
  { id: 'l2_hint', level: 'level02', trigger: 'hint_look_up', text: 'Have you tried looking up?', priority: 3, duration: 4000 },
  { id: 'l2_complete', level: 'level02', trigger: 'level_complete', text: 'Two buttons. Remarkable. Truly.', priority: 4, duration: 4000 },
]

export const LEVEL03_DIALOGUE = [
  { id: 'l3_welcome', level: 'level03', trigger: 'level_start', text: 'This room is perfectly calibrated.', priority: 1, duration: 3500 },
  { id: 'l3_reversed', level: 'level03', trigger: 'controls_reversed', text: 'Controls updated. You are welcome.', priority: 3, duration: 3500 },
  { id: 'l3_hint', level: 'level03', trigger: 'hint_reversed', text: 'Everything is the opposite. Use that.', priority: 3, duration: 4000 },
  { id: 'l3_calibrated', level: 'level03', trigger: 'calibrated', text: 'Better? I thought so.', priority: 4, duration: 3000 },
  { id: 'l3_complete', level: 'level03', trigger: 'level_complete', text: 'You adapted. Disappointing.', priority: 4, duration: 4000 },
]

export const LEVEL04_DIALOGUE = [
  { id: 'l4_welcome', level: 'level04', trigger: 'level_start', text: 'The sign has all the answers.', priority: 1, duration: 3500 },
  { id: 'l4_fake_1', level: 'level04', trigger: 'fake_exit', text: 'Welcome back.', priority: 2, duration: 2500 },
  { id: 'l4_fake_2', level: 'level04', trigger: 'fake_exit', text: "Wasn't that the exit? How strange.", priority: 2, duration: 3000 },
  { id: 'l4_fake_3', level: 'level04', trigger: 'fake_exit', text: 'I did say left.', priority: 2, duration: 2500 },
  { id: 'l4_fake_4', level: 'level04', trigger: 'fake_exit', text: 'Doors are more like suggestions.', priority: 2, duration: 3000 },
  { id: 'l4_fake_5', level: 'level04', trigger: 'fake_exit', text: 'You have been here before.', priority: 2, duration: 3000, minStage: 3 },
  { id: 'l4_sign', level: 'level04', trigger: 'sign_changed', text: 'Did that sign always say that?', priority: 3, duration: 3500 },
  { id: 'l4_complete', level: 'level04', trigger: 'level_complete', text: 'Right. Obviously right. I was testing you.', priority: 4, duration: 4000 },
]

// Global lines (no level): played when the corruption stage rises. minStage/maxStage gate any line.
export const CORRUPTION_DIALOGUE = [
  { id: 'c_stage_1', trigger: 'corruption_stage_1', text: "That wasn't in the manual.", priority: 2, duration: 3000 },
  { id: 'c_stage_2', trigger: 'corruption_stage_2', text: 'Everything is functioning within acceptable parameters.', priority: 3, duration: 4000 },
  { id: 'c_stage_3', trigger: 'corruption_stage_3', text: 'WARNING: PLAYER BEHAVIOR OUTSIDE EXPECTED PARAMETERS.', priority: 3, duration: 4500 },
]

export const LEVEL08_DIALOGUE = [
  { id: 'l8_welcome', level: 'level08', trigger: 'level_start', text: 'Last room. Probably.', priority: 1, duration: 3500 },
  { id: 'l8_idle', level: 'level08', trigger: 'hint_try_door', text: 'The doors are right there.', priority: 2, duration: 3500 },
  { id: 'l8_door_1', level: 'level08', trigger: 'door_fake', text: 'Not that one.', priority: 2, duration: 2500 },
  { id: 'l8_door_2', level: 'level08', trigger: 'door_fake', text: 'Or that one.', priority: 2, duration: 2500 },
  { id: 'l8_door_3', level: 'level08', trigger: 'door_fake', text: 'Did the room just get bigger?', priority: 2, duration: 3000 },
  { id: 'l8_presence', level: 'level08', trigger: 'presence_appears', text: 'You are not alone in here.', priority: 3, duration: 4000 },
  { id: 'l8_stop', level: 'level08', trigger: 'hint_stop_looking', text: 'HINT: STOP LOOKING FOR A DOOR.', priority: 3, duration: 4000 },
  { id: 'l8_watch', level: 'level08', trigger: 'hint_watch', text: 'It has been watching you. Try watching back.', priority: 3, duration: 4500 },
  { id: 'l8_follow', level: 'level08', trigger: 'follow', text: 'Finally.', priority: 4, duration: 2500 },
  { id: 'l8_complete', level: 'level08', trigger: 'level_complete', text: 'You were looking in the wrong direction.', priority: 4, duration: 4500 },
]

export const LEVEL05_DIALOGUE = [
  { id: 'l5_welcome', level: 'level05', trigger: 'level_start', text: 'Simple instructions. Even you can follow them.', priority: 1, duration: 3800 },
  { id: 'l5_wrong_1', level: 'level05', trigger: 'sequence_wrong', text: 'Wrong order.', priority: 2, duration: 2500 },
  { id: 'l5_wrong_2', level: 'level05', trigger: 'sequence_wrong', text: "The sign said that, didn't it?", priority: 2, duration: 3000 },
  { id: 'l5_wrong_3', level: 'level05', trigger: 'sequence_wrong', text: "Try something that isn't written down.", priority: 2, duration: 3200 },
  { id: 'l5_replay', level: 'level05', trigger: 'sequence_replay', text: 'Pay attention this time.', priority: 2, duration: 2500 },
  { id: 'l5_hint', level: 'level05', trigger: 'hint_lamps', text: 'Perhaps the lamps have something to say.', priority: 3, duration: 4000 },
  { id: 'l5_solved', level: 'level05', trigger: 'sequence_solved', text: 'That was not what the sign said.', priority: 3, duration: 3200 },
  { id: 'l5_locked', level: 'level05', trigger: 'door_locked', text: 'The door wants the order first.', priority: 3, duration: 2800 },
  { id: 'l5_complete', level: 'level05', trigger: 'level_complete', text: 'Never trust the sign.', priority: 4, duration: 4000 },
]

export const LEVEL06_DIALOGUE = [
  { id: 'l6_welcome', level: 'level06', trigger: 'level_start', text: 'Read the sign. Do exactly what it says.', priority: 1, duration: 4000 },
  { id: 'l6_wrong_1', level: 'level06', trigger: 'lights_wrong', text: 'Hm. That did nothing.', priority: 2, duration: 2800 },
  { id: 'l6_wrong_2', level: 'level06', trigger: 'lights_wrong', text: 'Are you sure you read it correctly?', priority: 2, duration: 3200 },
  { id: 'l6_hint', level: 'level06', trigger: 'hint_dark', text: 'Some things are easier to see in the dark.', priority: 3, duration: 4200 },
  { id: 'l6_unlocked', level: 'level06', trigger: 'lights_unlocked', text: 'Oh. You found it.', priority: 3, duration: 3000 },
  { id: 'l6_locked', level: 'level06', trigger: 'door_locked', text: 'Locked.', priority: 3, duration: 2200 },
  { id: 'l6_complete', level: 'level06', trigger: 'level_complete', text: 'Trust nothing. Good.', priority: 4, duration: 4000 },
]

export const LEVEL07_DIALOGUE = [
  { id: 'l7_welcome', level: 'level07', trigger: 'level_start', text: 'A gate. Keep your eyes on it, as instructed.', priority: 1, duration: 4000 },
  { id: 'l7_hint_1', level: 'level07', trigger: 'hint_blink', text: "Some things only happen when you aren't watching.", priority: 3, duration: 4500 },
  { id: 'l7_hint_2', level: 'level07', trigger: 'hint_backwards', text: 'Have you tried walking backwards?', priority: 3, duration: 4000 },
  { id: 'l7_crossed', level: 'level07', trigger: 'crossed', text: "Don't look back.", priority: 3, duration: 3000 },
  { id: 'l7_complete', level: 'level07', trigger: 'level_complete', text: 'You did not look back. Good.', priority: 4, duration: 4000 },
]
