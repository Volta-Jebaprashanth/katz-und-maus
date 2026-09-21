import { WORD_AUDIO } from "@/data/word-audio.generated";
import { LETTER_AUDIO } from "@/data/letter-audio.generated";

// Only one clip plays at a time — otherwise rapid taps (e.g. spelling a word
// letter by letter) pile up overlapping audio.
let activeClip: HTMLAudioElement | null = null;

// Reused across plays so a screen's clips can be fetched ahead of time (see
// preloadWords/preloadLetters) instead of only starting the network request
// at tap time, which is what made playback feel laggy on a fresh screen.
const clipCache = new Map<string, HTMLAudioElement>();

function getClip(src: string): HTMLAudioElement {
  let audio = clipCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    clipCache.set(src, audio);
  }
  return audio;
}

function playClip(src: string) {
  activeClip?.pause();
  const audio = getClip(src);
  audio.currentTime = 0;
  activeClip = audio;
  audio.play().catch(() => {
    /* autoplay/decoding blocked — user can just tap again */
  });
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

// Plays a recorded pronunciation for `word` if one has been generated
// (see scripts/generate-audio.mjs). Falls back to the device's speech
// synthesis for words that don't have an audio file yet, so new vocabulary
// still speaks something before its audio is recorded.
export function playWord(word: string) {
  const src = WORD_AUDIO[word];
  if (src) playClip(src);
  else speak(word);
}

// Plays the German name of a single letter (e.g. "P" -> "peh"), for the
// word-builder's letter tiles.
export function playLetter(letter: string) {
  const src = LETTER_AUDIO[letter.toUpperCase()];
  if (src) playClip(src);
  else speak(letter);
}

// Fetches a word's/letter's clip into `clipCache` without playing it, so a
// lesson screen can warm up every sound it might need as soon as it mounts
// instead of only starting the download on the first tap.
export function preloadWords(words: string[]) {
  for (const word of words) {
    const src = WORD_AUDIO[word];
    if (src) getClip(src).load();
  }
}

export function preloadLetters(letters: string[]) {
  for (const letter of letters) {
    const src = LETTER_AUDIO[letter.toUpperCase()];
    if (src) getClip(src).load();
  }
}
