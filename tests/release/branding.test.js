import { describe, it, expect } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { GAME_TAGLINE, GAME_TITLE } from '../../src/game/config/meta.js'
import { LEGACY_STORAGE, STORAGE } from '../../src/game/core/storageKeys.js'
import { loadSettings } from '../../src/game/state/settingsStore.js'
import { loadProgress } from '../../src/game/state/progressStore.js'
import { DEFAULT_SETTINGS } from '../../src/game/core/GameConfig.js'
import { ENDING_TEXT, SECRET_TEXT } from '../../src/game/config/ending.js'
import MainMenu from '../../src/components/ui/MainMenu.jsx'
import CreditsScreen from '../../src/components/ui/CreditsScreen.jsx'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')
const noop = () => {}

describe('the game is called Corrupted', () => {
  it('has the right title and tagline', () => {
    expect(GAME_TITLE).toBe('Corrupted')
    expect(GAME_TAGLINE).toBe('Find the exit. Trust nothing.')
  })

  it('shows them on the title screen and in the credits', () => {
    const menu = renderToString(h(MainMenu, { onStart: noop }))
    expect(menu).toContain('<h1')
    expect(menu).toContain(GAME_TITLE)
    expect(menu).toContain(GAME_TAGLINE)
    const credits = renderToString(h(CreditsScreen, { onDone: noop }))
    expect(credits).toContain(GAME_TITLE)
    expect(credits).toContain(GAME_TAGLINE)
  })

  it('uses the name in the secret ending, and the page title/description (index.html mirrors the config)', () => {
    expect(SECRET_TEXT.lines.join(' ')).toContain(GAME_TITLE)
    const html = read('index.html')
    expect(html).toContain(`<title>${GAME_TITLE}</title>`)
    expect(html).toContain(GAME_TAGLINE)
  })

  it('is named in the package and the docs', () => {
    expect(JSON.parse(read('package.json')).name).toBe('corrupted')
    expect(JSON.parse(read('package-lock.json')).name).toBe('corrupted')
    expect(read('README.md')).toMatch(/^# Corrupted/)
    expect(read('README.md')).toContain(GAME_TAGLINE)
    expect(read('docs/ARCHITECTURE.md')).toMatch(/^# Corrupted/)
  })

  it('leaves no trace of the old name anywhere except the save-data migration file', () => {
    const skipDirs = new Set(['node_modules', 'dist', '.git', 'tests'])
    const allowed = new Set(['src/game/core/storageKeys.js'])
    const exts = /\.(js|jsx|mjs|md|html|json|py|yml|yaml|css|svg|txt)$/
    const offenders = []
    const walk = (dir) => {
      for (const name of readdirSync(root + dir)) {
        const rel = dir ? `${dir}/${name}` : name
        if (skipDirs.has(name)) continue
        if (statSync(root + rel).isDirectory()) walk(rel)
        else if (exts.test(name) && !allowed.has(rel) && /brain[.\s_-]?exe/i.test(read(rel))) offenders.push(rel)
      }
    }
    walk('')
    expect(offenders).toEqual([])
  })
})

describe('renaming does not wipe anyone\'s saved game', () => {
  const store = (data) => ({ getItem: (k) => (k in data ? data[k] : null) })

  it('reads settings and progress saved under the old keys', () => {
    const legacy = store({
      [LEGACY_STORAGE.settings]: JSON.stringify({ masterVolume: 0.3, mouseSensitivity: 2 }),
      [LEGACY_STORAGE.progress]: JSON.stringify({ completedLevelIds: ['level01', 'level02'] }),
    })
    expect(loadSettings(legacy)).toMatchObject({ masterVolume: 0.3, mouseSensitivity: 2 })
    expect(loadProgress(legacy).completedLevelIds).toEqual(['level01', 'level02'])
  })

  it('prefers the new keys when both exist', () => {
    const both = store({
      [STORAGE.settings]: JSON.stringify({ masterVolume: 0.9 }),
      [LEGACY_STORAGE.settings]: JSON.stringify({ masterVolume: 0.1 }),
      [STORAGE.progress]: JSON.stringify({ completedLevelIds: ['level01'] }),
      [LEGACY_STORAGE.progress]: JSON.stringify({ completedLevelIds: [] }),
    })
    expect(loadSettings(both).masterVolume).toBe(0.9)
    expect(loadProgress(both).completedLevelIds).toEqual(['level01'])
  })

  it('falls back to defaults when nothing (or garbage) is saved', () => {
    expect(loadSettings(store({}))).toEqual(DEFAULT_SETTINGS)
    expect(loadProgress(store({})).completedLevelIds).toEqual([])
    expect(loadSettings(store({ [STORAGE.settings]: '{broken' }))).toEqual(DEFAULT_SETTINGS)
  })

  it('writes use the new keys only', () => {
    expect(STORAGE.settings).toMatch(/^corrupted:/)
    expect(STORAGE.progress).toMatch(/^corrupted:/)
  })
})
