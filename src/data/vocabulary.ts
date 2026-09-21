import type { MotherTongue } from "@/lib/i18n";

// Shared vocabulary for the "Tiere" (animals) lesson. `full` matches the keys
// in word-audio.generated.ts so playWord() finds the right pronunciation clip.
// The meaning fields are keyed the same as MotherTongue so a word's meaning
// in the learner's chosen language can be read with `word[lang]`.
export interface VocabWord {
  id: string;
  image: string;
  full: string;
  english: string;
  tamil: string;
  sinhala: string;
}

export const TIERE_WORDS: VocabWord[] = [
  { id: "hund", image: "/images/animals/hund.png", full: "der Hund", english: "Dog", tamil: "நாய்", sinhala: "බල්ලා" },
  { id: "katze", image: "/images/animals/katze.png", full: "die Katze", english: "Cat", tamil: "பூனை", sinhala: "පූසා" },
  { id: "vogel", image: "/images/animals/vogel.png", full: "der Vogel", english: "Bird", tamil: "பறவை", sinhala: "කුරුල්ලා" },
  { id: "pferd", image: "/images/animals/pferd.png", full: "das Pferd", english: "Horse", tamil: "குதிரை", sinhala: "අශ්වයා" },
];

export function wordMeaning(word: VocabWord, lang: MotherTongue): string {
  return word[lang];
}
