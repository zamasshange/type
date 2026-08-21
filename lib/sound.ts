let ctx: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playClick(correct: boolean) {
  const audio = context();
  if (!audio) return;
  void audio.resume();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = correct ? 760 : 220;
  gain.gain.value = 0.04;
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.05);
}

export function playFinish() {
  const audio = context();
  if (!audio) return;
  void audio.resume();
  [523, 659, 784].forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.25 + i * 0.05);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(audio.currentTime + i * 0.07);
    osc.stop(audio.currentTime + 0.28 + i * 0.07);
  });
}
