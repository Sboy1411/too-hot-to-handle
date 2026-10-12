import { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

// Every face the viral cut uses. Layout measures text on a canvas, so nothing renders until all faces are live.
const FACES: { family: string; file: string; weight: string; style?: string; stretch?: string }[] = [
  { family: 'Climate Crisis', file: 'ClimateCrisis-YEAR.woff2', weight: '400' },
  { family: 'Unbounded', file: 'Unbounded-wght.woff2', weight: '200 900' },
  { family: 'JetBrains Mono', file: 'JetBrainsMono-wght.woff2', weight: '100 800' },
  { family: 'Archivo', file: 'Archivo-wdth-wght.woff2', weight: '100 900', stretch: '62% 125%' },
  { family: 'Anton', file: 'anton-latin-400-normal.woff2', weight: '400' },
  { family: 'Playfair Display', file: 'playfair-display-latin-400-italic.woff2', weight: '400', style: 'italic' },
  { family: 'Playfair Display', file: 'playfair-display-latin-700-italic.woff2', weight: '700', style: 'italic' },
  { family: 'Playfair Display', file: 'playfair-display-latin-900-italic.woff2', weight: '900', style: 'italic' },
];

let ready: Promise<void> | null = null;
const loadAll = () => {
  if (!ready) {
    ready = Promise.all(
      FACES.map(async (f) => {
        const face = new FontFace(f.family, `url('${staticFile(`fonts/${f.file}`)}') format('woff2')`, { weight: f.weight, style: f.style ?? 'normal', stretch: f.stretch ?? 'normal' });
        await face.load();
        (document.fonts as any).add(face);
      }),
    ).then(() => undefined);
  }
  return ready;
};

/** True once every face is loaded; holds the frame (delayRender) until then. */
export const useFontsReady = () => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('viral fonts'));
  useEffect(() => {
    loadAll().then(() => { setOk(true); continueRender(handle); });
  }, [handle]);
  return ok;
};

export const VF = {
  melt: '"Climate Crisis", Anton, sans-serif',
  wide: 'Unbounded, Anton, sans-serif',
  hud: '"JetBrains Mono", monospace',
  grot: 'Archivo, sans-serif',
  cond: 'Anton, Impact, sans-serif',
  serif: '"Playfair Display", Georgia, serif',
};
