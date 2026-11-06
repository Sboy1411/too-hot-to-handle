#!/usr/bin/env bash
# Renders the group-chat Short (TooHotChatShort, 1080x1920, ~61 s from 34.3 s) in segments, builds its audio
# (master muffled until the hook, message sounds, echo-out ending; analysis/chat_short_audio.py) and muxes them.
# Usage: ./render-chat-short.sh [AUDIO_WAV]   — delete out/seg-TooHotChatShort/NNN.mp4 to force a segment re-render.
set -euo pipefail
AUDIO="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
COMP=TooHotChatShort
FRAMES=$(python3 -c "import json; print(json.load(open('src/shorts/chat/chat.json'))['frames'])")
BOUNDS=($(seq 0 300 $((FRAMES - 1))) "$FRAMES")
mkdir -p "out/seg-$COMP"
export BUNDLE="$PWD/out/bundle-chat"
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
python3 analysis/chat_short_audio.py "$AUDIO" "out/$COMP-audio.wav"
ffmpeg -y -loglevel error -i "out/$COMP-video.mp4" -i "out/$COMP-audio.wav" -map 0:v -map 1:a -c:v copy \
  -af "volume=1.5dB,alimiter=limit=0.97:level=false" -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "out/$COMP.mp4"
echo "final out/$COMP.mp4"
