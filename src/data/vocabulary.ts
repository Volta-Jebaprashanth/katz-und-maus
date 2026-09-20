// Shared vocabulary for the "Tiere" (animals) lesson. `full` matches the keys
// in word-audio.generated.ts so playWord() finds the right pronunciation clip.
export interface VocabWord {
  id: string;
  emoji: string;
  full: string;
  english: string;
}

export const TIERE_WORDS: VocabWord[] = [
  { id: "hund", emoji: "🐶", full: "der Hund", english: "Dog" },
  { id: "katze", emoji: "🐱", full: "die Katze", english: "Cat" },
  { id: "vogel", emoji: "🐦", full: "der Vogel", english: "Bird" },
  { id: "pferd", emoji: "🐴", full: "das Pferd", english: "Horse" },
];
