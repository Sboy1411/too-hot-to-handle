#!/usr/bin/env bash
# Renders the video in section segments (skips segments that already exist), then concatenates and muxes the master audio.
# Usage: ./render-all.sh [AUDIO_WAV] [COMP]   — delete out/seg/NN.mp4 to force a segment re-render.
set -euo pipefail
AUDIO="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
COMP="${2:-TooHot}"
BOUNDS=($(seq 0 150 4200) 4300)   # short segments: each runs in a fresh browser
mkdir -p "out/seg-$COMP"
export BUNDLE="$PWD/out/bundle"
rm -rf "$BUNDLE" && node render.mjs --bundleOnly 1 >/dev/null
: > "out/seg-$COMP/list.txt"
for ((i = 0; i < ${#BOUNDS[@]} - 1; i++)); do
  a=${BOUNDS[$i]}; b=$((${BOUNDS[$((i + 1))]} - 1))
  f="out/seg-$COMP/$(printf %03d $i).mp4"
  if [[ ! -s "$f" ]]; then
    echo "== segment $i frames $a-$b"
    ok=0
    for try in 1 2 3; do   # headless Chrome occasionally stalls a tab; a fresh run gets past it
      if node render.mjs --comp "$COMP" --frames "$a-$b" --out "$f.tmp.mp4" > "$f.log" 2>&1; then ok=1; break; fi
      echo "   retry $try"
    done
    [[ $ok == 1 ]] || { tail -20 "$f.log"; exit 1; }
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "out/seg-$COMP/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "out/seg-$COMP/list.txt" -c copy "out/$COMP-video.mp4"
ffmpeg -y -loglevel error -i "out/$COMP-video.mp4" -i "$AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 384k -ar 48000 -shortest -movflags +faststart "out/$COMP.mp4"
echo "final out/$COMP.mp4"
