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

export const LEVEL09_DIALOGUE = [
  { id: 'l9_welcome', level: 'level09', trigger: 'level_start', text: 'Almost there.', priority: 1, duration: 3000 },
  { id: 'l9_fake', level: 'level09', trigger: 'fake_victory', text: 'Level complete. Well done.', priority: 4, duration: 4000 },
  { id: 'l9_back', level: 'level09', trigger: 'fake_back', text: 'Did you really think it would be that easy?', priority: 3, duration: 4000 },
  { id: 'l9_decoy_1', level: 'level09', trigger: 'decoy_again', text: 'That one is finished with you.', priority: 2, duration: 2800 },
  { id: 'l9_decoy_2', level: 'level09', trigger: 'decoy_again', text: 'Nothing there. Still.', priority: 2, duration: 2800 },
  { id: 'l9_locked', level: 'level09', trigger: 'door_locked', text: 'Locked.', priority: 3, duration: 2200 },
  { id: 'l9_hint', level: 'level09', trigger: 'hint_obvious', text: 'The obvious exit is right there. Use it.', priority: 3, duration: 4000 },
  { id: 'l9_open', level: 'level09', trigger: 'real_open', text: 'Fine. Go on, then.', priority: 4, duration: 2500 },
  { id: 'l9_complete', level: 'level09', trigger: 'level_complete', text: "Never trust a 'Level complete' screen.", priority: 4, duration: 4500 },
]

export const LEVEL10_DIALOGUE = [
  { id: 'l10_welcome', level: 'level10', trigger: 'level_start', text: 'Hurry. The exit is closing.', priority: 1, duration: 3500 },
  { id: 'l10_late', level: 'level10', trigger: 'too_late', text: 'Too late. Start again.', priority: 2, duration: 3000 },
  { id: 'l10_decoy_1', level: 'level10', trigger: 'still_decoy', text: 'That was effort. The wrong kind.', priority: 2, duration: 3000 },
  { id: 'l10_decoy_2', level: 'level10', trigger: 'still_decoy', text: 'Pressing things is not the answer.', priority: 2, duration: 3000 },
  { id: 'l10_hint_1', level: 'level10', trigger: 'hint_wait', text: 'Have you tried not doing anything?', priority: 3, duration: 4000 },
  { id: 'l10_hint_2', level: 'level10', trigger: 'hint_still', text: 'Stand still. For eight seconds.', priority: 3, duration: 4500 },
  { id: 'l10_unlocked', level: 'level10', trigger: 'still_unlocked', text: '...Fine.', priority: 3, duration: 2500 },
  { id: 'l10_locked', level: 'level10', trigger: 'door_locked', text: 'Locked.', priority: 2, duration: 2200 },
  { id: 'l10_complete', level: 'level10', trigger: 'level_complete', text: 'Patience. How unfortunate.', priority: 4, duration: 4000 },
]

export const LEVEL11_DIALOGUE = [
  { id: 'l11_welcome', level: 'level11', trigger: 'level_start', text: 'Follow the signs. They know the way.', priority: 1, duration: 4000 },
  { id: 'l11_decoy_1', level: 'level11', trigger: 'maze_decoy', text: 'Welcome back.', priority: 3, duration: 2500 },
  { id: 'l11_decoy_2', level: 'level11', trigger: 'maze_decoy', text: "The sign said so, didn't it?", priority: 3, duration: 3000 },
  { id: 'l11_decoy_3', level: 'level11', trigger: 'maze_decoy', text: 'Signs are liars.', priority: 3, duration: 2500 },
  { id: 'l11_hint_1', level: 'level11', trigger: 'hint_corner', text: 'The exit is in the far corner. North-east.', priority: 3, duration: 4500 },
  { id: 'l11_hint_2', level: 'level11', trigger: 'hint_trail', text: "Fine. I'll show you.", priority: 3, duration: 3500 },
  { id: 'l11_complete', level: 'level11', trigger: 'level_complete', text: 'You did not follow the signs. Well done.', priority: 4, duration: 4500 },
]

export const LEVEL12_DIALOGUE = [
  { id: 'l12_welcome', level: 'level12', trigger: 'level_start', text: 'Find the exit.', priority: 1, duration: 3000 },
  { id: 'l12_doorway_1', level: 'level12', trigger: 'doorway', text: "That's a wall.", priority: 3, duration: 2500 },
  { id: 'l12_doorway_2', level: 'level12', trigger: 'doorway', text: 'Nope.', priority: 3, duration: 2000 },
  { id: 'l12_doorway_3', level: 'level12', trigger: 'doorway', text: 'Still a wall.', priority: 3, duration: 2500 },
  { id: 'l12_hint_1', level: 'level12', trigger: 'hint_no_door', text: 'There is no door.', priority: 3, duration: 3500 },
  { id: 'l12_hint_2', level: 'level12', trigger: 'hint_where', text: 'Where do you go when you want out?', priority: 3, duration: 4500 },
  { id: 'l12_hint_3', level: 'level12', trigger: 'hint_escape', text: 'Press Escape. Then choose EXIT.', priority: 3, duration: 6000 },
  { id: 'l12_found', level: 'level12', trigger: 'meta_found', text: 'There it is.', priority: 4, duration: 2500 },
  { id: 'l12_complete', level: 'level12', trigger: 'level_complete', text: 'You found the exit. It was always there.', priority: 4, duration: 5000 },
]

