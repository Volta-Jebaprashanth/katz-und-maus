import type { VocabWord } from "@/data/vocabulary";

// Generic quiz-queue builder: N words x 10 test types, grouped into four
// difficulty tiers (1 basic, 3 easy, 3 medium, 3 hard). Rounds are strictly
// tier-gated — see buildRoundFromRows below — so nothing from the easy tier
// is ever queued while any basic row is still outstanding, and likewise
// medium waits on easy and hard waits on medium (the "match" test type is grouped rather than per-word, so a
// tier lands at 10 items instead of 40 once it's match's turn).
export type Tier = "basic" | "easy" | "medium" | "hard";

export const TIER_ORDER: Tier[] = ["basic", "easy", "medium", "hard"];

export type TestType =
  | "picture"
  | "wordPicture"
  | "meaning"
  | "translate"
  | "build"
  | "missing"
  | "listen"
  | "listenBuild"
  | "listenPicture"
  | "match";

export const TEST_TIERS: Record<Tier, TestType[]> = {
  basic: ["wordPicture"],
  easy: ["picture", "meaning", "listen"],
  medium: ["missing", "listenPicture", "translate"],
  hard: ["build", "listenBuild", "match"],
};

export const ALL_TEST_TYPES: TestType[] = [
  ...TEST_TIERS.basic,
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
  word: VocabWord;
  optionIds: string[];
}
export interface MatchItem {
  kind: "match";
  tier: Tier;
  words: VocabWord[];
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

function pickDistractorIds(words: VocabWord[], correct: VocabWord, count: number): string[] {
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
export function buildRoundFromRows(rows: RowRef[], words: VocabWord[]): QuizItem[] {
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
    .filter((w): w is VocabWord => Boolean(w));
  for (const group of chunk(matchWords, 5))
    items.push({ kind: "match", tier: "hard", words: group });

  return shuffle(items);
}

// Everything a question can play or show, so the audio/image loaders can
// fetch it ahead of time (see setAudioWindow / setImageWindow). Mirrors what
// each screen in VocabQuiz.tsx actually renders and speaks: the answer
// options (word + its distractors) for the multiple-choice screens, the
// letters for the spelling screens, the whole letter pool for "missing", and
// the five words on a match board.
export interface ItemMedia {
  words: string[];
  letters: string[];
  images: string[];
}

export function itemMedia(item: QuizItem, byId: Record<string, VocabWord>): ItemMedia {
  if (item.kind === "match")
    return {
      words: item.words.map((w) => w.full),
      letters: [],
      images: item.words.map((w) => w.image),
    };
  const options = [item.word, ...item.optionIds.map((id) => byId[id]).filter((w) => w != null)];
  const spelled = answerLetters(spellingOf(item.word)).split("");
  switch (item.kind) {
    case "picture":
      return { words: options.map((w) => w.full), letters: [], images: [item.word.image] };
    case "wordPicture":
      return { words: [item.word.full], letters: [], images: options.map((w) => w.image) };
    case "meaning":
      return { words: [item.word.full], letters: [], images: [] };
    case "translate":
    case "listen":
      return { words: options.map((w) => w.full), letters: [], images: [] };
    case "listenPicture":
      return { words: [item.word.full], letters: [], images: options.map((w) => w.image) };
    case "build":
      return { words: [], letters: spelled, images: [item.word.image] };
    case "listenBuild":
      return { words: [item.word.full], letters: spelled, images: [] };
    case "missing":
      return {
        words: [],
        letters: [...spelled, ...MISSING_LETTER_POOL],
        images: [item.word.image],
      };
  }
}

// The part of a word the learner spells out: its `full` text minus a leading
// der/die/das, since the article is learned as part of the word (it's shown
// and spoken) but isn't something to type letter by letter.
export function spellingOf(word: VocabWord): string {
  return word.full.replace(/^(der|die|das)\s+/i, "");
}

// Strips everything but letters (spaces, apostrophes, "?", ...) and
// uppercases, so a multi-word phrase like "Wie geht's?" becomes "WIEGEHTS"
// for spelling/comparison purposes. "ß" becomes "SS" (what toUpperCase gives,
// and the standard German capitalisation), so "Großvater" is spelled
// "GROSSVATER" from the plain A-Z tiles. "É" is kept for loanwords like
// "Café", which would otherwise be spelled "CAF".
export function answerLetters(phrase: string): string {
  return phrase.toUpperCase().replace(/[^A-ZÄÖÜÉẞ]/g, "");
}

// Letter counts per space-separated word, so the letter-builder can render
// blank tiles grouped the same way the phrase actually reads. Counted from
// answerLetters so it always agrees with the tile pool ("ß" counts as 2).
export function wordSegments(phrase: string): number[] {
  return phrase
    .split(" ")
    .map((word) => answerLetters(word).length)
    .filter((n) => n > 0);
}

// `withDistractor` adds one duplicated letter into the tile pool (mirrors
// the original hand-built "build" screen, which had 6 tiles for a 5-letter
// word); listenBuild uses the exact letters with no decoy.
export function letterTilesFor(phrase: string, withDistractor = false): string[] {
  const letters = answerLetters(phrase).split("");
  const tiles = withDistractor
    ? [...letters, letters[Math.floor(Math.random() * letters.length)]!]
    : letters;
  return shuffle(tiles);
}

export const MISSING_LETTER_POOL = [
  "A",
  "E",
  "I",
  "O",
  "U",
  "N",
  "R",
  "T",
  "S",
  "M",
  "G",
  "B",
  "H",
  "L",
];

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
