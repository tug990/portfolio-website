/*
  The gallery's sound, made live with the Web Audio API (nothing to download).

  - Room tone: the low hush of a quiet, air-conditioned gallery.
  - Each film has a voice in the room, coming from its screen: its trailer's
    own sound when it has one, otherwise a soft cinematic score (a slow,
    breathing chord, different for each film). From the middle of the room
    you hear all six faintly; walk up to one and it comes forward, panned as
    you turn.
  - Everything rings in a long soft reverb, as it would off marble and plaster.
  - Two quiet heel steps on the marble each time you move between stops.
  - A rising, airy swell as you pass through the light into the room.

  Browsers only allow sound after a click, tap or key press, so it starts on
  one; and it pauses while the tab is hidden.
*/

export type Listener = { x: number; y: number; z: number; yaw: number };
export type FilmSpot = { x: number; y: number; z: number };

// One chord per film: root and voicing (frequency ratios), all slow and warm.
const CHORDS: [number, number[]][] = [
  [110.0, [1, 1.5, 2.378, 3]], // A minor add9
  [87.31, [1, 1.5, 2.52, 3.36]], // F major 7
  [130.81, [1, 1.498, 2.244, 2.996]], // C sus2
  [146.83, [1, 1.189, 1.5, 2.244]], // D minor 9
  [82.41, [1, 1.5, 2.0, 2.828]], // E open, a touch of tension
  [98.0, [1, 1.26, 1.5, 2.52]], // G major 7
];

const PREF_KEY = "insight-sound";

export function soundPreferred() {
  try {
    return localStorage.getItem(PREF_KEY) === "on";
  } catch {
    return false;
  }
}
export function rememberSound(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* private mode: it just won't be remembered */
  }
}

type Voice = { panner: PannerNode; gain: GainNode; stop: () => void; video?: HTMLVideoElement };

export class GallerySound {
  private ctx: AudioContext;
  private master: GainNode;
  private room: GainNode; // everything that belongs to being in the room
  private toneGain: GainNode;
  private reverbSend: GainNode;
  private voices: Voice[] = [];
  private on = false;
  private presence = 0;
  private hiddenHandler = () => {
    if (document.hidden) void this.ctx.suspend();
    else if (this.on) void this.ctx.resume();
  };

  constructor(videos: (HTMLVideoElement | undefined)[]) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC({ latencyHint: "playback" });
    this.ctx = ctx;

    // Master, with a gentle limiter so nothing ever spikes
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 12;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.4;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(limiter).connect(ctx.destination);

    this.room = ctx.createGain();
    this.room.gain.value = 0;
    this.room.connect(this.master);

    // Reverb: a long soft tail, generated
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(2.6);
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.55;
    this.reverbSend = ctx.createGain();
    this.reverbSend.connect(verb).connect(verbOut).connect(this.room);

    // Room tone: brown noise, low-passed, barely there
    const tone = ctx.createBufferSource();
    tone.buffer = this.brownNoise(6);
    tone.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    this.toneGain = ctx.createGain();
    this.toneGain.gain.value = 0.11;
    tone.connect(lp).connect(this.toneGain).connect(this.room);
    tone.start();

    // The films
    videos.forEach((video, i) => this.voices.push(this.filmVoice(i, video)));

