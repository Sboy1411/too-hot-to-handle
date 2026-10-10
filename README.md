# Too Hot To Handle — lyric / music video

A code-driven music video for **Too Hot To Handle**, rendered with [Remotion](https://remotion.dev) (React → frames → H.264). All typography and motion graphics are generated in code and timed to the lyric cues and to an analysis of the master audio.

## What's in here

| Path | What it is |
|---|---|
| `analysis/analyze.py` | Audio analysis of the master (tempo, beat grid, onsets, per-frame energy in low/mid/high bands) → `src/data/audio.json` |
| `analysis/build_lyrics.py` | Turns the timed lyric CSV into per-word timings snapped to vocal onsets → `src/data/lyrics.json` |
| `src/scenes.tsx` | The edit: one scene per lyric cue (46 cues) plus title and end cards. Set `ARTIST` here for the title/end cards. |
| `src/lib/Words.tsx` | Kinetic type engine (rise, slam, pop, drop, blur, flicker, scramble, type…) with accent styles |
| `src/lib/sections.ts` | Song structure, per-section palette/fire/embers/temperature, and the big "hits" (flash + camera kick) |
| `src/layers/*` | Global layers: background bloom, procedural fire, embers, heat gauge HUD, grain, vignette, light leaks, letterbox |
| `src/props/*` | Motion-graphic props: mirror, door of light, mood dial, weather widget, social feed, newspaper, spotlight, glitch, trend chart, phone, vinyl, stamps, candle, heart, player, viewfinder, tabloid wall, marquee… |

## Build

```bash
npm install
python3 -m pip install librosa soundfile          # only to re-run the analysis
python3 analysis/analyze.py MASTER.wav src/data/audio.json
python3 analysis/build_lyrics.py analysis/lyrics.csv src/data/audio.json src/data/lyrics.json

npx remotion studio                                # live preview (no audio)
./render-all.sh /path/to/FINAL_PRODUCTION_MASTER.wav          # 1080p30 → out/TooHot.mp4
./render-all.sh /path/to/FINAL_PRODUCTION_MASTER.wav TooHot4K # 4K → out/TooHot4K.mp4
```

`render-all.sh` renders the song in section segments (delete a segment in `out/seg-*/` to re-render just that part), concatenates them and muxes the master audio (AAC 384k, 48 kHz). Set `CHROME=/path/to/headless_shell` if Chrome Headless Shell lives elsewhere.
