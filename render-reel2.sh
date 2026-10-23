#!/usr/bin/env bash
# Reel 2, "THE GROUP CHAT" (1080×1920, 30 fps; lengths come from src/reel2/timeline.ts).
#   ./render-reel2.sh SONG full    → out/reel2/TooHotToHandle_Reel2_GroupChat.mp4   (63 s story cut)
#   ./render-reel2.sh SONG cut30   → out/reel2/TooHotToHandle_Reel2_30s.mp4         (discovery cut)
#   ./render-reel2.sh SONG cut17   → out/reel2/TooHotToHandle_Reel2_17s.mp4         (hook cut)
# Renders the picture in short segments (skips segments that exist), builds the soundtrack and muxes.
# Delete out/reel2/seg-<cut>/NN.mp4 to force a segment re-render.
set -euo pipefail
SONG="${1:?song master (wav/mp3)}"
CUT="${2:-full}"
case "$CUT" in
  full) COMP=Reel2GroupChat; NAME=TooHotToHandle_Reel2_GroupChat ;;
  cut30) COMP=Reel2Cut30; NAME=TooHotToHandle_Reel2_30s ;;
  cut17) COMP=Reel2Cut17; NAME=TooHotToHandle_Reel2_17s ;;
  *) echo "unknown cut $CUT"; exit 1 ;;
esac
OUT=out/reel2
SEG="$OUT/seg-$CUT"
mkdir -p "$SEG"
node --experimental-strip-types analysis/reel2_cues.ts "$CUT" 2>/dev/null > "$OUT/cues-$CUT.json"
FRAMES=$(python3 -c "import json; print(json.load(open('$OUT/cues-$CUT.json'))['frames'])")
DUR=$(python3 -c "import json; print(json.load(open('$OUT/cues-$CUT.json'))['dur'])")
python3 analysis/reel2_audio.py "$SONG" "$OUT/cues-$CUT.json" "$OUT/audio"
export BUNDLE="$PWD/out/bundle-reel2-$CUT"
rm -rf "$BUNDLE" && node render.mjs --bundleOnly 1 >/dev/null
BOUNDS=($(seq 0 150 $((FRAMES - 1))) "$FRAMES")
: > "$SEG/list.txt"
for ((i = 0; i < ${#BOUNDS[@]} - 1; i++)); do
  a=${BOUNDS[$i]}; b=$((${BOUNDS[$((i + 1))]} - 1))
  f="$SEG/$(printf %03d $i).mp4"
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
  echo "file '$(basename "$f")'" >> "$SEG/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$SEG/list.txt" -c copy "$SEG/video-only.mp4"
ffmpeg -y -loglevel error -i "$SEG/video-only.mp4" -i "$OUT/audio/reel2-$CUT-mix.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 \
  -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 320k -ar 48000 -t "$DUR" -movflags +faststart "$OUT/$NAME.mp4"
echo "final $OUT/$NAME.mp4"