    document.addEventListener("visibilitychange", this.hiddenHandler);
  }

  /* ---------- the films' voices ---------- */

  private filmVoice(i: number, video?: HTMLVideoElement): Voice {
    const ctx = this.ctx;
    const panner = new PannerNode(ctx, {
      panningModel: "HRTF",
      distanceModel: "inverse",
      refDistance: 1.4,
      rolloffFactor: 1.6,
      maxDistance: 40,
    });
    const gain = ctx.createGain();
    gain.gain.value = 1;
    panner.connect(gain);
    gain.connect(this.room);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    gain.connect(send).connect(this.reverbSend);

    if (video) {
      // The trailer's own sound
      const src = ctx.createMediaElementSource(video);
      src.connect(panner);
      return { panner, gain, video, stop: () => src.disconnect() };
    }

    // A soft score: a slow chord through a breathing filter
    const [root, ratios] = CHORDS[i % CHORDS.length];
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.4;
    const swell = ctx.createGain();
    swell.gain.value = 0.05;
    filter.connect(swell).connect(panner);
    const oscs: OscillatorNode[] = [];
    ratios.forEach((r, k) => {
      const o = ctx.createOscillator();
      o.type = k === 0 ? "sine" : "triangle";
      o.frequency.value = root * r;
      o.detune.value = (k % 2 ? 1 : -1) * (3 + k * 2); // a little chorus
      const g = ctx.createGain();
      g.gain.value = k === 0 ? 0.9 : 0.42 / k;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    });
    // Slow breath on the filter and level, each film at its own pace
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.013;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 380;
    lfo.connect(lfoDepth).connect(filter.frequency);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.07 + i * 0.011;
    const lfo2Depth = ctx.createGain();
    lfo2Depth.gain.value = 0.022;
    lfo2.connect(lfo2Depth).connect(swell.gain);
    lfo.start();
    lfo2.start();
    return {
      panner,
      gain,
      stop: () => [...oscs, lfo, lfo2].forEach((o) => o.stop()),
    };
  }

  /* ---------- turning it on and off ---------- */

  get enabled() {
    return this.on;
  }

  async setEnabled(on: boolean) {
    this.on = on;
    const t = this.ctx.currentTime;
    this.voices.forEach((v) => {
      if (v.video) v.video.muted = !on;
    });
    if (on) {
      await this.ctx.resume().catch(() => {});
      this.ramp(this.master.gain, 1, 0.8);
    } else {
      this.ramp(this.master.gain, 0, 0.4);
      window.setTimeout(() => {
        if (!this.on) void this.ctx.suspend();
      }, 500);
    }
    return t;
  }

  /* ---------- every frame ---------- */

  /*
    presence: 0 on the logo, 1 in the room. films: where each screen is.
  */
  update(listener: Listener, presence: number, films: FilmSpot[]) {
    if (!this.on) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const L = ctx.listener;
    const fx = -Math.sin(listener.yaw);
    const fz = -Math.cos(listener.yaw);
    if (L.positionX) {
      L.positionX.setTargetAtTime(listener.x, t, 0.05);
      L.positionY.setTargetAtTime(listener.y, t, 0.05);
      L.positionZ.setTargetAtTime(listener.z, t, 0.05);
      L.forwardX.setTargetAtTime(fx, t, 0.05);
      L.forwardY.setTargetAtTime(0, t, 0.05);
      L.forwardZ.setTargetAtTime(fz, t, 0.05);
      L.upX.value = 0;
      L.upY.value = 1;
      L.upZ.value = 0;
    } else {
      // Older Safari
      L.setPosition(listener.x, listener.y, listener.z);
      L.setOrientation(fx, 0, fz, 0, 1, 0);
    }
    films.forEach((f, i) => {
      const p = this.voices[i]?.panner;
      if (!p) return;
      p.positionX.value = f.x;
      p.positionY.value = f.y;
      p.positionZ.value = f.z;
    });
    if (Math.abs(presence - this.presence) > 0.01) {
      this.presence = presence;
      this.room.gain.setTargetAtTime(presence, t, 0.15);
    }
  }

  /* ---------- moments ---------- */

  /* Two quiet heel steps on marble. */
  steps() {
    if (!this.on || this.presence < 0.5) return;
    const t = this.ctx.currentTime;
    this.heel(t + 0.02, 0.9);
    this.heel(t + 0.27, 0.75);
  }

  /* The rise through the light into the room. */
  swell() {
    if (!this.on) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 1.1;
    // Air rushing past, its pitch rising
    const noise = ctx.createBufferSource();
    noise.buffer = this.whiteNoise(dur + 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(5200, t + dur * 0.7);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.55);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    noise.connect(bp).connect(ng);
    ng.connect(this.master);
    ng.connect(this.reverbSend);
    noise.start(t);
    noise.stop(t + dur + 0.2);
    // A bright chord blooming as you arrive
    [440, 659.3, 987.8, 1318.5].forEach((f, k) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.05 / (k + 1), t + 0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g);
      g.connect(this.reverbSend);
      g.connect(this.master);
      o.start(t + 0.35);
      o.stop(t + 3.3);
    });
  }

  /* Fade out as a page takes over (walking into a film or through a door). */
  fadeOut(seconds: number) {
    this.ramp(this.master.gain, 0, seconds);
  }
  fadeIn() {
    if (this.on) this.ramp(this.master.gain, 1, 0.6);
  }

  dispose() {
    document.removeEventListener("visibilitychange", this.hiddenHandler);
    this.voices.forEach((v) => {
      try {
        v.stop();
      } catch {
        /* already stopped */
      }
    });
    void this.ctx.close().catch(() => {});
  }

  /* ---------- building blocks ---------- */

  private ramp(p: AudioParam, to: number, seconds: number) {
    const t = this.ctx.currentTime;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.linearRampToValueAtTime(to, t + seconds);
  }

  private heel(t: number, level: number) {
    const ctx = this.ctx;
    // The click of a heel on stone...
    const click = ctx.createBufferSource();
    click.buffer = this.whiteNoise(0.06);
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.frequency.value = 2400 + Math.random() * 500;
    hp.Q.value = 1.4;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.0001, t);
    cg.gain.exponentialRampToValueAtTime(0.09 * level, t + 0.004);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    click.connect(hp).connect(cg);
    // ...and the soft thud under it
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(140, t);
    thud.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.07 * level, t + 0.006);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    thud.connect(tg);
    for (const g of [cg, tg]) {
      g.connect(this.room);
      g.connect(this.reverbSend);
    }
    click.start(t);
    click.stop(t + 0.07);
    thud.start(t);
    thud.stop(t + 0.12);
  }

  private impulse(seconds: number) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const k = i / len;
        // Dense noise decaying smoothly; a short gap before it, as in a large room
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3.2) * (i < 600 ? i / 600 : 1);
      }
    }
    return buf;
  }

  private brownNoise(seconds: number) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const fade = Math.floor(ctx.sampleRate * 0.25);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      // Make a little extra, then fold the extra over the start, so the end
      // of the loop runs straight on into its beginning with no click.
      const raw = new Float32Array(len + fade);
      let last = 0;
      for (let i = 0; i < raw.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        raw[i] = last * 3.5;
      }
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        if (i < fade) {
          const a = i / fade;
          d[i] = raw[i] * a + raw[len + i] * (1 - a);
        } else d[i] = raw[i];
      }
    }
    return buf;
  }

  private whiteNoise(seconds: number) {
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
}
