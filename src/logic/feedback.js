// Sound, vibration and sharing helpers.
let audio;

export function beep(enabled, freq, ms) {
  if (!enabled) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq || 660; g.gain.value = 0.08;
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + (ms || 70) / 1000);
  } catch (e) {}
}

export function buzz(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

export function share(text) {
  if (navigator.share) navigator.share({ text: text }).catch(() => {});
  else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
}
