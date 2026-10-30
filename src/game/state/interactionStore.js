import { create } from 'zustand'

// Only the *current target's prompt* lives in React state. It changes rarely (when the player
// looks at / away from something), never per frame.
export const useInteractionStore = create((set, get) => ({
  targetId: null,
  prompt: '',
  setTarget: (targetId, prompt) => {
    const s = get()
    if (s.targetId === targetId && s.prompt === prompt) return // avoid redundant updates
    set({ targetId, prompt })
  },
  clearTarget: () => {
    if (get().targetId !== null) set({ targetId: null, prompt: '' })
  },
}))