// --- Levels 12-17 (ids level13..level18). They sit at stage 3 and a high intensity, so the voice is colder. ---

export const LEVEL13_DIALOGUE = [
  { id: 'l13_welcome', level: 'level13', trigger: 'level_start', text: 'Do not press the red button.', priority: 1, duration: 3500 },
  { id: 'l13_red_1', level: 'level13', trigger: 'red_press', text: 'I said do not.', priority: 2, duration: 2500 },
  { id: 'l13_red_2', level: 'level13', trigger: 'red_press', text: 'Again. Really?', priority: 2, duration: 2500 },
  { id: 'l13_red_3', level: 'level13', trigger: 'red_press', text: 'Why are you like this?', priority: 2, duration: 2800 },
  { id: 'l13_green_reset', level: 'level13', trigger: 'green_reset', text: 'Safe choice. Start over.', priority: 3, duration: 3000 },
  { id: 'l13_green_nothing', level: 'level13', trigger: 'green_nothing', text: 'The green one is perfectly safe.', priority: 2, duration: 3000 },
  { id: 'l13_hint_1', level: 'level13', trigger: 'hint_disobey', text: 'Some instructions are meant to be broken.', priority: 3, duration: 4000 },
  { id: 'l13_hint_2', level: 'level13', trigger: 'hint_three', text: 'The red one. Three times. Leave the green one alone.', priority: 3, duration: 5000 },
  { id: 'l13_unlocked', level: 'level13', trigger: 'red_unlocked', text: '...Fine. It is open. Happy now?', priority: 3, duration: 3500 },
  { id: 'l13_locked', level: 'level13', trigger: 'door_locked', text: 'Locked. Obviously.', priority: 2, duration: 2200 },
  { id: 'l13_complete', level: 'level13', trigger: 'level_complete', text: 'You disobeyed. Beautifully.', priority: 4, duration: 4000 },
]

export const LEVEL14_DIALOGUE = [
  { id: 'l14_welcome', level: 'level14', trigger: 'level_start', text: 'Take your time.', priority: 1, duration: 3000 },
  { id: 'l14_first', level: 'level14', trigger: 'press_first', text: 'Oh. Did I mention the timer?', priority: 3, duration: 3500 },
  { id: 'l14_up_1', level: 'level14', trigger: 'times_up', text: 'Time is up. Everything is off again.', priority: 3, duration: 3500 },
  { id: 'l14_up_2', level: 'level14', trigger: 'times_up', text: 'Too slow. I will be generous.', priority: 3, duration: 3500 },
  { id: 'l14_up_3', level: 'level14', trigger: 'times_up', text: 'Again. Slightly more generous.', priority: 3, duration: 3500 },
  { id: 'l14_hint', level: 'level14', trigger: 'hint_fast', text: 'All three buttons. Without stopping.', priority: 3, duration: 4500 },
  { id: 'l14_unlocked', level: 'level14', trigger: 'unlocked', text: 'All three. In time. Suspicious.', priority: 3, duration: 3500 },
  { id: 'l14_locked', level: 'level14', trigger: 'door_locked', text: 'Locked.', priority: 2, duration: 2200 },
  { id: 'l14_complete', level: 'level14', trigger: 'level_complete', text: 'You were quick. I am disappointed.', priority: 4, duration: 4000 },
]

export const LEVEL15_DIALOGUE = [
  { id: 'l15_welcome', level: 'level15', trigger: 'level_start', text: 'The way out is west. There is no west.', priority: 1, duration: 4000 },
  { id: 'l15_begin', level: 'level15', trigger: 'lean_begin', text: 'What are you doing?', priority: 2, duration: 2800 },
  { id: 'l15_gives', level: 'level15', trigger: 'wall_gives', text: 'Oh. The wall gave in.', priority: 3, duration: 3500 },
  { id: 'l15_hint_1', level: 'level15', trigger: 'hint_walls', text: 'Have you tried touching the walls?', priority: 3, duration: 4000 },
  { id: 'l15_hint_2', level: 'level15', trigger: 'hint_west', text: 'Stand against the west wall. Stay there.', priority: 3, duration: 4500 },
  { id: 'l15_locked', level: 'level15', trigger: 'door_locked', text: 'Locked.', priority: 2, duration: 2200 },
  { id: 'l15_complete', level: 'level15', trigger: 'level_complete', text: 'You pushed. It yielded. Remember that.', priority: 4, duration: 4500 },
]

