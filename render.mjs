// Usage: node render.mjs [--comp TooHot|TooHot4K] [--frames a-b] [--out out/video.mp4] [--still frame]
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));
const compId = args.comp ?? 'TooHot';
const browserExecutable = process.env.CHROME ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable });
const chromiumOptions = { gl: 'swangle' };

if (args.still) {
  for (const f of args.still.split(',')) {
    const out = `${args.outdir ?? 'out/stills'}/f${String(f).padStart(5, '0')}.png`;
    await renderStill({ serveUrl, composition, frame: Number(f), output: out, browserExecutable, chromiumOptions });
    console.log('still', out);
  }
} else {
  const frameRange = args.frames ? args.frames.split('-').map(Number) : null;
  const out = args.out ?? 'out/video.mp4';
  let last = 0;
  await renderMedia({
    serveUrl, composition, codec: 'h264', outputLocation: out, browserExecutable, chromiumOptions,
    frameRange, muted: true, crf: 14, x264Preset: 'slow', pixelFormat: 'yuv420p', colorSpace: 'bt709',
    concurrency: Number(args.concurrency ?? 4),
    onProgress: ({ progress }) => { const p = Math.floor(progress * 100); if (p >= last + 5) { last = p; console.log(`progress ${p}%`); } },
  });
  console.log('done', out);
}
