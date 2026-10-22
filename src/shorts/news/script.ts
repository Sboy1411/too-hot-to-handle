import data from './news.json';
import { CUES, clamp } from '../../lib/time';

// "Breaking news" Short: a midnight TV bulletin chases a heatwave that turns out to be one man, then he hijacks the
// broadcast with the song's opening (0:00 to 0:34). Story times (data.story, data.cc, straps with `at`) are Short
// seconds; song times (data.song, straps with `song`, lyric cues) are master seconds, placed at SONG_AT.
// news.json is shared with analysis/news_short_audio.py.

export const SONG_AT = data.songAt;
export const FRAMES = data.frames;
export const END = FRAMES / 30;
export const ST = data.story;
export const SG = data.song;
export const TAIL = data.tail;
export const CC = data.cc;
export const TICKER = data.ticker;
export const COMMENTS = data.comments;

/** Song (master) time → Short time. */
export const at = (songT: number) => SONG_AT + songT;
/** Short time → song time (negative before the hijack). */
export const songOf = (t: number) => t - SONG_AT;

export type Strap = { at: number; tag: string; text: string };
export const STRAPS: Strap[] = data.straps.map((s) => ({ at: 'at' in s ? (s.at as number) : at(s.song as number), tag: s.tag, text: s.text }));
export const strapAt = (t: number) => {
  let i = -1;
  for (let k = 0; k < STRAPS.length; k++) if (STRAPS[k].at <= t) i = k;
  return i;
};

/** Lyric captions: the cue's words (song time) and its English line. */
export const LYRICS = data.lyrics.map((l) => ({ ...CUES[l.cue - 1], en: l.en }));

/** Piecewise keyframes [t, v][], smoothstepped between keys. */
export const kf = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const p = clamp((t - t0) / (t1 - t0));
      return v0 + (v1 - v0) * p * p * (3 - 2 * p);
    }
  }
  return keys[keys.length - 1][1];
};

/** City temperature on the channel's readout. */
export const tempAt = (t: number) => {
  const s = songOf(t);
  if (s < 0) return kf(t, [[0, 49], [ST.map, 49], [ST.cctv, 50], [ST.close, 51], [ST.wait + 0.3, 54]]);
  return kf(s, [[0, 54], [SG.race[0], 56], [SG.race[1], 99], [SG.map + 1, 99], [SG.blaze, 120], [SG.off, 140]]);
};

/** Which picture is on air. */
export type Scene = 'slam' | 'studio' | 'map' | 'cctv' | 'close' | 'static' | 'hijack' | 'hotmap' | 'forecast' | 'debate' | 'him' | 'off';
export const sceneAt = (t: number): Scene => {
  const s = songOf(t);
  if (s >= SG.off) return 'off';
  if (s >= SG.him) return 'him';
  if (s >= SG.debate) return 'debate';
  if (s >= SG.forecast) return 'forecast';
  if (s >= SG.map) return 'hotmap';
  if (s >= 0) return 'hijack';
  if (t >= ST.static) return 'static';
  if (t >= ST.close) return 'close';
  if (t >= ST.cctv) return 'cctv';
  if (t >= ST.map) return 'map';
  if (t >= ST.studio) return 'studio';
  return 'slam';
};
