"""Builds the per-version timeline of the vertical reel from
remotion/timeline.json (base scene lengths, cues) and remotion/voice.json
(voice-over line lengths and word timings).

A scene lasts its base length or its voice line plus a short pad, whichever
is longer, so the voice is never cut. Scene lengths are whole frames.

    python3 scripts/schedule.py  -> remotion/schedule.json
"""
import json
import math
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
VERSIONS = ('A', 'B')


def load(name):
    return json.load(open(os.path.join(ROOT, 'remotion', name), encoding='utf-8'))


def build(version, T=None, V=None):
    T = T or load('timeline.json')
    V = V or load('voice.json')
    fps = T['fps']
    scenes, voice, subs = {}, [], []
    frame = 0
    for sc in T['scenes']:
        line = None
        if 'voice' in sc:
            line = sc['voice'] + (version if sc['voice'] == '01' else '')
        need = sc['base']
        if line:
            tail = sc.get('silenceAfter', T['voicePad'])
            need = max(need, V[line]['duration'] + tail)
        dur_f = math.ceil(round(need * fps, 6))
        start = frame / fps
        scenes[sc['id']] = {'start': start, 'duration': dur_f / fps, 'from': frame, 'frames': dur_f}
        if 'silenceAfter' in sc:
            scenes[sc['id']]['silence'] = [(frame + dur_f) / fps - sc['silenceAfter'], (frame + dur_f) / fps]
        if line:
            voice.append({'id': line, 'file': V[line]['file'], 'start': start, 'duration': V[line]['duration']})
            words = V[line]['words']
            pages = sorted({w['chunk'] for w in words})
            for p in pages:
                ws = [w for w in words if w['chunk'] == p]
                nxt = [w for w in words if w['chunk'] == p + 1]
                end = min(ws[-1]['end'] + 0.35, nxt[0]['start'] if nxt else 1e9, dur_f / fps)
                subs.append({
                    'start': round(start + ws[0]['start'], 3),
                    'end': round(start + end, 3),
                    'words': [{'text': w['text'], 'accent': w['accent'], 'at': round(start + w['start'], 3)} for w in ws],
                })
        frame += dur_f

    cues = {}
    for name, (scene, *times) in T['cues'].items():
        cues[name] = [round(scenes[scene]['start'] + t, 3) for t in times]
    def word_at(line, word, scene):
        w = next(w for w in V[line]['words'] if w['text'].strip('.,:!?¡¿') == word)
        return round(scenes[scene]['start'] + w['start'], 3)

    cues['ctaBlip'] = [word_at(*T['ctaBlipWord'], 'cta')]
    hook_line = '01' + version
    cues['hookPunches'] = [[word_at(hook_line, w, 'hook'), s] for w, s in T['hookPunches'][version]]
    cues['hookWords'] = [round(scenes['hook']['start'] + w['start'], 3) for w in V[hook_line]['words']]

    return {'version': version, 'fps': fps, 'frames': frame, 'duration': frame / fps,
            'scenes': scenes, 'voice': voice, 'subtitles': subs, 'cues': cues}


if __name__ == '__main__':
    out = {v: build(v) for v in VERSIONS}
    json.dump(out, open(os.path.join(ROOT, 'remotion', 'schedule.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for v, s in out.items():
        print(v, f"{s['duration']:.2f}s", ' '.join(f"{k}:{x['start']:.2f}+{x['duration']:.2f}" for k, x in s['scenes'].items()))
