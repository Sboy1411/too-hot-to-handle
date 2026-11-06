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

## Promo Short: the group chat (`src/shorts/chat/`)

A 61 s vertical Short (1080 × 1920) that tells a story before the song takes over: in a friends' group chat the party is dead and everyone wants to leave, until "that man" walks in and the chat loses it (muffled party music from the next room). He joins (his display picture opens full screen), texts the hook (each line glows word by word as it is sung), the phone overheats and melts on the bass, reboots cracked, and dies on "Heart went pop"; "scandal!" echoes out over the title card. Song window 0:34.3 to 1:32.1.

| Path | What it is |
|---|---|
| `src/shorts/chat/chat.json` | The timeline: messages, reactions, typing, key moments and sound cues (shared with the audio script) |
| `src/shorts/chat/ui.tsx` | The chat app: status bar, header with the temperature readout, messages, keyboard, his profile photo, opening caption, banner, overheating alert |
| `src/shorts/chat/fx.tsx` | Heat-haze and melt filters, the lava field, the melting title, 👀 swarm, heart pop, dead screen |
| `src/shorts/chat/ChatShort.tsx` | The composition (`TooHotChatShort`): layers, camera hits, flashes |
| `public/shorts/` | His display picture (from Albert's artwork): full portrait and avatar crop |
| `analysis/chat_short_audio.py` | The master's slice, low-passed and turned down until a sweep opens it on the hook, message sounds derived from the timeline, typing clicks, and the echo-out ending |

```bash
./render-chat-short.sh /path/to/FINAL_PRODUCTION_MASTER.wav        # → out/TooHotChatShort.mp4
```

## Promo Short 2: breaking news (`src/shorts/news/`)

A 65 s vertical Short (1080 × 1920): a midnight bulletin on GARMI 24×7, a made-up channel, tries to explain a heatwave. It is 49°C at midnight, the sun set hours ago, the heat is walking across the city from a "dead" party in Sector 17, and the CCTV shows one man (the officers' sunglasses melted). He walks into the studio, the signal drops, and he hijacks the channel with the song's opening: the monitor wall cracks, the forecast flips to 🔥, a debate panel shouts "who's that man?", he becomes the headline, and the TV switches off as "spotlight" echoes out. The anchor talks in closed captions, which then caption the song with the English underneath. Song window 0:00 to 0:34.

| Path | What it is |
|---|---|
| `src/shorts/news/news.json` | The timeline: story beats, captions, straps, ticker, comments, song moments and the echo tail (shared with the audio script) |
| `src/shorts/news/script.ts` | Timeline helpers: story vs song time, the strap and scene on air, the temperature readout |
| `src/shorts/news/art.tsx` | The code-drawn cast (anchor, Sector 17 uncle, the jealous mirror) and Albert's portraits |
| `src/shorts/news/broadcast.tsx` | The channel graphics: top bar, straps, live captions, ticker, end card |
| `src/shorts/news/scenes.tsx` | The pictures on air: BREAKING NEWS opener, studio, heat map, CCTV, static, thermometer, forecast, debate panel, his profile with comments and spotlights |
| `src/shorts/news/NewsShort.tsx` | The composition (`TooHotNewsShort`): scene switching, wipes, camera hits, CRT switch-off |
| `public/shorts/rival-*.png` | Albert's other three portraits, the rivals on the debate panel |
| `analysis/news_short_audio.py` | A synthesized news theme at 152 BPM under the bulletin, the lights dying and static, then the master from 0:00 with an echo-out ending |

```bash
./render-news-short.sh /path/to/FINAL_PRODUCTION_MASTER.wav        # → out/TooHotNewsShort.mp4
```
