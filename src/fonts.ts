import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Remotion's loadFont() wraps each face in its own delayRender, so frames never capture fallback fonts.
const faces: [string, string, string, string][] = [
  ['Anton', 'anton-latin-400-normal.woff2', '400', 'normal'],
  ['Playfair Display', 'playfair-display-latin-400-italic.woff2', '400', 'italic'],
  ['Playfair Display', 'playfair-display-latin-700-italic.woff2', '700', 'italic'],
  ['Playfair Display', 'playfair-display-latin-900-italic.woff2', '900', 'italic'],
  ['Space Mono', 'space-mono-latin-400-normal.woff2', '400', 'normal'],
  ['Space Mono', 'space-mono-latin-700-normal.woff2', '700', 'normal'],
  ['Inter', 'inter-latin-400-normal.woff2', '400', 'normal'],
  ['Inter', 'inter-latin-600-normal.woff2', '600', 'normal'],
];
for (const [family, file, weight, style] of faces) {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style });
}
