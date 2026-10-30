import { create } from 'zustand'

// The currently visible line ({ id, text } or null). Changes only when a line appears/disappears.
export const useDialogueStore = create((set) => ({
  message: null,
  setMessage: (line) => set({ message: line ? { id: line.id, text: line.text } : null }),
}))
