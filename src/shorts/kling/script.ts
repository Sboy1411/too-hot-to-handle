import data from './kling.json';
import audio from '../../data/audio.json';
import { CUES, Word } from '../../lib/time';

// Reel 3, the animated chorus: Kling-animated cartoon shots cut on the downbeats of 1:06.27 to 1:32.1, with code-made
// shots, lyrics and the end card on top. All times are master seconds (t = START + frame / 30), like the chat Short.
// kling.json is shared with analysis/kling_reel_audio.py. A shot with "clip": null shows an animatic slate instead.

export const START = data.start;
export const FRAMES = data.frames;
export const END = START + FRAMES / 30;
export const TAIL = data.tail;
export const SCANDAL = data.scandal;

export type Shot = {
  id: string; from: number; to: number; kind: 'kling' | 'glitch' | 'phone' | 'end';
  clip?: string | null; in?: number; title?: string; note?: string; him?: boolean; tint?: string; icon?: string; of?: string;
};
export const SHOTS = data.shots as unknown as Shot[];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
export const shotById = (id: string) => SHOTS.find((s) => s.id === id)!;

/** The downbeats inside the reel (every fourth beat from the hook's first downbeat). */
const BEATS = (audio.beats as number[]).filter((b) => b >= START - 0.01 && b < END);
export const DOWNBEATS = BEATS.filter((_, i) => i % 4 === 0);
export const BEAT_TIMES = BEATS;

export type Line = { words: Word[]; from: number; to: number; big: boolean; en: string };
export const LINES: Line[] = data.lines.map((l, i) => {
  const c = CUES[l.cue - 1];
  const words = 'w' in l && l.w ? c.words.slice(l.w[0], l.w[1] + 1) : c.words;
  const prevTo = i ? data.lines[i - 1].to : START;
  return { words, from: Math.max(prevTo, words[0].t - 0.3), to: l.to, big: !!('big' in l && l.big), en: l.en };
});
export const lineAt = (t: number) => LINES.find((l) => t >= l.from && t < l.to);
