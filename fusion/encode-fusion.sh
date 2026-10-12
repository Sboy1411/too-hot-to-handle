#!/usr/bin/env bash
# Delivery encodes of the fusion master (out/fusion/TooHotFusion.mp4) into out/deliver/, as for the viral cut:
#   1440p upload file (2-pass, under the Claude Android app's ~210 MB download limit), 720p share file,
#   studio master under 512 MiB.
set -euo pipefail
IN=out/fusion/TooHotFusion.mp4
OUT=out/deliver
mkdir -p "$OUT"
PASS=$(mktemp -d)/x264
V="-vf scale=2560:1440:flags=lanczos -c:v libx264 -preset slow -b:v 9800k -maxrate 15000k -bufsize 20000k -profile:v high -level 5.1 -pix_fmt yuv420p"
ffmpeg -y -v error -i "$IN" -map 0:v $V -pass 1 -passlogfile "$PASS" -an -f mp4 /dev/null
ffmpeg -y -v error -i "$IN" -map 0:v -map 0:a $V -pass 2 -passlogfile "$PASS" -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT/Too_Hot_To_Handle_FUSION_1440p_youtube.mp4"
ffmpeg -y -v error -i "$IN" -map 0:v -map 0:a -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 23 -maxrate 2400k -bufsize 4800k -profile:v high -level 4.0 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$OUT/Too_Hot_To_Handle_FUSION_720p_share.mp4"
ffmpeg -y -v error -i "$IN" -map 0:v -map 0:a -c:v libx264 -preset slow -crf 15 -profile:v high -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT/Too_Hot_To_Handle_FUSION_1080p.mp4"
ls -la "$OUT"/Too_Hot_To_Handle_FUSION_*.mp4
