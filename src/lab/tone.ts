/** A short generated WAV (a few plucked notes), so audio stories need no network or file. */
export function toneUrl(seconds = 6): string {
  const rate = 22050;
  const n = rate * seconds;
  const data = new Int16Array(n);
  const notes = [220, 277.18, 329.63, 440, 329.63, 277.18];
  const step = Math.floor(n / notes.length);
  notes.forEach((f, k) => {
    for (let i = 0; i < step; i++) {
      const t = i / rate;
      const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-3 * t) * 0.6;
      data[k * step + i] = Math.max(-1, Math.min(1, v)) * 32767;
    }
  });
  const buf = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buf);
  const str = (o: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  str(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, n * 2, true);
  new Int16Array(buf, 44).set(data);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}
