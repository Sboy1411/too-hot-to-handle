import { VScene } from './kit';
import { ACT1 } from './act1';
import { ACT2 } from './act2';
import { ACT3 } from './act3';
import { ACT4 } from './act4';
import { ACT5 } from './act5';

/** The viral cut's edit, in song order. */
export const VSCENES: VScene[] = [...ACT1, ...ACT2, ...ACT3, ...ACT4, ...ACT5];
export type { VScene };
