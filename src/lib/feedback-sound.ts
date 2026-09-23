// Pre-rendered chimes for right/wrong answers (see
// scripts/generate-feedback-sounds.mjs for how public/audio/sfx-*.wav were
// generated). These used to be synthesized live with the Web Audio API, but
// a live AudioContext gets auto-suspended by the browser after a stretch of
// silence — exactly what happens between quiz questions — which silently
// dropped every chime after the first one. Static files play through a
// plain <audio> element instead.
//
// Each chime keeps one preloaded element that's rewound and replayed, so a
// chime never waits on a fresh request. They're kept off word-audio.ts's
// shared "one clip at a time" playback so a chime doesn't cut off a word
// pronunciation playing at the same moment (e.g. the matching game speaks
// the word and plays the chime back to back).
const CORRECT_SRC = "/audio/sfx-correct.wav";
const WRONG_SRC = "/audio/sfx-wrong.wav";
const chimes = new Map<string, HTMLAudioElement>();

function chime(src: string): HTMLAudioElement {
  let audio = chimes.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    chimes.set(src, audio);
  }
  return audio;
}

function playChime(src: string) {
  const audio = chime(src);
  audio.currentTime = 0;
  audio.play().catch(() => {
    /* autoplay/decoding blocked — user still sees the visual feedback */
  });
}

export function preloadFeedbackSounds() {
  chime(CORRECT_SRC).load();
  chime(WRONG_SRC).load();
}

export function playCorrectSound() {
  playChime(CORRECT_SRC);
}

export function playWrongSound() {
  playChime(WRONG_SRC);
}
