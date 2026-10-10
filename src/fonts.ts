import '@fontsource/anton/400.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/playfair-display/900-italic.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import { continueRender, delayRender } from 'remotion';

const handle = delayRender('fonts', { timeoutInMilliseconds: 90000 });
const timeout = new Promise((r) => setTimeout(r, 15000));
Promise.all([
  '64px Anton', 'italic 400 64px "Playfair Display"', 'italic 700 64px "Playfair Display"',
  'italic 900 64px "Playfair Display"', '400 64px "Space Mono"', '700 64px "Space Mono"',
  '400 64px Inter', '600 64px Inter',
].map((f) => Promise.race([document.fonts.load(f), timeout])))
  .then(() => Promise.race([document.fonts.ready, timeout]))
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
