/**
 * Browser micro-feedback: haptic tick, the "cạch" of two balls, confetti. Each one is a best effort and
 * silently does nothing where the platform lacks it (iOS has no vibrate, audio may be blocked).
 */

export function haptic(pattern: number | number[] = 18): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

let audio: AudioContext | null = null;

/** Two ivory balls clacking: a short filtered noise burst plus a high click, synthesised (no asset). */
export function clack(volume = 0.5): void {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  audio ??= new Ctor();
  const ctx = audio;
  const now = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length / 7));
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2400;
  band.Q.value = 1.4;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  noise.connect(band).connect(gain).connect(ctx.destination);
  const tone = ctx.createOscillator();
  tone.frequency.setValueAtTime(3200, now);
  tone.frequency.exponentialRampToValueAtTime(1800, now + 0.04);
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(volume * 0.25, now);
  toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  tone.connect(toneGain).connect(ctx.destination);
  noise.start(now);
  tone.start(now);
  tone.stop(now + 0.06);
}

/** Ball colours as confetti; loaded on demand so viewers who never celebrate never download it. */
export async function celebrate(
  colors: string[] = ["#F5C451", "#D7263D", "#2F7DE1", "#1F6B4A", "#F3EEDC"],
): Promise<void> {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: 110,
    spread: 75,
    startVelocity: 42,
    origin: { y: 0.65 },
    colors,
    disableForReducedMotion: true,
  });
}
