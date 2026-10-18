"""Soundtrack for the vertical reel (remotion/timeline.json drives every time).

Reuses the showreel's synth voices and drops the real showreel mix in for the
reel scene, so its sound is untouched.

    python3 scripts/reel_audio.py  -> public/reel_audio.wav
"""
import json
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio as A  # noqa: E402  (shared synth voices)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
T = json.load(open(os.path.join(ROOT, 'remotion', 'timeline.json')))
SR = A.SR
N = int(SR * T['total'])
L = np.zeros(N)
R = np.zeros(N)
rng = np.random.default_rng(7)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def key_click():
    t = A.tt(0.018)
    n = rng.standard_normal(len(t))
    n = n - A.onepole(n, 2500)
    tone = np.sin(2 * np.pi * rng.uniform(1800, 2600) * t)
    return (n * 0.6 + tone * 0.25) * np.exp(-t * 320)


def read_wav(path):
    with wave.open(path, 'rb') as w:
        assert w.getframerate() == SR and w.getnchannels() == 2
        data = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32767
    return data.reshape(-1, 2)


# ---------------------------------------------------------------- synth layer
# 0:00 hook: low hit
add(A.kick(big=True), 0.0, 1.0)
add(A.impact(1.6), 0.0, 0.6)

# low drone under the build-up, gone before the half-second of silence
d0, d1 = 0.0, T['silence'][0] - 0.1
t = A.tt(d1 - d0)
drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 110.4 * t)) * 0.06
drone *= np.minimum(1, t / 0.8) * np.minimum(1, (t[-1] - t) / 0.3)
add(drone, d0)

# scene cuts
for st in (T['scenes']['chat'][0], T['scenes']['code'][0]):
    add(A.whoosh(0.35, rise=False), st, 0.3)

# 0:02 chat: one key click per typed character (same timing as the visuals)
prompt = T['prompt']
s, e = T['chatTyping']
for i, ch in enumerate(prompt):
    if ch == ' ':
        continue
    add(key_click(), s + (i + 1) / len(prompt) * (e - s), rng.uniform(0.35, 0.55), rng.uniform(-0.3, 0.3))
add(A.blip(880, 0.12, 30), T['chatSend'], 0.9)
add(A.blip(1320, 0.1, 35), T['chatSend'] + 0.06, 0.6)

# 0:05 code: hi-hats that speed up and rise with the typing
c0, c1 = T['scenes']['code']
tc = c0
while tc < c1:
    x = (tc - c0) / (c1 - c0)
    add(A.hat(), tc, 0.35 + 0.6 * x, pan=(-1) ** int(tc * 16) * 0.3)
    if x > 0.55:
        add(A.blip(2400 + 1600 * x, 0.03, 120), tc, 0.15 * x)
    tc += 0.25 * (1 - x) + 0.0625 * x

# 0:09 bridge: riser into half a second of silence, then the drop
b0 = T['scenes']['bridge'][0]
rd = T['silence'][0] - b0
rt = A.tt(rd)
riser = np.sin(2 * np.pi * np.cumsum(220 + 1800 * (rt / rd) ** 2) / SR) * (rt / rd) ** 2 * 0.2
add(riser + A.whoosh(rd) * 0.7, b0, 1.0)

# 0:24 tail: hit
add(A.kick(big=True), T['scenes']['tail'][0], 1.0)
add(A.impact(1.5), T['scenes']['tail'][0], 0.6)

# 0:26 call to action: card ticks and the final blip
add(A.whoosh(0.3, rise=False), T['scenes']['cta'][0], 0.3)
for k, tk in enumerate(T['ctaCards']):
    add(A.blip(1100 + 400 * k, 0.08, 45), tk, 0.7)
add(A.blip(1320, 0.25, 14), T['ctaBlip'], 0.8)
add(A.blip(1760, 0.3, 12), T['ctaBlip'] + 0.08, 0.6)

synth = np.stack([L, R], axis=1)
synth /= np.max(np.abs(synth)) + 1e-9
synth = np.tanh(synth * 1.4) / np.tanh(1.4) * 0.92

# silence window stays silent
si = int(T['silence'][0] * SR), int(T['silence'][1] * SR)
synth[si[0]:si[1]] = 0

# ---------------------------------------------------------------- showreel
master = read_wav(os.path.join(ROOT, 'out', 'soundtrack.wav'))
a, b = int(T['reel']['from'] * SR), int(T['reel']['to'] * SR)
seg = master[a:b].copy()
fade = int(0.15 * SR)
seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
r0 = int(T['scenes']['reel'][0] * SR)

mix = synth
mix[r0:r0 + len(seg)] += seg
mix = np.clip(mix, -1, 1)
A.write_wav(os.path.join(ROOT, 'public', 'reel_audio.wav'), mix)
print('wrote public/reel_audio.wav')
