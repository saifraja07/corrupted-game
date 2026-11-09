# Corrupted

> **Find the exit. Trust nothing.**

A first-person 3D puzzle game that starts as a funny troll game and slowly turns into something that
feels wrong. Doors run away from you, signs lie, controls reverse, and the game starts to notice what
you do. It runs entirely in the browser (React, Three.js via React Three Fiber, no backend).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Needs Node 20+ (`.nvmrc` pins 22) and a **desktop browser with WebGL and a mouse** (Chrome, Edge,
Firefox or desktop Safari). Touch-only devices get a clear "can't run here" message instead of a blank page.

## Controls

| Input | Action |
| --- | --- |
| Click the screen | Capture the mouse (pointer lock) |
| **WASD** | Move |
| Mouse | Look around |
| **E** | Interact (the prompt appears when you look at something in range) |
| **Escape** | Pause / release the mouse |

Settings (volumes, mute, mouse sensitivity, reduce motion) are in the main menu and the pause menu.
They apply immediately and are saved in your browser.

## The game

| # | Level | The idea |
| --- | --- | --- |
| 1 | The Obvious Door | The exit slides away whenever you approach. The real solution is a button behind you. |
| 2 | The Easy Part | The sign says "the button". There are two, and one is on the ceiling. |
| 3 | Backwards | Crossing the middle of the room reverses your controls. A calibration button fixes them. |
| 4 | The Wrong Exit | The sign says the exit is on the left. The left door is a fake that sends you back. |
| 5 | Simple Instructions | Four lamps flash a sequence. The sign tells you a different order. Trust the lamps. |
| 6 | Lights Out | The sign names the wrong button. The truth only shows during a slow blackout. |
| 7 | Blink | A gate opens only while you aren't looking at it. The sign says to keep your eyes on it. |
| 8 | The Last Room | Every door is fake, and each one transforms the room. Something is watching you. The way out isn't a door. |
| 9 | Almost | The obvious exit shows a fake "Level complete" screen. Falling for it is what unlocks the real door. |
| 10 | Stillness | A countdown says hurry. The exit opens if you stand perfectly still. |
| 11 | Which Way Out | A maze where every sign lies and dead ends hold decoy EXIT doors. The real exit says NO EXIT. |
| 12 | Do Not Press | The sign forbids the red button. Pressing it three times is the way out; the "safe" green button wipes your progress. |
| 13 | Time's Up | Press three buttons inside a hidden deadline. Missing it switches them off again, but every miss gives you more time. |
| 14 | Lean In | Nothing opens the door. Standing against the west wall for five seconds makes the wall give way. |
| 15 | Staring Contest | An eye on the wall, and a sign saying not to look at it. Hold its gaze for six seconds. |
| 16 | Knock Knock | "It is locked. Give up." Seven knocks, each a moment after the last, open it. Faster knocks are ignored. |
| 17 | The Honest Room | After sixteen lies, the sign tells the truth: left button, wait five seconds, use the door. Believing it is the hard part. |
| 18 | Exit | The doors are painted on. "Find the exit" is meant literally: the exit is the game's own pause menu. |

Every puzzle is deterministic and solvable in any order, however much the game lies. Finish Level 18
for the true ending and credits (there is a secret ending hidden in the credits).

**Level 8 is a false finale.** Its room is called "The Last Room", and the line that greets you says "Probably." It uses everything the earlier levels taught against you. The room changes size, lowers
its ceiling and loses doors each time you leave through one, a dark figure appears that only moves when
you are not looking at it, and the puzzle is solved by *watching it* instead of searching for an exit.
The solution never depends on which version of the room you are in, so it cannot become unsolvable.

