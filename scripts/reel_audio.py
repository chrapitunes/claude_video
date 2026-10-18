"""Soundtrack for the vertical reel, one per version (A/B).

Everything is placed from remotion/schedule.json (scripts/schedule.py), so
sounds land on the same frames as the visuals. Reuses the showreel's synth
voices, drops the real showreel mix in for the reel scene untouched, lays the
voice-over on top and ducks the background while the voice speaks.

    python3 scripts/reel_audio.py  -> public/reel_audio_A.wav, public/reel_audio_B.wav
"""
import json
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio as A  # noqa: E402  (shared synth voices)
import schedule  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = A.SR
DUCK_DB = -12.0      # background level under the voice
DUCK_RAMP = 0.08     # s


def read_wav(path, channels):
    with wave.open(path, 'rb') as w:
        assert w.getframerate() == SR and w.getnchannels() == channels, path
        data = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32767
    return data.reshape(-1, channels)


def soft_limit(x, knee=0.85, ceiling=0.97):
    """Leaves everything under the knee alone and rounds peaks off under the ceiling."""
    a = np.abs(x)
    over = a > knee
    y = x.copy()
    y[over] = np.sign(x[over]) * (knee + (ceiling - knee) * np.tanh((a[over] - knee) / (ceiling - knee)))
    return y


def render(S, T):
    N = int(round(S['duration'] * SR))
    # 'bed' (drone, typing, hats, risers) ducks under the voice; 'hit' does not.
    buses = {'bed': np.zeros((N, 2)), 'hit': np.zeros((N, 2))}
    rng = np.random.default_rng(7)
    sc = S['scenes']
    cue = S['cues']

    def add(sig, t, gain=1.0, pan=0.0, bus='bed'):
        i = int(round(t * SR))
        if i >= N:
            return
        sig = sig[: N - i] * gain
        out = buses[bus]
        out[i:i + len(sig), 0] += sig * np.sqrt(0.5 * (1 - pan))
        out[i:i + len(sig), 1] += sig * np.sqrt(0.5 * (1 + pan))

    def key_click():
        t = A.tt(0.018)
        n = rng.standard_normal(len(t))
        n = n - A.onepole(n, 2500)
        tone = np.sin(2 * np.pi * rng.uniform(1800, 2600) * t)
        return (n * 0.6 + tone * 0.25) * np.exp(-t * 320)

    # hook: low hit
    add(A.kick(big=True), 0.0, 1.0, bus='hit')
    add(A.impact(1.6), 0.0, 0.6, bus='hit')

    # low drone under the build-up, gone before the silence
    silence = sc['bridge']['silence']
    t = A.tt(silence[0] - 0.1)
    drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 110.4 * t)) * 0.06
    drone *= np.minimum(1, t / 0.8) * np.minimum(1, (t[-1] - t) / 0.3)
    add(drone, 0.0)

    for name in ('chat', 'code'):
        add(A.whoosh(0.35, rise=False), sc[name]['start'], 0.3)

    # chat: one key click per typed character (same timing as the visuals)
    prompt = T['prompt']
    s, e = cue['chatTyping']
    for i, ch in enumerate(prompt):
        if ch != ' ':
            add(key_click(), s + (i + 1) / len(prompt) * (e - s), rng.uniform(0.35, 0.55), rng.uniform(-0.3, 0.3))
    add(A.blip(880, 0.12, 30), cue['chatSend'][0], 0.9)
    add(A.blip(1320, 0.1, 35), cue['chatSend'][0] + 0.06, 0.6)

    # code: hi-hats that speed up and rise with the typing
    c0 = sc['code']['start']
    c1 = c0 + sc['code']['duration']
    tc = c0
    while tc < c1:
        x = (tc - c0) / (c1 - c0)
        add(A.hat(), tc, 0.35 + 0.6 * x, pan=(-1) ** int(tc * 16) * 0.3)
        if x > 0.55:
            add(A.blip(2400 + 1600 * x, 0.03, 120), tc, 0.15 * x)
        tc += 0.25 * (1 - x) + 0.0625 * x

    # bridge: riser into half a second of silence, then the drop
    b0 = sc['bridge']['start']
    rd = silence[0] - b0
    rt = A.tt(rd)
    riser = np.sin(2 * np.pi * np.cumsum(220 + 1800 * (rt / rd) ** 2) / SR) * (rt / rd) ** 2 * 0.2
    add(riser + A.whoosh(rd) * 0.7, b0, 1.0)

    # tail: hit
    add(A.kick(big=True), sc['tail']['start'], 1.0, bus='hit')
    add(A.impact(1.5), sc['tail']['start'], 0.6, bus='hit')

    # call to action: card ticks, and the blip on the spoken word PROMPT
    add(A.whoosh(0.3, rise=False), sc['cta']['start'], 0.3)
    for k, tk in enumerate(cue['ctaCards']):
        add(A.blip(1100 + 400 * k, 0.08, 45), tk, 0.7, bus='hit')
    add(A.blip(1320, 0.25, 14), cue['ctaBlip'][0], 0.8, bus='hit')
    add(A.blip(1760, 0.3, 12), cue['ctaBlip'][0] + 0.08, 0.6, bus='hit')

    # one shared gain so bed and hits keep their balance
    scale = 1 / (np.max(np.abs(buses['bed'] + buses['hit'])) + 1e-9)
    shape = lambda x: np.tanh(x * scale * 1.4) / np.tanh(1.4) * 0.92
    bed, hit = shape(buses['bed']), shape(buses['hit'])

    # voice-over and the ducking envelope it drives
    vo = np.zeros(N)
    active = np.zeros(N)
    for v in S['voice']:
        line = read_wav(os.path.join(ROOT, 'public', v['file']), 1)[:, 0]
        i = int(round(v['start'] * SR))
        line = line[: N - i]
        vo[i:i + len(line)] += line
        active[i:i + len(line)] = 1
    ramp = int(DUCK_RAMP * SR)
    kernel = np.ones(ramp) / ramp
    env = np.convolve(np.convolve(active, kernel, 'same'), kernel, 'same')
    duck = 1 - (1 - 10 ** (DUCK_DB / 20)) * np.clip(env, 0, 1)
    bg = bed * duck[:, None] + hit * 0.6

    # the silence window stays silent
    si = int(silence[0] * SR), int(silence[1] * SR)
    bg[si[0]:si[1]] = 0

    # the showreel with its own mix, full volume
    master = read_wav(os.path.join(ROOT, 'out', 'soundtrack.wav'), 2)
    a, b = int(T['reel']['from'] * SR), int(T['reel']['to'] * SR)
    seg = master[a:b].copy()
    fade = int(0.15 * SR)
    seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
    r0 = int(round(sc['reel']['start'] * SR))

    mix = soft_limit(bg + vo[:, None])
    mix[r0:r0 + len(seg)] += seg
    return np.clip(mix, -1, 1)


if __name__ == '__main__':
    T = schedule.load('timeline.json')
    S_all = json.load(open(os.path.join(ROOT, 'remotion', 'schedule.json'), encoding='utf-8'))
    for v, S in S_all.items():
        mix = render(S, T)
        A.write_wav(os.path.join(ROOT, 'public', f'reel_audio_{v}.wav'), mix)
        print(f'wrote public/reel_audio_{v}.wav ({S["duration"]:.2f} s, peak {np.max(np.abs(mix)):.2f})')
