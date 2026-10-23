#!/usr/bin/env bash
# GARMI 24×7 news-bulletin Short (GarmiNews, 1080×1920, 30 fps, 65.37 s).
# Renders the picture in short segments (skips segments that exist), builds the soundtrack, and muxes:
#   out/garmi/TooHotToHandle_GARMI_Short.mp4        song untouched (mix ≈ -16.5 LUFS, peaks -1.2 dBTP)
#   out/garmi/TooHotToHandle_GARMI_Short_-14LUFS.mp4 same picture, mix raised to ≈ -14 LUFS through a true-peak limiter
# Usage: ./render-garmi.sh SONG_MASTER    — delete out/garmi/seg/NN.mp4 to force a segment re-render.
set -euo pipefail
SONG="${1:?song master (wav/mp3)}"
COMP=GarmiNews
FRAMES=1961
OUT=out/garmi
mkdir -p "$OUT/seg"
python3 analysis/garmi_audio.py "$SONG" "$OUT/audio"
export BUNDLE="$PWD/out/bundle-garmi"
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
for v in "" "-loud"; do
  name=TooHotToHandle_GARMI_Short; [[ -n "$v" ]] && name="${name}_-14LUFS"
  ffmpeg -y -loglevel error -i "$OUT/video-only.mp4" -i "$OUT/audio/garmi-mix$v.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 \
    -profile:v high -pix_fmt yuv420p -r 30 -c:a aac -b:a 320k -ar 48000 -t 65.37 -movflags +faststart "$OUT/$name.mp4"
  echo "final $OUT/$name.mp4"
done
