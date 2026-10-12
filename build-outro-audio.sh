#!/usr/bin/env bash
# Viral cut audio: song master, then silence (pause + silent PSH screen), then the BOLO BEATS logo
# sound = first 4 s of Bolo_Beats.wav. Times must match src/viral/outro.tsx.
set -euo pipefail
MASTER="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
STING="${2:-/mnt/project-files/too-hot-to-handle/inputs/Bolo_Beats.wav}"
OUT="${3:-out/viral-full-audio.wav}"
LOGO_FROM=147.8; END=151.8
ms() { python3 -c "print(int(round($1*1000)))"; }
ffmpeg -v error -y -i "$MASTER" -i "$STING" -filter_complex "\
[0:a]aresample=48000,apad[a0];\
[1:a]atrim=0:4.0,asetpts=PTS-STARTPTS,afade=t=out:st=3.7:d=0.3,adelay=$(ms $LOGO_FROM)|$(ms $LOGO_FROM)[a1];\
[a0][a1]amix=inputs=2:normalize=0:duration=first" -t $END -c:a pcm_s24le "$OUT"
