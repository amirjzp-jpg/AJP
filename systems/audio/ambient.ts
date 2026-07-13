/**
 * Synthesized ambient city hum — no audio assets, just WebAudio:
 * filtered brown noise (distant traffic wash) + a faint detuned drone.
 * Intensity follows the day cycle. Default off; toggled from the HUD.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;

export function startAmbient(): boolean {
  try {
    if (ctx) {
      void ctx.resume();
      return true;
    }
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Brown noise wash
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.5;
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start();

    // Quiet detuned drone — the "finished machine" undertone
    [55, 55.6, 110.3].forEach((f, i) => {
      const osc = ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx!.createGain();
      g.gain.value = i === 2 ? 0.012 : 0.02;
      osc.connect(g).connect(master!);
      osc.start();
    });

    master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
    return true;
  } catch {
    return false;
  }
}

export function setAmbientMood(night: number, density: number) {
  if (!ctx || !filter || !master) return;
  // Day: brighter, busier. Night: darker, calmer, more drone.
  filter.frequency.setTargetAtTime(260 + (1 - night) * 420 + density * 160, ctx.currentTime, 0.5);
}

export function stopAmbient() {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  const c = ctx;
  setTimeout(() => void c.suspend(), 800);
}
