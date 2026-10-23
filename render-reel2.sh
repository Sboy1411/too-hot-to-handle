#!/usr/bin/env bash
# Reel 2, "THE GROUP CHAT" (Reel2GroupChat, 1080×1920, 30 fps, 52 s).
# Renders the picture in short segments (skips segments that exist), builds the soundtrack and muxes
#   out/reel2/TooHotToHandle_Reel2_GroupChat.mp4
# Usage: ./render-reel2.sh SONG_MASTER    — delete out/reel2/seg/NN.mp4 to force a segment re-render.
set -euo pipefail
SONG="${1:?song master (wav/mp3)}"
COMP=Reel2GroupChat
FRAMES=1560
OUT=out/reel2
mkdir -p "$OUT/seg"
node --experimental-strip-types analysis/reel2_cues.ts 2>/dev/null > "$OUT/cues.json"
python3 analysis/reel2_audio.py "$SONG" "$OUT/cues.json" "$OUT/audio"
export BUNDLE="$PWD/out/bundle-reel2"
rm -rf "$BUNDLE" && node render.mjs --bundleOnly 1 >/dev/null
BOUNDS=($(seq 0 150 $((FRAMES - 1))) "$FRAMES")
: > "$OUT/seg/list.txt"
for ((i = 0; i < ${#BOUNDS[@]} - 1; i++)); do
  a=${BOUNDS[$i]}; b=$((${BOUNDS[$((i + 1))]} - 1))
  f="$OUT/seg/$(printf %03d $i).mp4"
  if [[ ! -s "$f" ]]; then
    echo "== segment $i frames $a-$b"
    ok=0
    for try in 1 2 3; do
      if node render.mjs --comp "$COMP" --frames "$a-$b" --out "$f.tmp.mp4" > "$f.log" 2>&1; then ok=1; break; fi
      echo "   retry $try"
    done
    [[ $ok == 1 ]] || { tail -20 "$f.log"; exit 1; }
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "$OUT/seg/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$OUT/seg/list.txt" -c copy "$OUT/video-only.mp4"
ffmpeg -y -loglevel error -i "$OUT/video-only.mp4" -i "$OUT/audio/reel2-mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 \
  -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 320k -ar 48000 -t 52 -movflags +faststart "$OUT/TooHotToHandle_Reel2_GroupChat.mp4"
echo "final $OUT/TooHotToHandle_Reel2_GroupChat.mp4"
