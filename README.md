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

## Viral cut (`src/viral/`)

A second, separate edit: the whole song seen through a thermal camera whose reading climbs from 36.6°C to over 650°C until the sensor overloads, freezes, melts and reboots. It reuses the same word timings and master audio; the revision-2 edit above is untouched.

| Path | What it is |
|---|---|
| `src/viral/Viral.tsx` | The composition: palette blend per moment, camera moves, HUD, freezes |
| `src/viral/act1.tsx` … `act5.tsx` | The 47 scenes, intro to reboot |
| `src/viral/thermal.tsx` | False-colour mapping (IRONBOW, ARCTIC, LAVA, RAINBOW, WHITE/BLACK-HOT, GOLD, OVERLOAD) applied to greyscale heat content |
| `src/viral/world.tsx`, `fx.tsx` | Heat sources and props: heat field, blobs, rings, flames, the walking figure, crowd, reflections, cracks, vinyl, charts |
| `src/viral/type.tsx` | Heat-type engine: measured layout, karaoke heat curves, melt/punch/scramble animations |
| `src/viral/story.ts`, `hud.tsx` | Beat grid (154 BPM), palette and temperature timelines, glitch windows, the camera HUD |
| `src/viral/Extras.tsx` | The YouTube thumbnail (`TooHotViralThumb`) and the 15 s vertical Short (`TooHotViralShort`) |
| `analysis/make_srt.py` | Caption files for YouTube: lyrics as sung and an English translation |

```bash
./render-all.sh /path/to/FINAL_PRODUCTION_MASTER.wav TooHotViral   # → out/TooHotViral.mp4
./render-short.sh /path/to/FINAL_PRODUCTION_MASTER.wav             # → out/TooHotViralShort.mp4
./encode-viral.sh                                                  # 1440p upload, 720p share, studio master → out/deliver/
node render.mjs --comp TooHotViralThumb --still 0 --outdir out/extras
python3 analysis/make_srt.py out/deliver
```

## Fusion cut, concept 3 (`fusion/`)

"Two-way mirror": revision 2 (concept 1, chrome and fire) and the viral cut (concept 2, thermal) fused into one video, as if one camera with two sensors filmed the same performance. Both finished masters share the audio and the word timings, so frame n of one is frame n of the other; the fusion is composited from the two masters rather than re-rendered.

| Path | What it is |
|---|---|
| `fusion/fuse.py` | The fusion engine: the edit (which sensor shows each line), the transitions (sensor scans, heat fronts, melt, glitch, the doorway), the mirror lenses, and the encoder pipe |
| `fusion/render-masks.sh` | Renders `TooHotMirrorMask` (revision 2 with only each mirror's glass, in white) for the frame ranges with a mirror; the lens uses it to put the thermal view inside the chrome mirrors |
| `fusion/render-fusion.sh` | Full render in parallel chunks, then one concat with the viral master's audio |
| `fusion/encode-fusion.sh` | 1440p upload, 720p share and studio master → `out/deliver/Too_Hot_To_Handle_FUSION_*` |

```bash
fusion/render-masks.sh                                                       # → out/fusion/mask/
fusion/render-fusion.sh REV2_MASTER.mp4 VIRAL_MASTER.mp4                     # → out/fusion/TooHotFusion.mp4
python3 fusion/fuse.py --a REV2.mp4 --b VIRAL.mp4 --masks out/fusion/mask --out stills/ --stills 5.5,36,99   # check frames
fusion/encode-fusion.sh
```
