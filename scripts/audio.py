"""Synthesises the 15 s soundtrack (120 BPM) locked to the reel's visual beats.

    python3 scripts/audio.py  -> out/soundtrack.wav
"""
import os
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(1)
L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def tt(d):
    return np.arange(int(d * SR)) / SR


def onepole(x, cutoff):
    """Low-pass with a per-sample (or scalar) cutoff in Hz."""
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def kick(big=False):
    d = 1.2 if big else 0.42
    t = tt(d)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (2.5 if big else 7))
    click = rng.standard_normal(len(t)) * np.exp(-t * 300) * 0.4
    return np.tanh((body + click) * (2.2 if big else 1.6))


def clap():
    t = tt(0.35)
    n = rng.standard_normal(len(t))
    env = np.zeros(len(t))
    for o in (0, 0.011, 0.022):
        env += np.where(t >= o, np.exp(-(t - o) * 45), 0)
    n = n - onepole(n, 900)
    return n * env * 0.5 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.3


def hat(open_=False):
    t = tt(0.25 if open_ else 0.06)
    n = rng.standard_normal(len(t))
    n = n - onepole(n, 7000)
    return n * np.exp(-t * (18 if open_ else 80)) * 0.35


def whoosh(d, rise=True):
    t = tt(d)
    n = rng.standard_normal(len(t))
    x = t / d
    sweep = 300 + 7000 * (x ** 2 if rise else (1 - x) ** 2)
    env = np.sin(np.pi * np.clip(x, 0, 1)) ** 2 if not rise else x ** 3 * (1 - np.clip((x - 0.92) / 0.08, 0, 1))
    return onepole(n, sweep) * env * 0.9


def impact(tail=2.5):
    t = tt(tail)
    n = rng.standard_normal(len(t))
    crash = (n - onepole(n, 2500)) * np.exp(-t * 2.2) * 0.35
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.6)
    return np.tanh(boom * 1.6) * 0.9 + crash


def blip(freq, d=0.08, decay=40):
    t = tt(d)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * decay) * 0.25


def note(freq, d, detune=(0.0,), shape='saw'):
    t = tt(d)
    out = np.zeros(len(t))
    for dt in detune:
        f = freq * 2 ** (dt / 1200)
        if shape == 'saw':
            out += 2 * ((t * f) % 1) - 1
        else:
            out += np.sin(2 * np.pi * f * t)
    return out / len(detune)


# ---------------------------------------------------------------- arrangement
# 01 ignition
add(blip(880, 0.15, 25), 0.05, 0.8)
add(whoosh(0.45), 0.05, 0.5)
add(kick(big=True), 0.5, 1.0)
add(impact(1.6), 0.5, 0.7)
add(np.sin(2 * np.pi * 1320 * tt(0.6)) * np.exp(-tt(0.6) * 6) * 0.12, 1.0, 1.0)

# transitions
for st, d in ((1.05, 0.45), (2.95, 0.55), (5.45, 0.55), (8.05, 0.5), (10.05, 0.45)):
    add(whoosh(d), st, 0.55)
for t0 in (1.5, 3.5, 6.0, 8.55, 10.5):
    add(whoosh(0.7, rise=False), t0, 0.35, pan=0.3)

# drums 1.5 -> 11.9
for k in range(int((11.9 - 1.5) / BEAT) + 1):
    t0 = 1.5 + k * BEAT
    if abs(t0 - 6.0) < 1e-6:
        add(kick(big=True), t0, 1.0)
        add(impact(1.4), t0, 0.55)
        continue
    if 5.5 <= t0 < 6.0:
        continue  # breath before the drop
    add(kick(), t0, 0.9)
    if k % 2 == 1:
        add(clap(), t0, 0.8)
    add(hat(open_=(k % 4 == 3)), t0 + 0.25, 0.7, pan=0.25)
    if 8.5 <= t0 < 11.9:
        add(hat(), t0 + 0.125, 0.4, pan=-0.35)
        add(hat(), t0 + 0.375, 0.4, pan=-0.35)

# bass + pad: Am  F  C  G  (2 s each)
CHORDS = [(55.0, [220.0, 261.63, 329.63]), (43.65, [174.61, 220.0, 261.63]),
          (65.41, [196.0, 261.63, 329.63]), (49.0, [196.0, 246.94, 293.66])]
for bar in range(6):
    t0 = 1.5 + bar * 2.0
    if t0 >= 11.9:
        break
    root, pad = CHORDS[bar % 4]
    for e in range(16):
        tn = t0 + e * 0.125
        if tn >= 11.9 or 5.5 <= tn < 6.0:
            continue
        n = note(root * (2 if e % 4 == 2 else 1), 0.12, (0, 7))
        n = onepole(n, 600) * np.exp(-tt(0.12) * 10)
        add(n, tn, 0.55)
    d = min(2.0, 11.9 - t0)
    t = tt(d)
    p = sum(note(f, d, (-8, 8), 'sine') for f in pad)
    env = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3)
    duck = 1 - 0.6 * np.exp(-((t % BEAT) * 14))
    add(p * env * duck * 0.08, t0, 1.0, pan=0.0)

# 05 data: UI ticks on bar growth + ring blips
for i in range(14):
    add(blip(1200 + i * 60, 0.05, 60), 8.7 + i * 0.035, 0.5, pan=-0.8 + i * 0.12)
for k, f in enumerate((660, 880, 1100)):
    add(blip(f, 0.2, 18), 8.8 + k * 0.12, 0.5)
for i in range(14):
    add(blip(900 + i * 40, 0.04, 70), 9.85 + i * 0.02, 0.35, pan=0.6 - i * 0.09)

# 07 montage stutters + riser
for k in range(6):
    t0 = 11.9 + k * 0.1
    add(kick(), t0, 0.6)
    add(blip(440 * 2 ** (k / 4), 0.09, 30) * 2, t0, 0.6, pan=(-1) ** k * 0.5)
rt = tt(0.6)
riser = np.sin(2 * np.pi * np.cumsum(200 + 1600 * (rt / 0.6) ** 2) / SR) * (rt / 0.6) ** 2 * 0.15
add(riser + whoosh(0.6) * 0.6, 12.4, 1.0)

# 08 identity: the hit + resolving chord
add(kick(big=True), 13.0, 1.0)
add(impact(2.0), 13.0, 0.9)
for i in range(6):
    add(blip(1760, 0.12, 25), 13.0 + i * 0.055, 0.35, pan=-0.6 + i * 0.24)
d = 2.0
t = tt(d)
chord = sum(note(f, d, (-6, 0, 6), 'sine') for f in (110, 220, 329.63, 440, 493.88, 659.25))
add(chord * np.minimum(1, t / 0.05) * np.exp(-t * 1.1) * 0.07, 13.0, 1.0)
add(np.sin(2 * np.pi * 2637 * tt(1.0)) * np.exp(-tt(1.0) * 4) * 0.06, 13.5, 1.0, pan=0.4)

# ---------------------------------------------------------------- master
mix = np.stack([L, R], axis=1)
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
fade = np.clip((DUR - np.arange(N) / SR) / 0.45, 0, 1)[:, None]
mix *= fade * 0.95

os.makedirs('out', exist_ok=True)
with wave.open('out/soundtrack.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote out/soundtrack.wav')
