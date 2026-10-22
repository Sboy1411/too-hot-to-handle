import data from './chat.json';
import { CUES, clamp } from '../../lib/time';

// "The group chat" Short: friends complain the party is dead and want to leave, then a man walks in and the chat
// loses it; he joins and texts the hook, the phone overheats and melts on the bass, reboots scorched, and dies on
// "Heart went pop".
// All times are song seconds; the Short starts at START. chat.json is shared with analysis/chat_short_audio.py.

export const START = data.start;
export const FRAMES = data.frames;
export const M = data.moments;
export const KICKS = data.kicks;
export const TYPED = data.typed;
export const CAPTION = data.caption;
/** The ending: the master stops after "scandal!" and the word echoes out (analysis/chat_short_audio.py). */
export const TAIL = data.audio.tail;
export const END = START + FRAMES / 30;

export type Who = 'simran' | 'riya' | 'kabir' | 'aman' | 'you' | 'him';
export const PEOPLE: Record<Who, { name: string; color: string }> = {
  simran: { name: 'Simran', color: '#FF6FAE' },
  riya: { name: 'Riya', color: '#FFC24A' },
  kabir: { name: 'Kabir', color: '#7FB2FF' },
  aman: { name: 'Aman', color: '#5EE6A8' },
  you: { name: 'You', color: '#FFFFFF' },
  him: { name: 'That Man 🔥', color: '#FF8A3D' },
};

export type Msg = {
  id: string; at: number; kind: 'text' | 'photo' | 'system' | 'typing' | 'lyric' | 'song';
  from?: Who; text?: string; big?: boolean; until?: number; cue?: number; w?: number[]; tr?: string;
};
export const MSGS = data.messages as Msg[];
export const REACTIONS = data.reactions;

export const lyricWords = (m: Msg) => CUES[m.cue! - 1].words.slice(m.w![0], m.w![1] + 1);

/** Piecewise-linear keyframes [t, v][], smoothstepped between keys. */
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

/** Phone temperature in °C: AC-cool while the party is dead, climbs once he walks in, peaks under the alert, stays scorched after the reboot. */
export const tempAt = (t: number) =>
  t >= M.reboot
    ? 71 + Math.max(0, t - 88.6) * 9
    : kf(t, [[M.turn, 23], [M.turn + 0.6, 26], [50.6, 27], [54.85, 28], [57, 31], [59.1, 33], [62.05, 35], [66.4, 37], [70, 41], [74, 47], [77, 55], [79.1, 64], [80.7, 72]]);

/** 0..1 how hot the screen looks (grade, haze, glow). */
export const heatAt = (t: number) => (t >= M.reboot ? 0.42 : kf(t, [[71.5, 0], [75.5, 0.3], [79.08, 0.72], [80.76, 1]]));
