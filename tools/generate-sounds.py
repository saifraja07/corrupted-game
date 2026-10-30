#!/usr/bin/env python3
"""Generates every sound effect and ambient loop for Corrupted from scratch.

Original audio: pure synthesis (sines, filtered noise, envelopes). No samples, recordings or third-party
material are used, so there is nothing to attribute. Deterministic (fixed seed): rerunning reproduces
the same files.

    python3 tools/generate-sounds.py            # writes public/sounds/*.wav
Requires: numpy, scipy.

Design rules (see the game spec): subtle, never harsh. Peaks are kept well below full scale, and
corruption sounds are low drones and soft textures, not jumpscares.
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sounds")
rng = np.random.RandomState(1337)


def t_axis(seconds):
    return np.arange(int(SR * seconds)) / SR


def lowpass(x, hz, order=4):
    return sosfilt(butter(order, hz, btype="low", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=3):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def noise(n):
    return rng.uniform(-1, 1, n)


def sine(freq, t, phase=0.0):
    return np.sin(2 * np.pi * freq * t + phase)


def decay(t, tau):
    return np.exp(-t / tau)


def swell(t, attack, release, total):
    """Smooth attack/release envelope (raised-cosine edges)."""
    env = np.ones_like(t)
    a = t < attack
    env[a] = 0.5 - 0.5 * np.cos(np.pi * t[a] / attack)
    r = t > total - release
    env[r] = 0.5 + 0.5 * np.cos(np.pi * (t[r] - (total - release)) / release)
    return env


def finish(x, peak, edge_ms=3):
    """Normalise to `peak` and soften the first/last few ms so nothing clicks."""
    x = x - np.mean(x)
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    e = max(1, int(SR * edge_ms / 1000))
    ramp = np.linspace(0, 1, e)
    x[:e] *= ramp
    x[-e:] *= ramp[::-1]
    return x


def loopable(x, n, fade):
    """Make a seamless loop of length n from x (length >= n+fade) by equal-power crossfading the tail into the head."""
    y = x[:n].copy()
    w = np.linspace(0, np.pi / 2, fade)
    y[:fade] = y[:fade] * np.sin(w) + x[n:n + fade] * np.cos(w)
    return y


def save(name, x):
    pcm = np.int16(np.clip(x, -1, 1) * 32767)
    path = os.path.join(OUT, name + ".wav")
    wavfile.write(path, SR, pcm)
    print(f"{name:18s} {len(x)/SR:5.2f}s  peak {np.max(np.abs(x)):.2f}  rms {np.sqrt(np.mean(x**2)):.3f}  {os.path.getsize(path)//1024:4d} KB")


def build():
    os.makedirs(OUT, exist_ok=True)

    # --- UI -----------------------------------------------------------------------------------
    t = t_axis(0.05)
    save("ui_click", finish(sine(1800, t) * decay(t, 0.008) + 0.15 * noise(len(t)) * decay(t, 0.004), 0.35))

    t = t_axis(0.045)
    save("dialogue", finish(sine(520, t) * swell(t, 0.008, 0.02, 0.045), 0.18))

    # --- Interaction --------------------------------------------------------------------------
    t = t_axis(0.16)
    thump = sine(140, t) * decay(t, 0.03)
    click = bandpass(noise(len(t)), 900, 2500) * decay(t, 0.006)
    save("button", finish(thump + 0.8 * click, 0.5))

    t = t_axis(0.3)
    knock = lambda at: np.where(t >= at, sine(105, np.maximum(t - at, 0)) * decay(np.maximum(t - at, 0), 0.025), 0)
    save("locked", finish(knock(0) + 0.8 * knock(0.13) + 0.2 * lowpass(noise(len(t)), 600) * decay(t, 0.05), 0.45))

    # --- Doors --------------------------------------------------------------------------------
    t = t_axis(0.45)
    center = np.linspace(300, 900, len(t))
    x = lowpass(noise(len(t)), 1400)
    # crude moving band: blend a few fixed bands according to the sweep position
    lo, hi = bandpass(x, 200, 450), bandpass(x, 600, 1200)
    mix = (center - 300) / 600
    save("door_slide", finish((lo * (1 - mix) + hi * mix) * swell(t, 0.06, 0.18, 0.45), 0.4))

    t = t_axis(0.9)
    thunk = sine(88, t) * decay(t, 0.09)
    slide = lowpass(noise(len(t)), 700) * swell(t, 0.1, 0.4, 0.9) * 0.5
    rise = sine(180 + 120 * t, t) * swell(t, 0.2, 0.5, 0.9) * 0.15
    save("door_open", finish(thunk + slide + rise, 0.5))

    # --- Puzzle feedback ----------------------------------------------------------------------
    def note(freq, t, start, tau):
        tt = np.maximum(t - start, 0)
        body = sine(freq, tt) + 0.3 * sine(2 * freq, tt) + 0.1 * sine(3 * freq, tt)
        return np.where(t >= start, body * decay(tt, tau), 0)

    t = t_axis(0.8)
    save("success", finish(note(659.3, t, 0, 0.18) + note(987.8, t, 0.11, 0.22), 0.4))

    t = t_axis(1.4)
    arp = sum(note(f, t, i * 0.16, 0.3) for i, f in enumerate([523.3, 659.3, 784.0, 1046.5]))
    save("level_complete", finish(arp, 0.4))

    # --- Movement / glitch --------------------------------------------------------------------
    t = t_axis(0.4)
    sweep = sine(0, t, 2 * np.pi * np.cumsum(np.linspace(900, 120, len(t))) / SR)
    save("teleport", finish(sweep * swell(t, 0.02, 0.2, 0.4) + 0.2 * lowpass(noise(len(t)), 800) * decay(t, 0.15), 0.4))

    t = t_axis(0.3)
    gate = np.zeros_like(t)
    for start, dur in [(0.0, 0.05), (0.09, 0.04), (0.17, 0.07)]:
        gate[(t >= start) & (t < start + dur)] = 1
    crushed = np.round(noise(len(t)) * 6) / 6  # coarse bit-crush
    save("glitch", finish(lowpass(crushed, 3500) * gate * decay(t, 0.25), 0.3))

    # --- Transitions / corruption stinger -----------------------------------------------------
    t = t_axis(0.5)
    save("transition", finish(lowpass(noise(len(t)), 1800) * swell(t, 0.2, 0.25, 0.5), 0.25))

    t = t_axis(1.2)
    drone = sine(55, t) + 0.8 * sine(82.5, t) + 0.5 * sine(110.7, t)
    save("stage_up", finish(lowpass(drone, 400) * swell(t, 0.7, 0.5, 1.2), 0.45))

    # --- Endings ------------------------------------------------------------------------------
    t = t_axis(3.5)
    chord = sine(220, t) + 0.8 * sine(261.6, t) + 0.7 * sine(329.6, t) + 0.3 * sine(440, t)
    save("ending", finish(chord * swell(t, 0.9, 1.6, 3.5), 0.4))

    t = t_axis(2.2)
    vibrato = sine(392 + 3 * sine(5, t), t)
    shimmer = 0.12 * sine(1568, t) * swell(t, 0.5, 1.0, 2.2)
    save("secret", finish((vibrato + shimmer) * swell(t, 0.3, 1.4, 2.2), 0.3))

    # --- Ambient loops (4 s, seamless: periodic parts use whole cycles, noise is crossfaded) -----
    n = SR * 4
    fade = int(SR * 0.4)
    tt = np.arange(n + fade) / SR
    air = lowpass(noise(n + fade), 500)
    hum = sine(60, tt) * 0.5 + sine(120, tt) * 0.25 + sine(180, tt) * 0.1
    room = loopable(air * 0.6 + hum, n, fade)
    save("ambient_room", finish(room, 0.25, edge_ms=0))

    air2 = lowpass(noise(n + fade), 300)
    drone = sine(55, tt) + 0.9 * sine(55.5, tt) + 0.5 * sine(110.5, tt)
    trem = 0.75 + 0.25 * sine(0.5, tt)
    corrupt = loopable(drone * trem + 0.5 * air2, n, fade)
    save("ambient_corrupt", finish(corrupt, 0.3, edge_ms=0))

    # --- The presence (Level 5): a low, slowly beating tone with a faint thin overtone ---------
    # Generated last so adding it never changes the random stream of the sounds above.
    t = t_axis(2.4)
    beat = sine(73, t) + sine(76.5, t)  # two close tones beat slowly against each other
    thin = 0.08 * sine(1244.5, t) * (0.6 + 0.4 * sine(3, t))
    save("presence", finish(lowpass(beat, 300) * swell(t, 1.0, 1.2, 2.4) + thin * swell(t, 1.2, 1.0, 2.4), 0.4))


if __name__ == "__main__":
    build()
