#!/usr/bin/env bash
# Full render of the fusion cut in parallel chunks, then one concat with the viral master's audio.
# Usage: fusion/render-fusion.sh REV2.mp4 VIRAL.mp4 [OUT] [CHUNKS]
#   delete out/fusion/chunks/cNN.mp4 to force that chunk to re-render
set -euo pipefail
A="$1"; B="$2"; OUT="${3:-out/fusion/TooHotFusion.mp4}"; N="${4:-3}"
MASKS=out/fusion/mask
D=out/fusion/chunks
mkdir -p "$D"
FRAMES=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$B")
pids=()
: > "$D/list.txt"
for ((i = 0; i < N; i++)); do
  a=$(( FRAMES * i / N )); b=$(( FRAMES * (i + 1) / N ))
  f=$(printf "$D/c%02d.mp4" $i)
  echo "file '$(basename "$f")'" >> "$D/list.txt"
  if [[ ! -s "$f" ]]; then
    t0=$(python3 -c "print($a/30)"); t1=$(python3 -c "print($b/30)")
    python3 fusion/fuse.py --a "$A" --b "$B" --masks "$MASKS" --out "$f.tmp.mp4" --from "$t0" --to "$t1" \
      --crf 13 --preset faster --video-only > "$f.log" 2>&1 && mv "$f.tmp.mp4" "$f" &
    pids+=($!)
  fi
done
for p in "${pids[@]}"; do wait "$p"; done
for ((i = 0; i < N; i++)); do [[ -s $(printf "$D/c%02d.mp4" $i) ]] || { echo "chunk $i failed"; tail -5 $(printf "$D/c%02d.mp4.log" $i); exit 1; }; done
ffmpeg -y -v error -f concat -safe 0 -i "$D/list.txt" -i "$B" -map 0:v -map 1:a -c copy -movflags +faststart "$OUT"
echo "final $OUT"
