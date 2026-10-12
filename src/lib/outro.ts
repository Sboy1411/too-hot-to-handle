// Post-song tail: short black pause, the "PSH" card, then the BOLO BEATS logo
// sting (first 5.6 s of Bolo_Beats.wav). Audio is assembled in build-outro-audio.sh.
export const OUTRO_START = 143.4; // end card has faded to black by here
export const PSH_FROM = 144.4;
export const PSH_HIT = 144.6; // impact from Bolo_Beats.wav (9.2 s) lands here
export const PSH_TO = 148.3;
export const LOGO_FROM = 148.6; // Bolo_Beats.wav t=0
export const LOGO_HIT1 = LOGO_FROM + 0.3; // soft hit: BOLO appears
export const LOGO_HIT2 = LOGO_FROM + 2.93; // second hit: BEATS opens out
export const LOGO_STING = 5.6;
export const END = LOGO_FROM + LOGO_STING;
