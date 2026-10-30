import { create } from 'zustand'
import { STAGE_BANNERS } from '../config/corruption.js'

// Transient UI signals for corruption (not gameplay state): a counter that triggers one glitch burst,
// a short HUD banner, and a brief distortion of the objective text. The corruption STAGE itself lives in
// gameStore.corruptionStage. Everything here is temporary: the components that show it clear it.
export const useCorruptionFxStore = create((set, get) => ({
  burstId: 0,
  seq: 0, // unique ids for banners/objective glitches
  banner: null, // { id, text } | null
  objectiveGlitch: null, // { id, text } | null

  stageRose: (stage) => {
    const text = STAGE_BANNERS[stage]
    const id = get().seq + 1
    set({ burstId: get().burstId + 1, seq: id, banner: text ? { id, text } : null })
  },
  showNotice: (text) => {
    const id = get().seq + 1
    set({ seq: id, banner: { id, text } })
  },
  burst: () => set({ burstId: get().burstId + 1 }),
  glitchObjective: (text) => {
    const id = get().seq + 1
    set({ seq: id, objectiveGlitch: { id, text } })
  },
  clearBanner: (id) => {
    if (get().banner?.id === id) set({ banner: null })
  },
  clearObjectiveGlitch: (id) => {
    if (get().objectiveGlitch?.id === id) set({ objectiveGlitch: null })
  },
  reset: () => set({ banner: null, objectiveGlitch: null }),
}))
