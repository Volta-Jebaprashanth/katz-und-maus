import { TIER_ORDER, tierOfType, type TestType, type Tier } from "@/lib/quiz-engine";

// Local-only mastery tracking. Each test (e.g. "1.1" for greetings) gets one
// row per (testType, word) combination — 100 rows for a 10-word/10-type test
// — holding a `pendingAttempts` counter instead of a pass/fail log:
//   - a test is first entered           -> every row starts at 1
//                                          (3 for basic-tier rows)
//   - the FIRST wrong attempt on a row  -> pending = min(pending + 2, 4)
//                                          (max 5 for basic-tier rows)
//   - whenever that row is finally passed (first try or after retries)
//                                       -> pending = max(pending - 1, 0)
// A test is "complete" once every one of its rows is 0. Re-entering an
// already-completed test resets all rows back to 1 for a fresh practice
// round, but the completed flag itself is permanent. Re-entering a test
// that's still in progress (rows exist, not yet completed) leaves the rows
// untouched so exiting mid-exercise and coming back resumes where the kid
// left off.
//
// Every entry also reconciles the row set against the CURRENT word list and
// test-type list, so content changes between app builds never strand a
// kid's saved progress: a row for a word/type that's been removed is
// dropped (and can no longer block completion), and a row for a newly added
// word/type is created fresh (see startPending) — even mid-progress, not just on a fresh
// start. See ensureTestEntered.
//
// Rounds are strictly tier-gated (basic -> easy -> medium -> hard, see
// quiz-engine.ts TIER_ORDER): every row across all 4 tiers exists from the
// moment a test is entered, but getActiveTierRows only ever hands back rows from the
// earliest tier that isn't fully cleared yet, so nothing from medium is
// ever queued while an easy row is still pending, etc. The basic tier
// starts each row at 3 (and caps at 5) so a kid sees every word several
// times in its simplest form before anything harder shows up.
const PROGRESS_KEY = "wortwunder:progress";
const SCHEMA_VERSION = 2;
const START_PENDING = 1;
const FAIL_PENALTY = 2;
const MAX_PENDING = 4;
const BASIC_START_PENDING = 3;
const BASIC_MAX_PENDING = 5;

function startPending(testType: TestType): number {
  return tierOfType(testType) === "basic" ? BASIC_START_PENDING : START_PENDING;
}

function maxPending(testType: TestType): number {
  return tierOfType(testType) === "basic" ? BASIC_MAX_PENDING : MAX_PENDING;
}

interface TestState {
  completed: boolean;
  rows: Record<string, number>;
}

interface ProgressStore {
  version: number;
  tests: Record<string, TestState>;
}

export interface PendingRow {
  testType: TestType;
  wordId: string;
  pending: number;
}

function rowKey(testType: TestType, wordId: string): string {
  return `${testType}:${wordId}`;
}

function emptyStore(): ProgressStore {
  return { version: SCHEMA_VERSION, tests: {} };
}

function readStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<ProgressStore>;
    if (parsed.version !== SCHEMA_VERSION || !parsed.tests) return emptyStore();
    return { version: SCHEMA_VERSION, tests: parsed.tests };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ProgressStore) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch {
    /* localStorage unavailable — progress still works for this session */
  }
}

export function ensureTestEntered(testId: string, wordIds: string[], testTypes: TestType[]) {
  const store = readStore();
  const existing = store.tests[testId];
  const hasRows = Boolean(existing && Object.keys(existing.rows).length > 0);
  const resetAll = !hasRows || existing!.completed;

  // Rebuilt from the current word/type lists every time, so a row whose key
  // no longer matches a real word+testType combo simply isn't carried over
  // (dropped), while every combo that IS current gets a row — reusing its
  // existing pendingAttempts when resuming, or starting fresh (see
  // startPending) when it's new or this is a full reset. All 4 tiers' rows
  // are populated up front even though presentation is tier-gated — see getActiveTierRows.
  const rows: Record<string, number> = {};
  for (const wordId of wordIds) {
    for (const testType of testTypes) {
      const key = rowKey(testType, wordId);
      const start = startPending(testType);
      rows[key] = resetAll ? start : (existing!.rows[key] ?? start);
    }
  }
  store.tests[testId] = {
    completed: (existing?.completed ?? false) || Object.values(rows).every((p) => p === 0),
    rows,
  };
  writeStore(store);
}

export function getPendingRows(testId: string): PendingRow[] {
  const rows = readStore().tests[testId]?.rows ?? {};
  return Object.entries(rows).map(([key, pending]) => {
    const [testType, wordId] = key.split(":") as [TestType, string];
    return { testType, wordId, pending };
  });
}

// The rows the queue should draw from right now: whatever's still pending
// in the earliest tier (basic -> easy -> medium -> hard) that isn't fully
// cleared.
// Later tiers' rows already exist (see ensureTestEntered) but are withheld
// until every row ahead of them in tier order hits 0.
export function getActiveTierRows(testId: string): PendingRow[] {
  const rows = getPendingRows(testId);
  for (const tier of TIER_ORDER) {
    const tierRows = rows.filter((row) => tierOfType(row.testType) === tier && row.pending > 0);
    if (tierRows.length > 0) return tierRows;
  }
  return [];
}

export function isTestCompleted(testId: string): boolean {
  return readStore().tests[testId]?.completed ?? false;
}

export function recordFail(testId: string, testType: TestType, wordId: string) {
  updateRow(testId, testType, wordId, (pending) =>
    Math.min(pending + FAIL_PENALTY, maxPending(testType)),
  );
}

export function recordPass(testId: string, testType: TestType, wordId: string) {
  updateRow(testId, testType, wordId, (pending) => Math.max(pending - 1, 0));
}

function updateRow(
  testId: string,
  testType: TestType,
  wordId: string,
  next: (pending: number) => number,
) {
  const store = readStore();
  const test = store.tests[testId] ?? { completed: false, rows: {} };
  const key = rowKey(testType, wordId);
  test.rows[key] = next(test.rows[key] ?? startPending(testType));
  test.completed = test.completed || Object.values(test.rows).every((pending) => pending === 0);
  store.tests[testId] = test;
  writeStore(store);
}

// What the learning path shows for a test: nothing until it's been entered,
// the tier currently being worked through while in progress, and just a
// "completed" tick once it's done — completion is permanent, so re-entering
// a finished test for practice never brings the tier badge back.
export type TestStatus =
  { kind: "notStarted" } | { kind: "inProgress"; tier: Tier } | { kind: "completed" };

export function getTestStatus(testId: string): TestStatus {
  const test = readStore().tests[testId];
  if (!test || Object.keys(test.rows).length === 0) return { kind: "notStarted" };
  if (test.completed) return { kind: "completed" };
  const tier = getActiveTierRows(testId)[0]?.testType;
  return tier ? { kind: "inProgress", tier: tierOfType(tier) } : { kind: "completed" };
}
