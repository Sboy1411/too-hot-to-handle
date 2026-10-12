#!/usr/bin/env bash
# Renders the mirror-glass masks for the fusion cut's lens (TooHotMirrorMask: each mirror's glass as a white
# ellipse, with the scene's own fades and camera moves), only for the frame ranges where revision 2 has a mirror.
set -euo pipefail
D=out/fusion/mask
mkdir -p "$D"
export BUNDLE="$PWD/out/bundle-fusion"
rm -rf "$BUNDLE" && node render.mjs --bundleOnly 1 > "$D/bundle.log"
for r in 86-230 1022-1200 2938-3008 3890-4130; do
  node render.mjs --comp TooHotMirrorMask --frames "$r" --out "$D/m_$r.mp4" > "$D/m_$r.log" 2>&1
done
echo masks-done
