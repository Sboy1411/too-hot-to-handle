#!/usr/bin/env bash
# Renders the video in section segments (skips segments that already exist), then concatenates and muxes the master audio.
# Usage: ./render-all.sh [AUDIO_WAV] [COMP]   — delete out/seg/NN.mp4 to force a segment re-render.
set -euo pipefail
AUDIO="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
COMP="${2:-TooHot}"
BOUNDS=(0 311 1032 1410 1989 2424 2760 3152 3619 3897 4300)
mkdir -p "out/seg-$COMP"
: > "out/seg-$COMP/list.txt"
for ((i = 0; i < ${#BOUNDS[@]} - 1; i++)); do
  a=${BOUNDS[$i]}; b=$((${BOUNDS[$((i + 1))]} - 1))
  f="out/seg-$COMP/$(printf %02d $i).mp4"
  if [[ ! -s "$f" ]]; then
    echo "== segment $i frames $a-$b"
    node render.mjs --comp "$COMP" --frames "$a-$b" --out "$f.tmp.mp4" | grep -E "done|rror" || true
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "out/seg-$COMP/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "out/seg-$COMP/list.txt" -c copy "out/$COMP-video.mp4"
ffmpeg -y -loglevel error -i "out/$COMP-video.mp4" -i "$AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 384k -ar 48000 -shortest -movflags +faststart "out/$COMP.mp4"
echo "final out/$COMP.mp4"
