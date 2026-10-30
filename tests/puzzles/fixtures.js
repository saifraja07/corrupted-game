// Test-only puzzle: press both switches (any order). Emits a dialogue event on the first press.
export const makeTwoSwitches = (hooks = {}) => ({
  id: 'two-switches',
  createState: () => ({ a: false, b: false, presses: 0 }),
  handlers: {
    press: (d, p, api) => {
      d[p.id] = true
      d.presses++
      if (d.presses === 1) api.emit('dialogue', { trigger: 'first_press' })
    },
  },
  isComplete: (d) => d.a && d.b,
  getProgress: (d) => ((d.a ? 1 : 0) + (d.b ? 1 : 0)) / 2,
  ...hooks,
})
