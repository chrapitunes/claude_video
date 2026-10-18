"""Word-level transcription of the voice-over with local Whisper (faster-whisper).

    python3 scripts/transcribe_voice.py <audio> <out.json> [model]
"""
import json
import subprocess
import sys

import numpy as np

from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
model_name = sys.argv[3] if len(sys.argv) > 3 else 'medium'
model = WhisperModel(model_name, device='cpu', compute_type='int8')
# Decode with ffmpeg (16 kHz mono float) instead of PyAV.
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                     check=True, capture_output=True).stdout
samples = np.frombuffer(pcm, dtype=np.float32)
segments, info = model.transcribe(samples, language='es', word_timestamps=True, vad_filter=False, beam_size=5)
words = []
for seg in segments:
    for w in seg.words:
        words.append({'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 3)})
json.dump({'model': model_name, 'words': words}, open(out, 'w'), ensure_ascii=False, indent=1)
print(' '.join(w['word'] for w in words))
for w in words:
    print(f"{w['start']:6.2f} {w['end']:6.2f} {w['p']:.2f} {w['word']}")
