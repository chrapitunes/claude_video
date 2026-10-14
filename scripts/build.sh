#!/usr/bin/env bash
# Full pipeline: soundtrack -> frames -> final MP4 (out/claude_showreel_2026.mp4)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/audio.py
node scripts/render.cjs
ffmpeg -y -loglevel error -i out/reel_silent.mp4 -i out/soundtrack.wav \
  -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/claude_showreel_2026.mp4
echo "done -> out/claude_showreel_2026.mp4"
