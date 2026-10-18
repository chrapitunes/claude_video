# Claude — Motion Design Showreel 2026

A 15-second, 1920×1080, 60 fps motion graphics showreel made entirely from code.
It uses no video editor, stock footage or AI image generation. Every pixel is drawn
by `src/reel-core.js` on an HTML canvas, and every sound comes from `scripts/audio.py`.

**Final video:** [`out/claude_showreel_2026.mp4`](out/claude_showreel_2026.mp4)

## Scenes (120 BPM, cut to the beat)

| Time | Scene | What's happening |
|---|---|---|
| 0.0–1.5 | 01 Ignition | Dot pops, squashes and explodes on the first beat into shockwave rings, radial lines and particles |
| 1.25–3.6 | 02 Kinetic type | Circle reveal into crimson; "I MAKE / THINGS / MOVE." lands on the beats with masked per-letter reveals and wobble; spinning badge |
| 3.1–6.0 | 03 Rhythm | Diagonal double wipe; grid of shapes morphing between circle and square on a radial wave; difference-blended type; implosion |
| 6.0–8.6 | 04 Dimension | 1,100-particle 3D sculpture morphing sphere → cube → torus, with orbits; the camera flies through it |
| 8.55–10.6 | 05 Data | Swiss-style infographics: bars that grow and re-sort, a line chart drawing itself, progress rings, a counter |
| 10.2–11.9 | 06 Fluid | Strip wipe; screen-blended liquid blobs; echo typography |
| 11.9–12.5 | 07 Cuts | Rapid-fire recap montage, 6 cuts in 0.6 s |
| 12.5–15.0 | 08 Identity | Speed lines converge; name resolves with color-block wipes; end card |

Finishing passes on every frame: real motion blur (5 sub-frames, 180° shutter),
beat-driven camera shake, chromatic aberration on impacts, film grain, vignette and a
timecode HUD.

## Build

Requirements: Node 18+, Playwright with Chromium, Python 3 + numpy, ffmpeg.

```bash
npm run build                          # audio + render + mux -> out/claude_showreel_2026.mp4
node scripts/render.cjs --stills 2,7.5 # render single frames to out/stills/
npx serve src                          # real-time preview in the browser
```

## Vertical reel for Instagram (@martinketing.co)

`remotion/` holds a vertical reel (1080×1920, 60 fps, about 32–33 s) built with Remotion and
narrated by an ElevenLabs voice-over. It tells how the showreel was made: the written request,
the code being typed, then the full showreel, drawn live by the same engine
(`src/reel-core.js`) in a vertical layout.

| Scene | Voice line | Picture |
|---|---|---|
| hook | 01A / 01B | The showreel's 3D particle sculpture, live: it pulses on every word, and camera punches (shake, RGB split, flash, hit) land on the strong words, turning it into a cube and then bursting it into a torus (`hookPunches` in `timeline.json`) |
| chat | 02 "Le pedí esto. Por escrito." | The original request typed letter by letter, over a breathing dot grid |
| code | 03 "¡Y Claude escribió todo el código solo!" | Real excerpts of `src/reel-core.js` typed at speed, over the same grid |
| bridge | 04 "Y el código se volvió esto." (whispered) | Progress line, then half a second of silence |
| reel | none | The showreel (0.4–14.4 s of the original) at full volume |
| tail | 05 "¡Sin After Effects! ¡Sin Premiere!" | The showreel's last frame, darkened |
| cta | 06 "¿Quieres el prompt exacto? Comenta PROMPT y te lo mando." | Follow + comment PROMPT |

`ReelShowreelA` and `ReelShowreelB` differ only in the opening line. Each scene lasts its
base length from `remotion/timeline.json` or its voice line plus a short pad, whichever is
longer, so the voice is never cut. Subtitles are word by word, from the Whisper timings.

Pipeline:

1. `scripts/transcribe_voice.py`: local Whisper (faster-whisper) with word timestamps →
   `entrada/voz-showreel/transcripcion.json`.
2. `scripts/prepare_voice.py`: checks every line against the script, cuts it at the pauses,
   normalizes loudness → `public/voz/*.wav`, `remotion/voice.json`.
3. `scripts/schedule.py`: scene timing, voice placement, subtitles and cues per version →
   `remotion/schedule.json`.
4. `scripts/reel_audio.py`: sound effects, voice and the showreel mix, with the background
   ducked under the voice → `public/reel_audio_{A,B}.wav`.

```bash
npm run build:reel   # -> out/reel_showreel_A.mp4, out/reel_showreel_B.mp4
npm run studio       # preview in Remotion Studio
```