When you finish it, the game shows an ending: "Exit found.", then credits, then a fake crash ("The ending
could not be found"). The game then carries on into Level 9. The credits in the false ending have no hidden
secret, and "Main menu" is a real way out at every step.

**Level 18 is the true finale** (it keeps the internal id `level12`: ids are names, not positions, and it is last because it is last in `config/levels.js`; new levels go in before it), and the joke is that "Find the exit" is meant literally. There is no door
anywhere: the doors are painted on. The exit is the **EXIT button in the pause menu**, which exists only
while that level is loaded. Hints escalate over three minutes, ending with "Press Escape. Then choose EXIT."

**Corruption.** The game has four stages, from clean to severely corrupted. Each level starts at a base
stage (Levels 7 to 12 start at the maximum), and specific events raise it (finding the hidden button, controls
reversing, the sign changing while you are not looking). Corruption changes lighting, colors, fog, grain, vignette, glitch bursts,
dialogue text and ambient sound, but it never changes puzzle rules. All effects are slow and
low-contrast (no strobing) and can be turned off with **Reduce motion**.

### Difficulty and tone curve

Each level is harder than the last, and each introduces **one new kind of deception**, so an old trick
never solves a new room. The early levels are harmless and funny; the later ones are unpredictable and
unsettling. The corruption stage a level starts at sets its tone. This table is checked against the data
(`src/game/config/progression.js`) by a test, row for row.

| # | Level | Tone | Corruption stage | What's new |
| --- | --- | --- | --- | --- |
| 1 | The Obvious Door | funny | 0 | a door that runs away |
| 2 | The Easy Part | funny | 0 | an incomplete instruction |
| 3 | Backwards | strange | 1 | controls that betray you |
| 4 | The Wrong Exit | unsettling | 2 | a lying sign and a fake exit |
| 5 | Simple Instructions | unsettling | 2 | instructions you must disprove by observation |
| 6 | Lights Out | unsettling | 2 | a truth that only shows in the dark |
| 7 | Blink | disturbing | 3 | an obstacle that yields only when unwatched |
| 8 | The Last Room | disturbing | 3 | an exit that is not a door |
| 9 | Almost | disturbing | 3 | a fake victory screen |
| 10 | Stillness | disturbing | 3 | a reward for doing nothing |
| 11 | Which Way Out | disturbing | 3 | a maze of lying signs |
| 12 | Do Not Press | disturbing | 3 | an order that must be disobeyed |
| 13 | Time's Up | disturbing | 3 | a deadline that wipes your progress |
| 14 | Lean In | disturbing | 3 | a wall that gives way if you lean on it |
| 15 | Staring Contest | disturbing | 3 | a stare you have to win |
| 16 | Knock Knock | disturbing | 3 | a door that rewards stubbornness, not speed |
| 17 | The Honest Room | disturbing | 3 | a sign that finally tells the truth |
| 18 | Exit | disturbing | 3 | an exit that is the game itself |

Every level stays beatable by design. The game may mislead you, but there is always a deliberate solution,
and getting stuck brings help: hints, an automatic replay of the lamps, a blackout called for you, a gate
that never closes on you. Mistakes only ever reset progress, never lock you out, and a test plays every
level at every corruption stage.

**Intensity.** Stage 3 is the ceiling, but the corruption keeps growing past it. Levels 8 to 18 carry an
*intensity* from 1 to 6 that strengthens the vignette, grain, scanlines, fog and light dips, and makes the
unexpected events more frequent, always inside fixed safety caps (a test checks every effect at every
intensity). Tiers 1 to 3 are the original curve; tiers 4 to 6 (Levels 13 to 18 and the finale) have a higher,
still fixed ceiling and unlock harsher rage-bait ("DELETING SAVE FILE...", "THANK YOU FOR PLAYING."). Intensity
also grows *inside* a level when you struggle or take the bait (for example missing the deadline in Level 13 or
staring back in Level 16); it never falls until you leave the level.

**Rage-bait.** From the later levels the game also teases you on purpose: a fake "PROGRESS ERASED." that
turns into "JUST KIDDING.", a fake "LOADING EXIT... 99%" that fails, a fake "not responding" window, a notice
claiming your controls were remapped (they were not), and the fake "Level complete" screen in Level 9. These
follow strict rules, enforced by tests: every one reveals itself within a few seconds, none ever touches
saves, settings or progress (a test applies every event and checks nothing real changed), none blocks play
for more than about five seconds, and every fake screen keeps a real "Main menu" button.

**Unexpected events.** From stage 1 up, the game also does unexpected things on its own: a HUD notice
("ROOM INTEGRITY: 94%"), the objective briefly rewriting itself ("STOP LOOKING."), a glitch sound, a
single soft glitch flash. They are more frequent and stranger at each stage (about every 50-80 s at stage 1,
16-28 s at stage 3), never in the first 20 seconds, never while dialogue is on screen, never below 16 s
apart, and none at stage 0, so the first two levels stay harmless. They are seeded, so a restarted level
behaves identically.

## Developer tools

- **Preview a corruption stage:** open `http://localhost:5173/?corruption=0` (up to `3`). The stage is
  pinned, so you can inspect each look without playing to it. Add `&intensity=0` to `6` (with
  `?corruption=3`) to preview how far past stage 3 the corruption goes in the last levels.
- **Hide ceilings:** add `?ceiling=0` to see room layouts from above while developing.
- **Measure performance:** add `?stats=1` for an on-screen readout of FPS, frame time (with the worst
  frame), draw calls, triangles, and the renderer's **geometry and texture counts**. Use it to check
  performance on your machine, and to check for leaks: restart a level several times and confirm the
  geometry/texture counts return to the same numbers. Flags combine, e.g. `/?stats=1&corruption=3`.
- **Regenerate the sounds:** `npm run sounds` runs `tools/generate-sounds.py` (needs Python with numpy and
  scipy). All audio is synthesized from scratch, so there is nothing to license. To use your own audio,
  replace a file in `public/sounds/` or edit `src/game/config/audio.js`.
- **Credits:** add your name in `src/game/config/credits.js`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | All Vitest tests (`npm run test:watch` to watch) |
| `npm run check:build` | Guard for the built output: lazy chunks stay lazy, size budget, assets present |
| `npm run audit:prod` | Security audit of the dependencies the game actually ships (CI runs it) |
| `npm run verify` | Everything above in order: lint, tests, build, build check (this is what CI runs) |

## Project layout

```
src/
  app/            App shell and the 3D canvas
  components/     ui/ (menus, HUD, dialogue, screens) and effects/ (glitch overlay, postprocessing)
  game/
    core/         state names, lifecycle rules, browser-support check
    config/       data only: levels, dialogue, corruption, audio, ending, credits
    state/        Zustand stores (game, settings, progress, dialogue, corruption fx)
    player/       input, movement math, collision, pointer lock, interaction
    world/        Room, Door, Button, Sign, Interactable, lighting
    puzzles/      puzzle lifecycle, registry, manager
    mechanics/    reusable troll mechanics (reversed controls, look-away, trigger zones, staged text)
    systems/      dialogue, interaction, corruption, audio (manager + bridge), ending flow
    levels/       one folder per level (logic, puzzle, layout) + the scene components + level manager
docs/             ARCHITECTURE.md: the architecture, decisions and technical risks
tests/            Vitest (logic, simulated playthroughs, asset checks, release checks)
tools/            sound generator, build guard
public/           sounds, favicon, deployment headers
```

**Design rules the code follows:** gameplay rules live in plain JS modules with no React or Three.js
(so they are unit-tested, including full simulated playthroughs); scenes only render them; per-frame
data stays in refs, not React state; every level starts and disposes cleanly (no leaked timers,
listeners or effects); audio and corruption react to events and never alter puzzle logic.

## Adding a level

1. Add it to `src/game/config/levels.js` and give it a base stage in `config/corruption.js`.
2. Create `src/game/levels/levelNN/`: `layout.js`, a puzzle definition, and `createLevelNNLogic.js`
   built on `createLevelRuntime` (it provides puzzles, dialogue, timers and a leak-free start/dispose).
3. Add its dialogue lines to `src/game/config/dialogue.js`, and sounds for new events to `config/audio.js`.
4. Write the scene `LevelNN.jsx` using `useLevelLifecycle` and `createLevelCallbacks`, and register it in
   `levels/levelComponents.js`.
5. Add its solution to `tests/helpers/levelSolvers.js`. The existing suites then check that it is
   solvable at every corruption stage, plays through the full game, and leaks nothing.

## Testing and QA

`npm run verify` runs ESLint, the full test suite (logic, simulated players using real collision and
the real input pipeline, a start-to-finish playthrough through the real stores, WAV asset analysis, UI
render checks), the production build, and the build guard.

Automated tests cannot judge how the game **looks, sounds and feels**, or run the GPU effects. Before
releasing, play it in a real browser with this checklist:

- [ ] Start, click to capture the mouse, move and look; walls and doors block you
- [ ] Escape pauses; Resume re-captures the mouse; Restart level and Quit work
- [ ] Level 1: the door dodges; the button behind you solves it; the prompt appears at a sensible range
- [ ] Level 2: both buttons found (look up); hint appears if you linger
- [ ] Level 3: controls reverse, are fixable, and are back to normal afterwards and in Level 4
- [ ] Level 4: the fake door sends you back; the sign changes only when you look away
- [ ] Level 5: the lamps flash a sequence (and replay from the wall button); the sign's order never works; a wrong press only resets progress
- [ ] Level 6: the room goes dark slowly (no flicker); a glowing mark appears over the blue button; the second wrong press calls a blackout
- [ ] Level 7: staring at the gate keeps it shut; looking away or walking backwards opens it, with a sound; it never closes on you; two hints if you linger
- [ ] Level 9: the obvious EXIT shows a fake "Level complete" (with the jingle), a loading bar that stalls, an error, then drops you back; the real door is now unlocked; Main menu works on every one of those screens
- [ ] Level 10: the countdown only ticks while you move; standing completely still for 8 seconds unlocks the exit; the decoy button resets it; hints at 1 and 2 minutes
- [ ] Level 11: the maze is explorable without snagging; every sign lies; the compass in the objective is right; decoy EXIT doors send you to the start; the real door says NO EXIT; hint at 2 minutes, glowing trail at 5
- [ ] Level 12: the red button needs three presses despite the sign; the green button clears them; hints at 45 s and 90 s
- [ ] Level 13: the first press starts a hidden deadline; a miss clears the buttons and the next window is longer; the third miss raises corruption
- [ ] Level 14: standing against the west wall for 5 s unlocks the door (a dark crack appears); leaving the wall restarts the count
- [ ] Level 15: the eye's pupil shrinks as you hold its gaze; 6 s unlocks the door; a brief glance away does not break it, a long one does
- [ ] Level 16: knocks only count if a moment apart; the emergency button wipes your knocks; the seventh knock opens the door
- [ ] Level 17: the sign is true; the right button and an early door both restart the wait
- [ ] Level 18: painted doors are walls; the pause menu shows EXIT (only here); using it finishes the level and shows the true ending
- [ ] Level 8: each door sends you back to a changed room; the figure freezes while you watch it, creeps closer when you look away (never closer than about 3 m); walking up to it while watching it shows "[E] Follow"
- [ ] From Level 3 on: occasional HUD notices and objective glitches appear, none in Levels 1 and 2, none while dialogue is showing
- [ ] Corruption looks readable and comfortable at each stage (`?corruption=1`, `2`, `3`); try Reduce motion
- [ ] Sound: levels sensible, nothing harsh; ambient fades between levels; mute works
- [ ] After Level 8: the false ending, credits, fake crash, then Level 9 (Restart) or the menu (Main menu)
- [ ] After Level 18: the true ending, credits and the secret ending; main menu shows Continue after playing
- [ ] Later levels: rage-bait notices and the fake error window appear, then reveal themselves; none while dialogue is showing; nothing in your saved progress changes
- [ ] With `?stats=1`: note the FPS in each level; restart a level 5 times and confirm geometry/texture counts return to the same values
- [ ] Browser console is free of errors through a full playthrough

## Deployment

It is a static site. `npm run build` and serve `dist/` from any static host.

- **Cloudflare Pages / Netlify:** build command `npm run build`, output directory `dist`. The included
  `public/_headers` sets long-lived caching for hashed assets.
- **Sub-path hosting** (e.g. GitHub Pages project sites): `VITE_BASE=/your-repo/ npm run build`.
- **CI:** `.github/workflows/ci.yml` runs `npm run verify` on every push and pull request.

## Known limitations

- Desktop only: needs a mouse and pointer lock. No touch or gamepad controls.
- The "not looking" rule (Level 4's sign, Level 7's gate, Level 8's figure) uses a view cone and ignores walls.
- Dialogue lines keep their timers while the game is paused.
- The ending is written for the current eighteen levels.
- There is no mid-level save: "Continue" on the main menu starts the first unfinished level, and the pause
  menu is where you resume mid-level (see `docs/ARCHITECTURE.md`, decisions).
- One save slot, stored in the browser.
- Postprocessing effects are wrapped in a safety boundary so a failure drops the effect instead of
  crashing the game, but they depend on the user's GPU.
