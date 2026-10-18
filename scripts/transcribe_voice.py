"""Word-level transcription of the voice-over with local Whisper (faster-whisper).

    python3 scripts/transcribe_voice.py <audio> <out.json> [model]
"""
import json
import sys

from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
model_name = sys.argv[3] if len(sys.argv) > 3 else 'medium'
model = WhisperModel(model_name, device='cpu', compute_type='int8')
segments, info = model.transcribe(audio, language='es', word_timestamps=True, vad_filter=False, beam_size=5)
words = []
for seg in segments:
    for w in seg.words:
        words.append({'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 3)})
json.dump({'model': model_name, 'words': words}, open(out, 'w'), ensure_ascii=False, indent=1)
print(' '.join(w['word'] for w in words))
for w in words:
    print(f"{w['start']:6.2f} {w['end']:6.2f} {w['p']:.2f} {w['word']}")
