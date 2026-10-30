import { useSettingsStore } from '../../game/state/settingsStore.js'

function Slider({ label, value, min = 0, max = 1, step = 0.05, format, onChange }) {
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="flex justify-between text-sm font-semibold">
        {label}
        <output>{format(value)}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-zinc-900" />
    </label>
  )
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex w-full items-start gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-zinc-900" />
      <span>
        <span className="font-semibold">{label}</span>
        {hint && <span className="block text-zinc-500">{hint}</span>}
      </span>
    </label>
  )
}

const pct = (v) => `${Math.round(v * 100)}%`

// Every change applies immediately and is saved (validated) by the settings store.
export default function SettingsMenu({ onBack }) {
  const s = useSettingsStore()
  const set = s.updateSettings
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-zinc-100 px-6 text-zinc-900" role="dialog" aria-label="Settings">
      <h2 className="text-3xl font-bold">Settings</h2>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Slider label="Master volume" value={s.masterVolume} format={pct} onChange={(v) => set({ masterVolume: v })} />
        <Slider label="Effects volume" value={s.sfxVolume} format={pct} onChange={(v) => set({ sfxVolume: v })} />
        <Slider label="Ambient volume" value={s.ambientVolume} format={pct} onChange={(v) => set({ ambientVolume: v })} />
        <Toggle label="Mute all sound" checked={s.muted} onChange={(v) => set({ muted: v })} />
        <Slider label="Mouse sensitivity" value={s.mouseSensitivity} min={0.1} max={3} step={0.05} format={(v) => `${v.toFixed(2)}x`} onChange={(v) => set({ mouseSensitivity: v })} />
        <Toggle label="Reduce motion" hint="Turns off glitch bursts, grain and light animation. Your system setting is also respected." checked={s.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
      </div>
      <button type="button" autoFocus onClick={onBack} className="rounded border-2 border-zinc-900 px-6 py-2 font-semibold hover:bg-zinc-900 hover:text-zinc-100">
        Back
      </button>
    </div>
  )
}
