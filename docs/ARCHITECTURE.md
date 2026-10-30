# Corrupted: architecture, decisions and risks

This is the Phase 0 plan (architecture, implementation order, technical risks), kept up to date with what
was actually built. See `README.md` for how to run, play and deploy the game.

## Architecture

**Stack.** React + Vite (JavaScript, no TypeScript), Three.js through React Three Fiber, Zustand,
Tailwind (HTML UI only), Howler, React Postprocessing, Vitest, ESLint. No backend, no multiplayer, no
physics engine.

**Four layers, one direction of dependency:**

1. **Pure game logic** (no React, no Three.js): puzzles, level logic, dialogue, corruption, mechanics,
   collision, movement math, audio manager, ending flow. This is where the rules live, so it is unit-tested
   and can be driven by simulated players.
2. **State** (Zustand): small, low-frequency, shared values only (game status, level, progress, settings,
   current dialogue line, corruption stage). Per-frame data (camera, positions, the presence's position)
   lives in refs, never in React state.
3. **Scenes and components** (React/R3F): render the logic, forward player actions to it. A level scene is
   remounted (by key) on every start, restart and next-level, so it always begins pristine.
4. **Bridges**: `audioBridge` and `levelCallbacks` connect stores and events to audio and corruption
   without gameplay code knowing about either.

**Event flow.** A puzzle announces something happened (`door_rejected`, `button_pressed`, `sign_changed`,
...). The level runtime's `fire(name)` then, in order: lets corruption react (it may raise the stage),
plays the matching dialogue line, and plays the line announcing a stage change. The same event name maps
to sounds through a data table. Puzzles never mention audio, corruption or UI.

**Lifecycle.** `MAIN_MENU, TRANSITIONING, PLAYING, PAUSED, LEVEL_COMPLETE, ENDING`, with an explicit
transition table (invalid jumps are rejected and tested). Input only works in `PLAYING`. Every level logic
object has a `start()` / `dispose()` that can cycle safely (React StrictMode, restarts), releasing all
timers, subscriptions, puzzle instances, dialogue and temporary effects (such as reversed controls).

**Data, not code, for content and tuning.** Levels, dialogue, corruption rules and stage profiles, sound
tables, credits and ending text are plain data files, so tuning does not touch logic.

## Implementation order

Built incrementally, each phase leaving the game playable and tested:

0. Inspect and plan (this document). 1. Setup and a static room. 2. Game lifecycle and stores.
3. First-person controller, pointer lock, collision. 4. Interaction system, buttons, signs, doors.
5. Puzzle framework. 6. Level 1 with the dialogue system. 7. Level manager, progression, Level 2, saved progress.
8. Troll mechanics (reversed controls, trigger zones, look-away, staged text), Levels 3 and 4.
9. Corruption (four stages, effects). 10. Audio, settings, credits, endings. 11. Release hardening.
13. The *Corrupted* update: renamed from its earlier working title (saved data migrates), an explicit difficulty and tone curve,
    unexpected ambient events, and Levels 5 to 7 (the finale became Level 8 so ids match play order).
12. Final pass: Level 5 (transforming room, unobserved mover, the presence, the final puzzle), dev flags,
    performance monitor, room polish, and this document.

## Technical risks

| Risk | Mitigation | Status |
| --- | --- | --- |
| Pointer lock needs a user gesture and browsers rate-limit re-locking after Escape | "Click to play" overlay; pause when lock or focus is lost; Resume re-locks from a click | Logic tested; **needs real-browser check** |
| Browser autoplay rules block audio | Nothing plays until the first gesture; ambient intent is remembered and starts at unlock | Tested with fakes |
| No WebGL, or no mouse (touch devices) | Startup support check with a clear message and disabled Start | Tested |
| 3D scene crash | Error boundary with a way back to the menu; postprocessing in its own boundary | Tested |
| Photosensitivity | Only slow, smooth, low-amplitude light changes; one brief glitch burst per stage rise; a **Reduce motion** setting that also follows the OS | Numeric bounds tested (max step per frame, direction reversals per second, dips per period) |
| React re-rendering every frame | Per-frame data in refs; stores hold low-frequency state; React state is set only when a value actually changes (e.g. sign text, room variant) | By design; **measure with `?stats=1`** |
| Resource leaks across levels | Dispose lifecycle; remount-by-key; textures disposed with their component | Timers/subscriptions tested over repeated cycles; **GPU resources need the `?stats=1` counts** |
| Troll mechanics creating unsolvable states | Rules are separate from presentation; every level is solved by a test at every corruption stage; geometry is checked (reachability, spawn safety, door spacing); simulated players use the real collision and input code | Tested |
| Frame-rate dependent bugs | Delta clamped; collision substeps so large steps cannot tunnel | Tested |
| Bundle size | Levels and postprocessing are lazy chunks; a build check fails if they become eager or the initial JS exceeds budget | Enforced in CI |
| Three.js raycasts ignore `visible=false` | Objects that must not block interaction are unmounted, not hidden (found while building the presence) | Handled |
| Counter-intuitive puzzles feeling unfair (Levels 5 to 7) | Each has a non-visual cue (sound when the gate opens, the lamps replaying, the blackout), escalating hints, free retries, and safety rules (the gate never closes on you, a stuck player gets a blackout called) | Tested with simulated players |
| Unexpected events becoming annoying or unsafe | Scheduler is seeded, never fires at stage 0, in the first 20 s, during dialogue, or less than 16 s apart; every effect is temporary and self-clearing | Tested over simulated hours |
| An "is it watched?" test using one point on a tall object | Sample along the object's whole height (a single point let players open the gate by staring at it from right beside it; a simulated-player test caught it) | Regression-tested at many distances and pitches |
| Visual and audio quality, GPU effects | None possible without a real display, GPU and speakers | **Manual QA checklist in the README** |

## Decisions

- **No physics engine.** Rooms are rectangles, so a circle-versus-box collision with substeps is small,
  testable and enough. Replaceable behind one function.
- **`@react-three/drei` removed.** It was approved but never used; unused dependencies add install weight
  and attack surface. Re-add with `npm install @react-three/drei` if wanted.
- **Main-menu "Continue", not a mid-level "Resume".** Levels are short and fully deterministic, so
  progress is saved per completed level. A mid-level save would mean serializing puzzle state, timers and
  the corruption stage for little benefit. In-level Resume lives in the pause menu.
- **Look-away uses a view cone and ignores occlusion.** It is simple and predictable for the player and
  for tests. A wall between you and the object still counts as "watching". Documented as a limitation.
- **Corruption only ever changes presentation.** It never feeds back into puzzle rules, which is why every
  level is provably solvable at stage 0 to 3. Corruption stages only rise within a level and reset when it
  is left.
- **Reactions to the player's own actions interrupt dialogue.** Lines that respond to something the player
  just did have higher priority than ambient chatter, so feedback feels immediate.
- **No footstep sounds.** They are not in the specified sound list and would need per-surface variation to
  avoid being repetitive. The audio manager can add them without other changes.
- **All audio is synthesized** by `tools/generate-sounds.py` (reproducible), so there are no licensing
  questions and the sounds can be retuned in code.
- **Hand-tuned bundle chunking was tried and reverted.** It silently made the postprocessing library load
  at startup. The simple lazy-chunk setup plus a build guard is safer.

- **Difficulty is data, and checked.** `config/progression.js` records each level's tier, tone and the one
  new kind of deception it introduces; tests require the tiers to rise, deceptions never to fall, every
  trick to be new, the first two levels to be corruption-free and the last two to be at the maximum, and
  the README's table to match the data row for row.
- **Corruption reacts to the player, not to chance.** Struggling (three wrong lamp presses, two wrong
  buttons) raises the stage through the same event rules as everything else. The ambient-event scheduler is
  the only "random" thing, and it is seeded per level run, so a restart behaves identically.
- **Level ids match play order.** When three levels were inserted before the finale it was renamed
  `level05` to `level08` mechanically (tests caught nothing missing) rather than leaving an id that lies
  about its position.
- **Renaming did not wipe saves.** The new storage keys fall back to reading the old ones; only
  `core/storageKeys.js` may mention the old name, and a test enforces it.

## What is verified

**Automatically (every push, `npm run verify`):** lint; the whole test suite (logic, simulated players
with real collision, a start-to-finish playthrough through the real stores, repeated start/dispose leak
cycles, WAV analysis of every sound, UI render checks); the production build; and a guard on the built
output (lazy chunks, size budget, assets present).

**Not verified by machine:** how anything looks and feels, how it sounds, frame rate on real hardware,
the GPU effects, pointer-lock behavior in each browser, and GPU resource counts across restarts. These
need the manual checklist in the README, with `?stats=1` for numbers.
