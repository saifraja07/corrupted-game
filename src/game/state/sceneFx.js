// Scene-wide effects a level can drive every frame WITHOUT React renders: a plain mutable object read by
// the lighting each frame. A level scene writes it while playing and resets it when it unmounts.
export const sceneFx = { darkness: 0 } // 0 = normal light, 1 = blackout

export const setDarkness = (v) => {
  sceneFx.darkness = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0))
}
export const resetSceneFx = () => {
  sceneFx.darkness = 0
}
