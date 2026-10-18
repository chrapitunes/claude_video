"""Cuts the ElevenLabs voice-over into its script lines, normalizes them and
stores word timings from the Whisper transcription.

    python3 scripts/prepare_voice.py
      in:  entrada/voz-showreel/voz_original.mp3
           entrada/voz-showreel/transcripcion.json  (scripts/transcribe_voice.py)
      out: public/voz/<line>.wav, public/voz/voz_original.mp3, remotion/voice.json
"""
import json
import os
import re
import shutil
import subprocess
import unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'entrada', 'voz-showreel', 'voz_original.mp3')
TRANSCRIPT = os.path.join(ROOT, 'entrada', 'voz-showreel', 'transcripcion.json')
OUT_DIR = os.path.join(ROOT, 'public', 'voz')

# Script lines, in recorded order. *word* = accent color in the subtitles.
LINES = [
    ('01A', '¡Ningún programa de edición! Este video lo hizo *Claude.*'),
    ('01B', 'Editores de motion graphics: tenemos que *hablar.*'),
    ('02', 'Le pedí *esto.* Por escrito.'),
    ('03', '¡Y Claude escribió todo el *código* solo!'),
    ('04', 'Y el código se volvió *esto.*'),
    ('05', '¡Sin *After Effects!* ¡Sin *Premiere!*'),
    ('06', '¿Quieres el prompt exacto? Comenta *PROMPT* y te lo mando.'),
]
# Loudness target per line (LUFS). The whisper stays a little under the rest.
LOUDNESS = {'04': -19.0}
DEFAULT_LUFS = -16.0
MAX_CHUNK = 6  # words per subtitle page


def assign_chunks(entries):
    """Subtitle pages: split at sentence punctuation, then split long
    clauses into even parts of at most MAX_CHUNK words."""
    clauses, cur = [], []
    for e in entries:
        cur.append(e)
        if re.search(r'[.!?:]$', e['text']):
            clauses.append(cur)
            cur = []
    if cur:
        clauses.append(cur)
    chunk = 0
    for c in clauses:
        parts = -(-len(c) // MAX_CHUNK)
        size = -(-len(c) // parts)
        for i, e in enumerate(c):
            e['chunk'] = chunk + i // size
        chunk += parts


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def silences(path):
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'silencedetect=noise=-38dB:d=0.25', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    return list(zip(starts, ends))


def duration(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                                capture_output=True, text=True).stdout)


def loudnorm(src, dst, start, end, lufs):
    base = ['ffmpeg', '-hide_banner', '-nostats', '-y', '-ss', f'{start:.3f}', '-to', f'{end:.3f}', '-i', src]
    target = f'I={lufs}:TP=-1.5:LRA=11'
    meas = subprocess.run(base + ['-af', f'loudnorm={target}:print_format=json', '-f', 'null', '-'],
                          capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    flt = (f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
           f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
           "afade=t=in:d=0.01,areverse,afade=t=in:d=0.04,areverse")
    subprocess.run(base + ['-af', flt, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', dst], check=True, capture_output=True)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    shutil.copyfile(SRC, os.path.join(OUT_DIR, 'voz_original.mp3'))
    words = json.load(open(TRANSCRIPT))['words']
    total = duration(SRC)

    gaps = silences(SRC)
    if len(gaps) != len(LINES) - 1:
        raise SystemExit(f'expected {len(LINES) - 1} pauses between lines, found {len(gaps)}')
    spans = []
    for i in range(len(LINES)):
        a = 0.0 if i == 0 else max((gaps[i - 1][0] + gaps[i - 1][1]) / 2, gaps[i - 1][1] - 0.06)
        b = total if i == len(LINES) - 1 else min((gaps[i][0] + gaps[i][1]) / 2, gaps[i][0] + 0.12)
        spans.append((a, b))

    out = {}
    for (lid, text), (a, b) in zip(LINES, spans):
        heard = [w for w in words if a <= (w['start'] + w['end']) / 2 < b]
        tokens = text.split(' ')
        if [norm(w['word']) for w in heard] != [norm(t.replace('*', '')) for t in tokens]:
            raise SystemExit(f"line {lid} does not match the script:\n  script: {text}\n  heard:  {' '.join(w['word'] for w in heard)}")

        dst = os.path.join(OUT_DIR, f'{lid}.wav')
        loudnorm(SRC, dst, a, b, LOUDNESS.get(lid, DEFAULT_LUFS))

        entries, accent = [], False
        for tok, w in zip(tokens, heard):
            opens = tok.lstrip('¡¿').startswith('*')
            closes = tok.endswith('*') or tok.rstrip('!?.,:').endswith('*')
            entries.append({
                'text': tok.replace('*', ''),
                'start': round(max(0.0, w['start'] - a), 3),
                'end': round(min(b - a, w['end'] - a), 3),
                'accent': accent or opens,
            })
            accent = (accent or opens) and not closes
        assign_chunks(entries)
        out[lid] = {'file': f'voz/{lid}.wav', 'duration': round(duration(dst), 3), 'words': entries}
        print(f"{lid}  {a:6.2f}-{b:6.2f}  {out[lid]['duration']:.2f}s  {text}")

    json.dump(out, open(os.path.join(ROOT, 'remotion', 'voice.json'), 'w'), ensure_ascii=False, indent=1)
    print('wrote public/voz/*.wav and remotion/voice.json')


if __name__ == '__main__':
    main()
