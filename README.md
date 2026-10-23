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

## GARMI 24×7 news-bulletin Short (`src/garmi/`)

A third, separate edit: a 65.37 s vertical (1080×1920, 30 fps) promo told as a muted midnight news bulletin on a made-up channel, GARMI 24×7. The anchor speaks only through closed captions; at 0:28.37 the channel is hijacked and the song master takes over from its first second, cut at song 0:34.06 when an old CRT switches off.

| Path | What it is |
|---|---|
| `src/garmi/timeline.ts` | Every time in the brief: scenes, wipes, straps, captions (anchor lines + sung word onsets), temperature curve, hits, ticker text |
| `src/garmi/GarmiNews.tsx` | The composition: fixed news layout, what is on air in the picture box, camera shake, CRT switch-off, end card |
| `src/garmi/chrome.tsx` | Top bar (logo, LIVE, clock, temperature), flip-up lower-third strap, CC box, ticker, backdrop, red skewed wipe |
| `src/garmi/studio.tsx` | The studio set with its 3×2 monitor wall (blue grid, temperature, heat alert, sunset/moon, the hijack boot), crack, close-up |
| `src/garmi/scenes.tsx` | Opener, live heat map, CCTV + melting-sunglasses exhibit, signal lost, thermometer, forecast, debate panel, profile / live chat / spotlights, end card |
| `src/garmi/art.tsx` | The drawn cast: anchor, Sector 17 uncle, jealous mirror, melting aviators (the four portraits in `public/garmi/` are the supplied art) |
| `analysis/garmi_audio.py` | News theme (152 BPM, D minor) + SFX, song cut, "spotlight" echo/reverb, loudness report |
| `analysis/garmi_srt.ts` | Caption files (exact brief timings, and a non-overlapping version) |

```bash
./render-garmi.sh /path/to/FINAL_STREAMING_MASTER.mp3     # → out/garmi/TooHotToHandle_GARMI_Short.mp4 (+ _-14LUFS variant)
node --experimental-strip-types analysis/garmi_srt.ts out/garmi
node render.mjs --comp GarmiNews --still 48,156,270 --outdir out/garmi/keyframes
```
