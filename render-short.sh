#!/usr/bin/env bash
# Renders the vertical Short (TooHotViralShort, 15.1 s from 77.05 s) in segments, then muxes the matching slice of the master.
# Usage: ./render-short.sh [AUDIO_WAV]   — delete out/seg-TooHotViralShort/NN.mp4 to force a segment re-render.
set -euo pipefail
AUDIO="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
COMP=TooHotViralShort
FROM=77.05; DUR=15.1
BOUNDS=(0 151 302 453)
mkdir -p "out/seg-$COMP"
export BUNDLE="$PWD/out/bundle-short"
rm -rf "$BUNDLE" && node render.mjs --bundleOnly 1 >/dev/null
: > "out/seg-$COMP/list.txt"
for ((i = 0; i < ${#BOUNDS[@]} - 1; i++)); do
  a=${BOUNDS[$i]}; b=$((${BOUNDS[$((i + 1))]} - 1))
  f="out/seg-$COMP/$(printf %03d $i).mp4"
  if [[ ! -s "$f" ]]; then
    echo "== segment $i frames $a-$b"
    ok=0
    for try in 1 2 3; do
      if node render.mjs --comp "$COMP" --frames "$a-$b" --out "$f.tmp.mp4" --concurrency 2 > "$f.log" 2>&1; then ok=1; break; fi
      echo "   retry $try"
    done
    [[ $ok == 1 ]] || { tail -20 "$f.log"; exit 1; }
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "out/seg-$COMP/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "out/seg-$COMP/list.txt" -c copy "out/$COMP-video.mp4"
OUT_FADE=$(python3 -c "print(round($DUR - 0.35, 3))")
ffmpeg -y -loglevel error -i "out/$COMP-video.mp4" -ss "$FROM" -t "$DUR" -i "$AUDIO" -map 0:v -map 1:a -c:v copy \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=$OUT_FADE:d=0.35" -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "out/$COMP.mp4"
echo "final out/$COMP.mp4"
