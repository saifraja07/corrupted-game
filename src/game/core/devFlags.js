// Developer URL switches (all optional, none change gameplay rules):
//   ?corruption=0..3  pin the corruption stage      ?ceiling=0  hide room ceilings (see the layout from above)
//   ?stats=1          show FPS, draw calls and resource counts
export function parseDevFlags(search = '') {
  const q = new URLSearchParams(search)
  const c = q.get('corruption')
  return {
    corruptionStage: c !== null && /^[0-3]$/.test(c) ? Number(c) : null,
    showCeiling: q.get('ceiling') !== '0',
    showStats: q.get('stats') === '1',
  }
}

export const devFlags = parseDevFlags(globalThis.location?.search ?? '')
