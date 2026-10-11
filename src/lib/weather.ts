import { clamp, easeInOutCubic, lerp } from './time';
import { lookAt } from './sections';

/** The "weather better" widget and the HUD gauge share one temperature curve. */
export const WEATHER_START = 12.9;
export const WEATHER_FROM = -6;
export const WEATHER_TO = 28;
export const weatherProgress = (t: number) => easeInOutCubic(clamp((t - WEATHER_START - 0.4) / 2.0));
export const weatherTemp = (t: number, from = WEATHER_FROM, to = WEATHER_TO) => Math.round(lerp(from, to, weatherProgress(t)));
/** Room temperature at any time: the widget's curve through verse 1, then the per-section heat. */
export const roomTemp = (t: number) => (t < 16.5 ? weatherTemp(t) : Math.round(lookAt(t, 3.5).temp));
export const fmtTemp = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);
