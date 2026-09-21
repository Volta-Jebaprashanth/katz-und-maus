// Pre-rendered chimes for right/wrong answers (see
// scripts/generate-feedback-sounds.mjs for how public/audio/sfx-*.wav were
// generated). These used to be synthesized live with the Web Audio API, but
// a live AudioContext gets auto-suspended by the browser after a stretch of
// silence — exactly what happens between quiz questions — which silently
// dropped every chime after the first one. Static files play through a
// plain <audio> element instead, same as the word pronunciation clips.
//
// Kept on their own elements rather than word-audio.ts's shared `activeClip`
// so a chime doesn't cut off a word pronunciation playing at the same
// moment (e.g. the matching game speaks the word and plays the chime back
// to back).
let correctClip: HTMLAudioElement | null = null;
let wrongClip: HTMLAudioElement | null = null;

function playChime(existing: HTMLAudioElement | null, src: string): HTMLAudioElement {
  existing?.pause();
  const audio = new Audio(src);
  audio.play().catch(() => {
    /* autoplay/decoding blocked — user still sees the visual feedback */
  });
  return audio;
}

export function playCorrectSound() {
  correctClip = playChime(correctClip, "/audio/sfx-correct.wav");
}

export function playWrongSound() {
  wrongClip = playChime(wrongClip, "/audio/sfx-wrong.wav");
}
