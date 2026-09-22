import type { GreetingWord } from "@/data/greetings";

// Generic quiz-queue builder: 10 words x 12 test types, grouped into three
// difficulty tiers of 4 test types each. Rounds are strictly tier-gated —
// see buildRoundFromRows below — so nothing from the medium tier is ever
// queued while any easy row is still outstanding, and likewise hard waits
// on medium (the "match" test type is grouped rather than per-word, so a
// tier lands at 10 items instead of 40 once it's match's turn).
export type Tier = "easy" | "medium" | "hard";

export const TIER_ORDER: Tier[] = ["easy", "medium", "hard"];

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
  easy: ["picture", "wordPicture", "meaning", "listen"],
  medium: ["situation", "missing", "listenPicture", "translate"],
  hard: ["unscramble", "listenBuild", "build", "match"],
};

export const ALL_TEST_TYPES: TestType[] = [
  ...TEST_TIERS.easy,
  ...TEST_TIERS.medium,
  ...TEST_TIERS.hard,
];

const TIER_BY_TYPE = Object.fromEntries(
  (Object.keys(TEST_TIERS) as Tier[]).flatMap((tier) =>
    TEST_TIERS[tier].map((type) => [type, tier] as const),
  ),
) as Record<TestType, Tier>;

export function tierOfType(type: TestType): Tier {
  return TIER_BY_TYPE[type];
}

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

export interface RowRef {
  testType: TestType;
  wordId: string;
}

// Builds a round's queue from a set of still-outstanding rows (pending > 0
// in progress-store.ts). Callers are expected to have already filtered
// those rows down to a single tier — see getActiveTierRows — so this itself
// doesn't know or care about tier order, it just turns whatever it's given
// into a shuffled queue.
export function buildRoundFromRows(rows: RowRef[], words: GreetingWord[]): QuizItem[] {
  const byId = Object.fromEntries(words.map((w) => [w.id, w]));
  const items: QuizItem[] = [];
  const matchWordIds: string[] = [];

  for (const row of rows) {
    // Defensive against stale localStorage rows left over from a word or
    // test type that's since been removed from the app — progress-store.ts
    // prunes these on every entry, but skipping anything unrecognized here
    // too means a leftover row can never build a queue item with no
    // matching UI branch, which would otherwise strand the kid on a blank
    // screen with no way to advance.
    const word = byId[row.wordId];
    if (!word) continue;
    if (row.testType === "match") {
      matchWordIds.push(row.wordId);
      continue;
    }
    if (!(row.testType in TIER_BY_TYPE)) continue;
    const kind = row.testType as SingleWordKind;
    items.push({
      kind,
      tier: TIER_BY_TYPE[kind],
      word,
      optionIds: pickDistractorIds(words, word, 3),
    });
  }

  const matchWords = shuffle(matchWordIds)
    .map((id) => byId[id])
    .filter((w): w is GreetingWord => Boolean(w));
  for (const group of chunk(matchWords, 5))
    items.push({ kind: "match", tier: "hard", words: group });

  return shuffle(items);
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
