/** Original synthesized sound design: car engine, city ambience, horn, footsteps and melody. */
export class CityAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.engine = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.hum = null;
    this.humGain = null;
    this.timer = null;
    this.beat = 0;
    this.nextNote = 0;
    this.noise = null;
  }
  async unlock() {
    if (!this.ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.ctx = new Audio();
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.39;
      this.master.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.hum = ctx.createOscillator();
      this.hum.type = 'sine';
      this.hum.frequency.value = 55;
      this.humGain = ctx.createGain();
      this.humGain.gain.value = 0.008;
      this.hum.connect(this.humGain);
      this.humGain.connect(this.master);
      this.hum.start();
      this.engine = ctx.createOscillator();
      this.engine.type = 'sawtooth';
      this.engine.frequency.value = 56;
      this.engineFilter = ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 170;
      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = .00001;
      this.engine.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engine.start();
    }
    await this.ctx.resume();
    if (!this.timer) this.startMusic();
  }
  toggle() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? .0001 : .39, this.ctx.currentTime, .03);
    }
    return !this.muted;
  }
  tone(frequency, duration = .15, gain = .12, type = 'sine', endFreq = null, at = null) {
    if (!this.ctx) return;
    const t = at == null ? this.ctx.currentTime : at;
    const osc = this.ctx.createOscillator();
    const vol = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), t + duration);
    vol.gain.setValueAtTime(.0001, t);
    vol.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .012);
    vol.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(vol);
    vol.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + .03);
    osc.onended = () => { osc.disconnect(); vol.disconnect(); };
  }
  hiss(duration = .11, volume = .07, highpass = 900) {
    if (!this.ctx || !this.noise) return;
    const at = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const vol = this.ctx.createGain();
    vol.gain.setValueAtTime(volume, at);
    vol.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter);
    filter.connect(vol);
    vol.connect(this.master);
    source.start(at);
    source.stop(at + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); vol.disconnect(); };
  }
  setEngine(speed, driving, boost) {
    if (!this.engine || !this.ctx) return;
    const n = Math.abs(speed);
    const t = this.ctx.currentTime;
    const pitch = 47 + Math.min(220, n * 4.8) + (boost ? 55 : 0);
    this.engine.frequency.setTargetAtTime(pitch, t, .08);
    this.engineFilter.frequency.setTargetAtTime(110 + n * 21 + (boost ? 700 : 0), t, .09);
    this.engineGain.gain.setTargetAtTime(driving ? .023 + n * .0008 : .00001, t, .08);
    this.humGain.gain.setTargetAtTime(driving ? .003 : .008, t, .15);
  }
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextNote = this.ctx.currentTime + .08;
    const seq = [110,0,164.81,0,146.83,0,196,0,110,0,164.81,220,146.83,0,164.81,196];
    const step = 60 / 92 / 2;
    const pump = () => {
      if (!this.ctx) return;
      while (this.nextNote < this.ctx.currentTime + .18) {
        const i = this.beat % 16;
        if (i % 4 === 0) {
          this.tone(65, .28, .085, 'sine', 35, this.nextNote);
          this.tone(seq[i] / 2, .38, .027, 'triangle', null, this.nextNote);
        }
        if (seq[i] && i % 3 !== 1) this.tone(seq[i] * 2, .21, .015, 'triangle', null, this.nextNote);
        if (i === 4 || i === 12) {
          this.tone(146, .11, .026, 'triangle', 80, this.nextNote);
        }
        this.beat++;
        this.nextNote += step;
      }
    };
    pump();
    this.timer = setInterval(pump, 90);
  }
  footsteps() { this.hiss(.05,.021,1300); this.tone(73,.07,.014,'sine',56); }
  door() { this.hiss(.18,.055,750); this.tone(184,.24,.11,'sawtooth',90); }
  boost() { this.hiss(.40,.085,1450); this.tone(98,.58,.13,'sawtooth',290); }
  horn() {
    this.tone(369.99,.58,.15,'sawtooth',369.99);
    this.tone(440,.6,.09,'sawtooth',440);
  }
  checkpoint() {
    const at = this.ctx?.currentTime || 0;
    [392,493.88,587.33,783.99].forEach((f,i) => this.tone(f,.48,.075,'triangle',null,at + i*.11));
  }
  complete() {
    const at = this.ctx?.currentTime || 0;
    [261.63,329.63,392,523.25,659.26,783.99].forEach((f,i) => this.tone(f,.90,.075,'triangle',null,at+i*.14));
  }
}
