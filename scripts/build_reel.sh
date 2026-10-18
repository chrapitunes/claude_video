#!/usr/bin/env bash
# Vertical Instagram reel (1080x1920, 60 fps) with voice-over, both hook versions.
# entrada/voz-showreel/transcripcion.json comes from scripts/transcribe_voice.py
# (local Whisper; needs huggingface.co the first time to download the model).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/audio.py
python3 scripts/prepare_voice.py
python3 scripts/schedule.py
python3 scripts/reel_audio.py
node scripts/extract-code.cjs
for v in A B; do
  npx remotion render "ReelShowreel$v" "out/reel_showreel_$v.mp4" --codec=h264 --crf=18 --concurrency=2
done
