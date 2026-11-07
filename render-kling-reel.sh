#!/usr/bin/env bash
# Renders the animated chorus Reel (TooHotKlingReel, 1080x1920, ~29 s, song 1:06.27 to 1:32.1) in segments, builds its audio
# (the master with "scandal!" echoing out; analysis/kling_reel_audio.py)
# and muxes them.
# Usage: ./render-kling-reel.sh [AUDIO_WAV]   — delete out/seg-TooHotKlingReel/NNN.mp4 to force a segment re-render.
set -euo pipefail
AUDIO="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
COMP=TooHotKlingReel
# The Kling clips (kling1.mp4 …) are not in git (*.mp4 is ignored); they live in the project folder.
CLIPS=/mnt/project-files/too-hot-to-handle/kling-clips
if [[ -d "$CLIPS" ]]; then mkdir -p public/shorts/kling && cp -n "$CLIPS"/kling*.mp4 public/shorts/kling/ 2>/dev/null || true; fi
FRAMES=$(python3 -c "import json; print(json.load(open('src/shorts/kling/kling.json'))['frames'])")
BOUNDS=($(seq 0 300 $((FRAMES - 1))) "$FRAMES")
mkdir -p "out/seg-$COMP"
export BUNDLE="$PWD/out/bundle-kling"
rm -rf "$BUNDLE" && node render.mjs --bundleOnly 1 >/dev/null
: > "out/seg-$COMP/list.txt"
for ((i = 0; i < ${#BOUNDS[@]} - 1; i++)); do
  a=${BOUNDS[$i]}; b=$((${BOUNDS[$((i + 1))]} - 1))
  f="out/seg-$COMP/$(printf %03d $i).mp4"
  if [[ ! -s "$f" ]]; then
    echo "== segment $i frames $a-$b"
    ok=0
    for try in 1 2 3; do
      if node render.mjs --comp "$COMP" --frames "$a-$b" --out "$f.tmp.mp4" --concurrency 3 > "$f.log" 2>&1; then ok=1; break; fi
      echo "   retry $try"
    done
    [[ $ok == 1 ]] || { tail -20 "$f.log"; exit 1; }
    mv "$f.tmp.mp4" "$f"
  fi
  echo "file '$(basename "$f")'" >> "out/seg-$COMP/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "out/seg-$COMP/list.txt" -c copy "out/$COMP-video.mp4"
python3 analysis/kling_reel_audio.py "$AUDIO" "out/$COMP-audio.wav"
ffmpeg -y -loglevel error -i "out/$COMP-video.mp4" -i "out/$COMP-audio.wav" -map 0:v -map 1:a -c:v copy \
  -af "alimiter=limit=0.97:level=false" -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "out/$COMP.mp4"
echo "final out/$COMP.mp4"
