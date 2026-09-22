import type { GreetingWord } from "@/data/greetings";

// Generic quiz-queue builder: 10 words x 12 test types, grouped into three
// difficulty tiers of 4 test types each. Each tier's items are generated and
// shuffled independently, then the tiers are concatenated in a fixed
// easy -> medium -> hard order (the "match" test type is grouped rather than
// per-word — see buildGreetingsQueue below — so the hard tier lands at 32
// items instead of 40, and the total at 112 instead of 120).
export type Tier = "easy" | "medium" | "hard";

export type TestType =
  | "picture"
  | "wordPicture"
  | "meaning"
  | "translate"
  | "build"
  | "situation"
  | "missing"
  | "listen"
  | "unscramble"
  | "listenBuild"
  | "listenPicture"
  | "match";

export const TEST_TIERS: Record<Tier, TestType[]> = {
  easy: ["picture", "wordPicture", "meaning", "translate"],
  medium: ["build", "situation", "missing", "listen"],
  hard: ["unscramble", "listenBuild", "listenPicture", "match"],
};

export type SingleWordKind = Exclude<TestType, "match">;
export interface SingleWordItem {
  kind: SingleWordKind;
  tier: Tier;
  word: GreetingWord;
  optionIds: string[];
}
export interface MatchItem {
  kind: "match";
  tier: Tier;
  words: GreetingWord[];
}
export type QuizItem = SingleWordItem | MatchItem;

export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pickDistractorIds(words: GreetingWord[], correct: GreetingWord, count: number): string[] {
  return shuffle(words.filter((w) => w.id !== correct.id))
    .slice(0, count)
    .map((w) => w.id);
}

function buildTier(tier: Tier, types: TestType[], words: GreetingWord[]): QuizItem[] {
  const perWordTypes = types.filter((type): type is SingleWordKind => type !== "match");
  const items: QuizItem[] = perWordTypes.flatMap((kind) =>
    words.map((word): SingleWordItem => ({
      kind,
      tier,
      word,
      optionIds: pickDistractorIds(words, word, 3),
    })),
  );
  if (types.includes("match")) {
    for (const group of chunk(shuffle(words), 5)) items.push({ kind: "match", tier, words: group });
  }
  return shuffle(items);
}

export function buildGreetingsQueue(words: GreetingWord[]): QuizItem[] {
  return [
    ...buildTier("easy", TEST_TIERS.easy, words),
    ...buildTier("medium", TEST_TIERS.medium, words),
    ...buildTier("hard", TEST_TIERS.hard, words),
  ];
}

// Strips everything but letters (spaces, apostrophes, "?", ...) and
// uppercases, so a multi-word phrase like "Wie geht's?" becomes "WIEGEHTS"
// for spelling/comparison purposes.
export function answerLetters(phrase: string): string {
  return phrase.toUpperCase().replace(/[^A-ZÄÖÜẞ]/g, "");
}

// Letter counts per space-separated word, so the letter-builder can render
// blank tiles grouped the same way the phrase actually reads.
export function wordSegments(phrase: string): number[] {
  return phrase
    .split(" ")
    .map((word) => word.replace(/[^A-Za-zÄÖÜäöüß]/g, "").length)
    .filter((n) => n > 0);
}

// `withDistractor` adds one duplicated letter into the tile pool (mirrors
// the original hand-built "build" screen, which had 6 tiles for a 5-letter
// word); unscramble/listenBuild use the exact letters with no decoy.
export function letterTilesFor(phrase: string, withDistractor = false): string[] {
  const letters = answerLetters(phrase).split("");
  const tiles = withDistractor
    ? [...letters, letters[Math.floor(Math.random() * letters.length)]!]
    : letters;
  return shuffle(tiles);
}

const MISSING_LETTER_POOL = ["A", "E", "I", "O", "U", "N", "R", "T", "S", "M", "G", "B", "H", "L"];

export interface MissingLetterQuestion {
  letters: string[];
  blankIndex: number;
  correct: string;
  options: string[];
}

export function missingLetterQuestion(phrase: string): MissingLetterQuestion {
  const letters = answerLetters(phrase).split("");
  const blankIndex = Math.floor(letters.length / 2);
  const correct = letters[blankIndex]!;
  const distractorPool = MISSING_LETTER_POOL.filter((l) => l !== correct);
  const options = shuffle([correct, ...shuffle(distractorPool).slice(0, 3)]);
  return { letters, blankIndex, correct, options };
}
