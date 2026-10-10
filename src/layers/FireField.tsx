import React, { useEffect, useRef } from 'react';
import { AbsoluteFill } from 'remotion';
import { lookAt } from '../lib/sections';
import { bandS } from '../lib/time';

const W = 192, H = 108;
// value noise
const perm = new Uint8Array(512);
{
  let s = 1337;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const grad = (h: number) => (h / 255) * 2 - 1;
const fade = (t: number) => t * t * (3 - 2 * t);
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const a = grad(perm[perm[X] + Y]), b = grad(perm[perm[X + 1] + Y]);
  const c = grad(perm[perm[X] + Y + 1]), d = grad(perm[perm[X + 1] + Y + 1]);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// fire palette
const PAL: number[][] = [];
for (let i = 0; i < 256; i++) {
  const v = i / 255;
  const r = Math.min(255, v * 3 * 255);
  const g = Math.min(255, Math.max(0, (v - 0.33) * 2.2 * 255));
  const b = Math.min(255, Math.max(0, (v - 0.75) * 4 * 200));
  PAL.push([r, g * 0.85, b * 0.7]);
}

/** Stateless procedural flames along the bottom of frame (pure function of t). */
export const FireField: React.FC<{ t: number; amount?: number }> = ({ t, amount }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const L = lookAt(t);
  const amt = amount ?? L.fire;
  const low = bandS('low', t, 2);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const reach = (0.12 + 0.17 * Math.min(1.2, amt)) * (0.8 + 0.45 * low);
    for (let y = 0; y < H; y++) {
      const fy = 1 - y / H; // 0 at bottom
      for (let x = 0; x < W; x++) {
        const nx = x / 22, ny = y / 18 + t * 2.4;
        let n = vnoise(nx, ny) * 0.55 + vnoise(nx * 2.1, ny * 2.1 - t) * 0.3 + vnoise(nx * 4.3, ny * 4.3) * 0.15;
        n = n * 0.5 + 0.5;
        let v = n - fy / reach + 0.35;
        v = Math.max(0, Math.min(0.64, v * 1.3));
        const c = PAL[Math.floor(v * 255)];
        const o = (y * W + x) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [t, amt, low]);
  if (amt <= 0.01) return null;
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: Math.min(0.8, amt * 0.9), maskImage: 'linear-gradient(0deg, #000 0%, #000 20%, transparent 55%)' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: '100%', filter: 'blur(14px)' }} />
    </AbsoluteFill>
  );
};
