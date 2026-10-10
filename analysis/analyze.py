"""Analyze the master: tempo, beat grid, downbeats, onsets, energy & spectral bands per video frame."""
import json, sys
import numpy as np, librosa

src = sys.argv[1]; out = sys.argv[2]; FPS = 30
y, sr = librosa.load(src, sr=22050, mono=True)
dur = len(y) / sr
hop = 512
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop, units='time')
tempo = float(np.atleast_1d(tempo)[0])
onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop, units='time')

# percussive part for kick/snare-ish band energies
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
def band(lo, hi):
    m = (freqs >= lo) & (freqs < hi)
    e = S[m].mean(axis=0)
    return e / (np.percentile(e, 99) + 1e-9)
low, mid, high = band(20, 150), band(150, 2000), band(2000, 10000)
rms = librosa.feature.rms(S=S)[0]; rms = rms / (np.percentile(rms, 99) + 1e-9)
t = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=hop)
nF = int(np.ceil(dur * FPS))
ft = np.arange(nF) / FPS
def resamp(v): return np.clip(np.interp(ft, t, v), 0, 1.5).round(3).tolist()
# smoothed energy for section detection (2s window)
env = np.convolve(rms, np.ones(86) / 86, mode='same')
data = dict(duration=dur, fps=FPS, tempo=tempo, beats=[round(float(b), 3) for b in beats],
            onsets=[round(float(o), 3) for o in onsets],
            rms=resamp(rms), low=resamp(low), mid=resamp(mid), high=resamp(high), energy=resamp(env / env.max()))
json.dump(data, open(out, 'w'))
print('dur', dur, 'tempo', tempo, 'beats', len(beats), 'onsets', len(onsets))
print('beat intervals median', np.median(np.diff(beats)))
print('first beats', [round(b, 2) for b in beats[:12]])
for s in range(0, int(dur), 4):
    i = int(s * FPS); print(s, 'energy %.2f low %.2f' % (data['energy'][i], np.mean(data['low'][i:i+120])))