export const LEVEL16_DIALOGUE = [
  { id: 'l16_welcome', level: 'level16', trigger: 'level_start', text: 'Do not look at it.', priority: 1, duration: 3000 },
  { id: 'l16_stare_1', level: 'level16', trigger: 'stare_1', text: 'Stop that.', priority: 2, duration: 2200 },
  { id: 'l16_stare_2', level: 'level16', trigger: 'stare_2', text: 'It is looking back.', priority: 2, duration: 2500 },
  { id: 'l16_broken', level: 'level16', trigger: 'stare_broken', text: 'Coward.', priority: 2, duration: 2200 },
  { id: 'l16_win', level: 'level16', trigger: 'stare_win', text: '...Fine. You win.', priority: 3, duration: 3000 },
  { id: 'l16_hint_1', level: 'level16', trigger: 'hint_stare', text: 'It wants a staring contest.', priority: 3, duration: 4000 },
  { id: 'l16_hint_2', level: 'level16', trigger: 'hint_win', text: 'Look at the eye. Do not look away. Six seconds.', priority: 3, duration: 5000 },
  { id: 'l16_locked', level: 'level16', trigger: 'door_locked', text: 'Locked.', priority: 2, duration: 2200 },
  { id: 'l16_complete', level: 'level16', trigger: 'level_complete', text: 'Nobody blinked. Unsettling.', priority: 4, duration: 4000 },
]

export const LEVEL17_DIALOGUE = [
  { id: 'l17_welcome', level: 'level17', trigger: 'level_start', text: 'It is locked. Give up.', priority: 1, duration: 3000 },
  { id: 'l17_knock_1', level: 'level17', trigger: 'knock', text: 'Locked.', priority: 2, duration: 2000, cooldown: 500 },
  { id: 'l17_knock_2', level: 'level17', trigger: 'knock', text: 'Still locked.', priority: 2, duration: 2000, cooldown: 500 },
  { id: 'l17_knock_3', level: 'level17', trigger: 'knock', text: 'Please stop.', priority: 2, duration: 2000, cooldown: 500 },
  { id: 'l17_knock_4', level: 'level17', trigger: 'knock', text: 'Nobody is home.', priority: 2, duration: 2000, cooldown: 500 },
  { id: 'l17_knock_5', level: 'level17', trigger: 'knock', text: 'You are persistent.', priority: 2, duration: 2000, cooldown: 500 },
  { id: 'l17_knock_6', level: 'level17', trigger: 'knock', text: 'Almost.', priority: 2, duration: 2000, cooldown: 500 },
  { id: 'l17_fast', level: 'level17', trigger: 'knock_fast', text: 'Slow down. Doors have feelings.', priority: 3, duration: 3000 },
  { id: 'l17_decoy', level: 'level17', trigger: 'decoy_open', text: 'Emergency exits are for emergencies. Start over.', priority: 3, duration: 4000 },
  { id: 'l17_hint_1', level: 'level17', trigger: 'hint_patience', text: 'Doors answer to persistence. Slowly.', priority: 3, duration: 4000 },
  { id: 'l17_hint_2', level: 'level17', trigger: 'hint_seven', text: 'Seven knocks. One at a time.', priority: 3, duration: 4000 },
  { id: 'l17_open', level: 'level17', trigger: 'knock_open', text: 'Finally. Someone is home.', priority: 4, duration: 3000 },
  { id: 'l17_complete', level: 'level17', trigger: 'level_complete', text: 'Persistence. A terrible habit.', priority: 4, duration: 4000 },
]

export const LEVEL18_DIALOGUE = [
  { id: 'l18_welcome', level: 'level18', trigger: 'level_start', text: 'Everything on the sign is true.', priority: 1, duration: 3500 },
  { id: 'l18_left', level: 'level18', trigger: 'left_pressed', text: 'See? Nothing happened. Yet.', priority: 2, duration: 3000 },
  { id: 'l18_ready', level: 'level18', trigger: 'wait_ready', text: 'Now.', priority: 3, duration: 2000 },
  { id: 'l18_early', level: 'level18', trigger: 'door_early', text: 'I said wait. Start the wait again.', priority: 3, duration: 3500 },
  { id: 'l18_right', level: 'level18', trigger: 'right_pressed', text: 'That one was not on the sign.', priority: 3, duration: 3500 },
  { id: 'l18_hint', level: 'level18', trigger: 'hint_truth', text: 'The sign is not lying. I know. I am surprised too.', priority: 3, duration: 5000 },
  { id: 'l18_locked', level: 'level18', trigger: 'door_locked', text: 'Locked.', priority: 2, duration: 2200 },
  { id: 'l18_complete', level: 'level18', trigger: 'level_complete', text: 'You trusted something. Careful.', priority: 4, duration: 4500 },
]
