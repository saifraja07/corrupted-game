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

Every puzzle is deterministic and solvable in any order, however much the game lies. Finish Level 8
for the ending and credits (there is a secret ending hidden in the credits).

**The final level** uses everything the earlier levels taught against you. The room changes size, lowers
its ceiling and loses doors each time you leave through one, a dark figure appears that only moves when
you are not looking at it, and the puzzle is solved by *watching it* instead of searching for an exit.
The solution never depends on which version of the room you are in, so it cannot become unsolvable.

**Corruption.** The game has four stages, from clean to severely corrupted. Each level starts at a base
stage (Levels 7 and 8 start at the maximum), and specific events raise it (finding the hidden button, controls
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

Every level stays beatable by design. The game may mislead you, but there is always a deliberate solution,
and getting stuck brings help: hints, an automatic replay of the lamps, a blackout called for you, a gate
that never closes on you. Mistakes only ever reset progress, never lock you out, and a test plays every
level at every corruption stage.

**Unexpected events.** From stage 1 up, the game also does unexpected things on its own: a HUD notice
("ROOM INTEGRITY: 94%"), the objective briefly rewriting itself ("STOP LOOKING."), a glitch sound, a
single soft glitch flash. They are more frequent and stranger at each stage (about every 50-80 s at stage 1,
16-28 s at stage 3), never in the first 20 seconds, never while dialogue is on screen, never below 16 s
apart, and none at stage 0, so the first two levels stay harmless. They are seeded, so a restarted level
behaves identically.

## Developer tools

- **Preview a corruption stage:** open `http://localhost:5173/?corruption=0` (up to `3`). The stage is
  pinned, so you can inspect each look without playing to it.
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
- [ ] Level 8: each door sends you back to a changed room; the figure freezes while you watch it, creeps closer when you look away (never closer than about 3 m); walking up to it while watching it shows "[E] Follow"
- [ ] From Level 3 on: occasional HUD notices and objective glitches appear, none in Levels 1 and 2, none while dialogue is showing
- [ ] Corruption looks readable and comfortable at each stage (`?corruption=1`, `2`, `3`); try Reduce motion
- [ ] Sound: levels sensible, nothing harsh; ambient fades between levels; mute works
- [ ] Ending, credits and the secret ending; main menu shows Continue after playing
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
- The ending is written for the current eight levels.
- There is no mid-level save: "Continue" on the main menu starts the first unfinished level, and the pause
  menu is where you resume mid-level (see `docs/ARCHITECTURE.md`, decisions).
- One save slot, stored in the browser.
- Postprocessing effects are wrapped in a safety boundary so a failure drops the effect instead of
  crashing the game, but they depend on the user's GPU.
