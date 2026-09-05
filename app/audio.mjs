// Audio is started only by a gesture, with local clips first and device narration as fallback.
export class Sound {
  constructor(getSettings) {
    this.settings = getSettings;
    this.ctx = null;
    this.activeClip = null;
    this.serial = 0;
    this.clips = new Map();
    this.loadClips();
  }
  async loadClips() {
    try {
      const response = await fetch(
        new URL("../games/melody/voice/manifest.json", import.meta.url),
      );
      if (!response.ok) return;
      const data = await response.json();
      for (const [id, clip] of Object.entries(data.clips || {}))
        this.clips.set(
          this.normalize(clip.text),
          new URL(`../games/melody/voice/${id}.mp3`, import.meta.url).href,
        );
    } catch {
      /* Speech and visual guidance remain available offline. */
    }
  }
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^a-z0-9' ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  unlock() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && Context) this.ctx = new Context();
      if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
    } catch {
      /* Silent play is supported. */
    }
  }
  note(hz = 440, duration = 0.35) {
    if (!this.settings().sound || !this.ctx) return;
    try {
      const ctx = this.ctx,
        now = ctx.currentTime,
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + duration + 0.03);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      /* Missing audio must not prevent progress. */
    }
  }
  stop() {
    this.serial++;
    if (this.activeClip) {
      this.activeClip.pause();
      this.activeClip = null;
    }
    window.speechSynthesis?.cancel();
  }
  say(text) {
    this.stop();
    if (!this.settings().sound || !this.settings().speech || document.hidden)
      return;
    const serial = this.serial;
    const fallback = () => {
      if (
        this.serial !== serial ||
        !window.speechSynthesis ||
        !window.SpeechSynthesisUtterance
      )
        return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 1.06;
      const voices = speechSynthesis.getVoices();
      utterance.voice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            /Samantha|Karen|Google US English/.test(v.name),
        ) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        null;
      speechSynthesis.speak(utterance);
    };
    const src = this.clips.get(this.normalize(text));
    if (src) {
      const clip = new Audio(src);
      this.activeClip = clip;
      clip.volume = 0.9;
      clip.play().catch(fallback);
    } else fallback();
  }
}
