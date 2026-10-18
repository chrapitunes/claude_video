#!/usr/bin/env bash
# Vertical Instagram reel (1080x1920, 60 fps): audio + code excerpts + both hook versions.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/audio.py
python3 scripts/reel_audio.py
node scripts/extract-code.cjs
for v in A B; do
  npx remotion render "ReelShowreel$v" "out/reel_showreel_$v.mp4" --codec=h264 --crf=18 --concurrency=2
done
