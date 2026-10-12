// Post-song tail: short black pause, the "PSH" card, then the BOLO BEATS logo.
// The BOLO BEATS logo segment is exactly 4 s (Albert's rule); PSH is separate.
// Audio is assembled in build-outro-audio.sh; keep the times in sync.
export const OUTRO_START = 143.4; // end card has faded to black by here
export const PSH_FROM = 144.4;
export const PSH_HIT = 144.6; // impact from Bolo_Beats.wav (9.2 s) lands here
export const PSH_TO = 148.3;
export const LOGO_FROM = 148.6;
export const LOGO_WAV_OFFSET = 0.2; // logo uses Bolo_Beats.wav 0.2..4.2 s (skips lead-in silence)
export const LOGO_STING = 4.0;
export const LOGO_HIT1 = 0.3 - LOGO_WAV_OFFSET; // soft hit: BOLO appears (relative to LOGO_FROM)
export const LOGO_HIT2 = 2.93 - LOGO_WAV_OFFSET; // second hit: BEATS opens out
export const END = LOGO_FROM + LOGO_STING;
