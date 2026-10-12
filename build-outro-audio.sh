#!/usr/bin/env bash
# Song master + black pause + PSH impact (Bolo_Beats.wav @9.2s) + BOLO BEATS sting (first 5.6 s).
# Times must match src/lib/outro.ts.
set -euo pipefail
MASTER="${1:-/mnt/project-files/FINAL_PRODUCTION_MASTER.wav}"
STING="${2:-/mnt/project-files/too-hot-to-handle/inputs/Bolo_Beats.wav}"
OUT="${3:-out/full-audio.wav}"
PSH_HIT=144.6; LOGO_FROM=148.6; END=154.2
ms() { python3 -c "print(int(round($1*1000)))"; }
ffmpeg -v error -y -i "$MASTER" -i "$STING" -filter_complex "\
[0:a]aresample=48000,apad[a0];\
[1:a]atrim=9.2:12.6,asetpts=PTS-STARTPTS,afade=t=out:st=2.6:d=0.8,adelay=$(ms $PSH_HIT)|$(ms $PSH_HIT)[a1];\
[1:a]atrim=0:5.6,asetpts=PTS-STARTPTS,afade=t=out:st=5.0:d=0.6,adelay=$(ms $LOGO_FROM)|$(ms $LOGO_FROM)[a2];\
[a0][a1][a2]amix=inputs=3:normalize=0:duration=first" -t $END -c:a pcm_s24le "$OUT"
