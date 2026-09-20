import { WORD_AUDIO } from "@/data/word-audio.generated";

// Plays a recorded pronunciation for `word` if one has been generated
// (see scripts/generate-audio.mjs). Falls back to the device's speech
// synthesis for words that don't have an audio file yet, so new vocabulary
// still speaks something before its audio is recorded.
export function playWord(word: string) {
  const src = WORD_AUDIO[word];
  if (src) {
    new Audio(src).play().catch(() => {
      /* autoplay/decoding blocked — user can just tap the button again */
    });
    return;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "de-DE";
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
  }
}
