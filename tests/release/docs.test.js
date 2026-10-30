import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LEVELS } from '../../src/game/config/levels.js'

const root = (p) => fileURLToPath(new URL(`../../${p}`, import.meta.url))
const readme = () => readFileSync(root('README.md'), 'utf8')

describe('documentation stays in sync with the game', () => {
  it('the README exists and documents every level by name', () => {
    expect(existsSync(root('README.md'))).toBe(true)
    for (const l of LEVELS) expect(readme(), l.name).toContain(l.name)
  })
  it('documents the controls, developer preview, and release commands', () => {
    const r = readme()
    for (const needle of ['WASD', 'Escape', '?corruption=', '?stats=1', '?ceiling=0', 'docs/ARCHITECTURE.md', 'npm run verify', 'npm run dev', 'VITE_BASE', 'tools/generate-sounds.py']) {
      expect(r, needle).toContain(needle)
    }
  })
  it('every npm script the README mentions exists', () => {
    const scripts = JSON.parse(readFileSync(root('package.json'), 'utf8')).scripts
    const mentioned = [...readme().matchAll(/npm run ([a-z:-]+)/g)].map((m) => m[1])
    expect(mentioned.length).toBeGreaterThan(3)
    for (const name of new Set(mentioned)) expect(scripts[name], `npm run ${name}`).toBeDefined()
  })
  it('the architecture document covers the plan, the decisions and the technical risks', () => {
    expect(existsSync(root('docs/ARCHITECTURE.md'))).toBe(true)
    const doc = readFileSync(root('docs/ARCHITECTURE.md'), 'utf8')
    for (const heading of ['## Architecture', '## Implementation order', '## Technical risks', '## Decisions', '## What is verified']) {
      expect(doc, heading).toContain(heading)
    }
  })
  it('deployment files are present', () => {
    for (const f of ['.github/workflows/ci.yml', 'public/_headers', '.nvmrc']) expect(existsSync(root(f)), f).toBe(true)
  })
})
