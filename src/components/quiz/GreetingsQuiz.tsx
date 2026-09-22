import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playLetter, playWord, preloadLetters, preloadWords } from "@/lib/word-audio";
import { playCorrectSound, playWrongSound } from "@/lib/feedback-sound";
import {
  AnswerGrid,
  Continue,
  LessonFrame,
  LetterBuilder,
  LetterOptions,
  MatchPairs,
  OptionGrid,
  Picture,
  PictureOptions,
  ResultCard,
  WordCard,
} from "@/components/quiz/pieces";
import {
  GREETINGS_TEST_ID,
  GREETINGS_WORDS,
  SITUATIONS,
  type GreetingWord,
} from "@/data/greetings";
import {
  ALL_TEST_TYPES,
  answerLetters,
  buildRoundFromRows,
  letterTilesFor,
  missingLetterQuestion,
  shuffle,
  wordSegments,
  type QuizItem,
} from "@/lib/quiz-engine";
import { ensureTestEntered, getActiveTierRows, recordFail, recordPass } from "@/lib/progress-store";
import type { MotherTongue, Strings } from "@/lib/i18n";

// Data-driven quiz screen for the "Hallo!" (greetings) lesson: 10 words x 12
// test types. Rounds are strictly tier-gated — every round's queue is built
// from whatever (word, testType) rows are still pending (pendingAttempts >
// 0 in progress-store.ts) in the EARLIEST tier that isn't fully cleared, so
// no medium-tier item ever appears while an easy row is outstanding, and
// likewise hard waits on medium. The lesson keeps looping within (and then
// across) tiers until every row is mastered (pending 0). Renders one item
// at a time using the shared pieces from components/quiz/pieces.tsx instead
// of the Vogel lesson's hand-written per-screen JSX in routes/index.tsx.
function segmentRanges(segments: number[]) {
  let offset = 0;
  return segments.map((len) => {
    const start = offset;
    offset += len;
    return { start, len };
  });
}

export function GreetingsQuiz({
  t,
  lang,
  onExit,
}: {
  t: Strings;
  lang: MotherTongue;
  onExit: () => void;
}) {
  const byId = useMemo(() => Object.fromEntries(GREETINGS_WORDS.map((w) => [w.id, w])), []);
  const [queue, setQueue] = useState<QuizItem[]>([]);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [letters, setLetters] = useState<number[]>([]);
  const [heard, setHeard] = useState(false);
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const item: QuizItem | undefined = queue[index];

  // First entry populates all 120 (word x testType) rows at pendingAttempts
  // = 1 (or resets them on a post-completion replay, or leaves an
  // in-progress test untouched — see ensureTestEntered). Either way, the
  // round always comes from whichever tier is currently active.
  useEffect(() => {
    const wordIds = GREETINGS_WORDS.map((w) => w.id);
    ensureTestEntered(GREETINGS_TEST_ID, wordIds, ALL_TEST_TYPES);
    setQueue(buildRoundFromRows(getActiveTierRows(GREETINGS_TEST_ID), GREETINGS_WORDS));
    setReady(true);
  }, []);

  useEffect(() => {
    setAnswer(null);
    setLetters([]);
    setHeard(false);
    setChecked(false);
    setAttempts(0);
  }, [index]);

  useEffect(() => {
    if (!item) return;
    if (item.kind === "match") {
      preloadWords(item.words.map((w) => w.full));
      return;
    }
    preloadWords([item.word.full]);
    if (item.kind === "build" || item.kind === "unscramble" || item.kind === "listenBuild")
      preloadLetters(answerLetters(item.word.full).split(""));
  }, [item]);

  const derived = useMemo(() => {
    if (!item || item.kind === "match") return null;
    const word = item.word;
    const distractors = item.optionIds
      .map((id) => byId[id])
      .filter((w): w is GreetingWord => Boolean(w));
    const mcOptions = shuffle([word, ...distractors]);
    const isSpelling =
      item.kind === "build" || item.kind === "unscramble" || item.kind === "listenBuild";
    const tiles = isSpelling ? letterTilesFor(word.full, item.kind === "build") : [];
    const segments = wordSegments(word.full);
    const answerLength = segments.reduce((a, b) => a + b, 0);
    const missing = item.kind === "missing" ? missingLetterQuestion(word.full) : null;
    return { word, mcOptions, tiles, segments, answerLength, missing };
  }, [item, byId]);

  // Once the current round runs out, the next round comes from whatever
  // tier is now active: more of the same tier if fails left rows pending in
  // it, otherwise the next tier down the line. Only once every tier is
  // fully cleared does the queue empty out and the "Geschafft!" screen show.
  const goNext = () => {
    const nextIndex = index + 1;
    if (nextIndex < queue.length) {
      setIndex(nextIndex);
      return;
    }
    const nextRows = getActiveTierRows(GREETINGS_TEST_ID);
    setQueue(nextRows.length > 0 ? buildRoundFromRows(nextRows, GREETINGS_WORDS) : []);
    setIndex(0);
  };
  const checkAnswer = (isCorrect: boolean) => {
    setChecked(true);
    setLastCorrect(isCorrect);
    if (item && item.kind !== "match" && derived) {
      if (isCorrect) recordPass(GREETINGS_TEST_ID, item.kind, derived.word.id);
      // Only the first wrong attempt on a queue appearance costs a penalty —
      // further in-place retries (see `retry` below) don't stack.
      else if (attempts === 0) recordFail(GREETINGS_TEST_ID, item.kind, derived.word.id);
    }
    if (isCorrect) playCorrectSound();
    else {
      playWrongSound();
      setAttempts((a) => a + 1);
    }
  };
  const retry = () => {
    setChecked(false);
    setAnswer(null);
    setLetters([]);
  };
  const speak = () => {
    if (!item || item.kind === "match") return;
    setHeard(true);
    playWord(item.word.full);
  };
  const tapTile = (i: number, letter: string) => {
    playLetter(letter);
    setLetters((old) => [...old, i]);
  };

  return (
    <>
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        {ready && !item && (
          <LessonFrame t={t} eyebrow={t.roundUp} title="Geschafft!" subtitle={t.xpStreakContinues}>
            <Button variant="adventure" size="lesson" className="w-full" onClick={onExit}>
              {t.backToPath}
            </Button>
          </LessonFrame>
        )}

        {item && item.kind === "picture" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.pictureChallenge}
            title="Was ist das?"
            subtitle={t.chooseGermanWordForPicture}
          >
            <Picture
              src={derived.word.image}
              alt={derived.word.full}
              caption={derived.word[lang]}
            />
            <AnswerGrid
              options={derived.mcOptions.map((w) => w.full)}
              selected={answer}
              correct={derived.word.full}
              revealed={checked}
              onSelect={setAnswer}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word.full)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "wordPicture" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.wordPictureChallenge}
            title="Welches Bild ist das?"
            subtitle={t.chooseGermanPictureForWord}
          >
            <WordCard t={t} text={derived.word.full} speak />
            <PictureOptions
              options={derived.mcOptions.map((w) => ({ id: w.id, image: w.image, label: w[lang] }))}
              selected={answer}
              correct={derived.word.id}
              revealed={checked}
              onSelect={setAnswer}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word.id)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "meaning" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.meaningCheck}
            title="Was bedeutet das?"
            subtitle={t.chooseMeaning}
          >
            <WordCard t={t} text={derived.word.full} speak />
            <AnswerGrid
              options={derived.mcOptions.map((w) => w[lang])}
              selected={answer}
              correct={derived.word[lang]}
              revealed={checked}
              onSelect={setAnswer}
              speak={false}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word[lang])}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "translate" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.translationChallenge}
            title="Wie sagt man das auf Deutsch?"
            subtitle={t.chooseGermanWord}
          >
            <WordCard t={t} text={derived.word[lang]} />
            <AnswerGrid
              options={derived.mcOptions.map((w) => w.full)}
              selected={answer}
              correct={derived.word.full}
              revealed={checked}
              onSelect={setAnswer}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word.full)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "build" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.wordBuilder}
            title="Baue das Wort"
            subtitle={t.tapLettersToSpell(derived.word.full)}
          >
            <Picture
              src={derived.word.image}
              alt={derived.word.full}
              caption={derived.word[lang]}
            />
            <LetterBuilder
              t={t}
              answerLength={derived.answerLength}
              segments={derived.segments}
              tiles={derived.tiles}
              letters={letters}
              disabled={checked}
              onTapTile={tapTile}
              onReset={() => setLetters([])}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={letters.length !== derived.answerLength}
                onClick={() =>
                  checkAnswer(
                    letters.map((i) => derived.tiles[i]).join("") ===
                      answerLetters(derived.word.full),
                  )
                }
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "situation" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.situationChallenge}
            title="Wann sagt man das?"
            subtitle={t.chooseSituation}
          >
            <WordCard t={t} text={derived.word.full} speak />
            <OptionGrid
              options={SITUATIONS}
              selected={answer}
              correct={derived.word.situation}
              revealed={checked}
              onSelect={setAnswer}
              columns={2}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word.situation)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "missing" && derived && derived.missing && (
          <LessonFrame
            t={t}
            eyebrow={t.missingLetter}
            title="Welcher Buchstabe fehlt?"
            subtitle={t.pickLetterThatCompletes}
          >
            <Picture
              src={derived.word.image}
              alt={derived.word.full}
              caption={derived.word[lang]}
            />
            <div className="my-5 flex flex-wrap items-center justify-center gap-3">
              {segmentRanges(derived.segments).map((range, gi) => (
                <div key={gi} className="flex gap-2">
                  {Array.from({ length: range.len }).map((_, i) => {
                    const pos = range.start + i;
                    const isBlank = pos === derived.missing!.blankIndex;
                    const ch = isBlank
                      ? checked
                        ? (answer ?? "_")
                        : "_"
                      : derived.missing!.letters[pos];
                    return (
                      <span
                        key={i}
                        className={cn(
                          "grid size-12 place-items-center rounded-xl font-display text-xl font-extrabold",
                          isBlank
                            ? cn(
                                "border-2 bg-glass",
                                !checked && "border-dashed border-ring/50",
                                checked && lastCorrect && "border-success text-success",
                                checked && !lastCorrect && "border-destructive text-destructive",
                              )
                            : "bg-card ring-1 ring-border",
                        )}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <LetterOptions
              options={derived.missing.options}
              selected={answer}
              correct={derived.missing.correct}
              revealed={checked}
              onSelect={setAnswer}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.missing!.correct)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "listen" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.listeningChallenge}
            title="Was hörst du?"
            subtitle={t.listenThenChoose}
          >
            <div className="my-5 flex justify-center">
              <Button
                onClick={speak}
                className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none"
                aria-label={t.playGermanWord}
              >
                <Volume2 className="size-10" />
              </Button>
            </div>
            {heard && (
              <p className="mb-4 text-center text-sm font-bold text-ink-soft">{t.listenAgain}</p>
            )}
            <AnswerGrid
              options={derived.mcOptions.map((w) => w.full)}
              selected={answer}
              correct={derived.word.full}
              revealed={checked}
              onSelect={setAnswer}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word.full)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "unscramble" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.unscramble}
            title="Ordne die Buchstaben"
            subtitle={t.arrangeLetters}
          >
            <Picture
              src={derived.word.image}
              alt={derived.word.full}
              caption={derived.word[lang]}
            />
            <LetterBuilder
              t={t}
              answerLength={derived.answerLength}
              segments={derived.segments}
              tiles={derived.tiles}
              letters={letters}
              disabled={checked}
              onTapTile={tapTile}
              onReset={() => setLetters([])}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={letters.length !== derived.answerLength}
                onClick={() =>
                  checkAnswer(
                    letters.map((i) => derived.tiles[i]).join("") ===
                      answerLetters(derived.word.full),
                  )
                }
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "listenBuild" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.listeningChallenge}
            title="Baue das Wort"
            subtitle={t.listenThenSpell}
          >
            <div className="my-5 flex justify-center">
              <Button
                onClick={speak}
                className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none"
                aria-label={t.playGermanWord}
              >
                <Volume2 className="size-10" />
              </Button>
            </div>
            {heard && (
              <p className="mb-4 text-center text-sm font-bold text-ink-soft">{t.listenAgain}</p>
            )}
            <LetterBuilder
              t={t}
              answerLength={derived.answerLength}
              segments={derived.segments}
              tiles={derived.tiles}
              letters={letters}
              disabled={checked}
              onTapTile={tapTile}
              onReset={() => setLetters([])}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={letters.length !== derived.answerLength}
                onClick={() =>
                  checkAnswer(
                    letters.map((i) => derived.tiles[i]).join("") ===
                      answerLetters(derived.word.full),
                  )
                }
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "listenPicture" && derived && (
          <LessonFrame
            t={t}
            eyebrow={t.listeningChallenge}
            title="Welches Bild hörst du?"
            subtitle={t.listenThenTapPicture}
          >
            <div className="my-5 flex justify-center">
              <Button
                onClick={speak}
                className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none"
                aria-label={t.playGermanWord}
              >
                <Volume2 className="size-10" />
              </Button>
            </div>
            {heard && (
              <p className="mb-4 text-center text-sm font-bold text-ink-soft">{t.listenAgain}</p>
            )}
            <PictureOptions
              options={derived.mcOptions.map((w) => ({ id: w.id, image: w.image, label: w[lang] }))}
              selected={answer}
              correct={derived.word.id}
              revealed={checked}
              onSelect={setAnswer}
            />
            {!checked && (
              <Continue
                t={t}
                disabled={!answer}
                onClick={() => checkAnswer(answer === derived.word.id)}
              />
            )}
          </LessonFrame>
        )}

        {item && item.kind === "match" && (
          <LessonFrame
            t={t}
            eyebrow={t.roundUp}
            title="Finde die Paare"
            subtitle={t.matchWordsToMeaning}
          >
            <MatchPairs
              key={item.words.map((w) => w.id).join("-")}
              t={t}
              lang={lang}
              words={item.words}
              onComplete={goNext}
              onAttempt={(wordId, isCorrect) => {
                if (isCorrect) recordPass(GREETINGS_TEST_ID, "match", wordId);
                else recordFail(GREETINGS_TEST_ID, "match", wordId);
              }}
              title="Runde geschafft!"
              actionLabel="Weiter"
            />
          </LessonFrame>
        )}

        {item && item.kind !== "match" && checked && derived && (
          <ResultCard
            correct={lastCorrect}
            correctText={t.correctMeaning(derived.word.full, derived.word[lang])}
            hint={attempts >= 2 ? t.hintGeneric : undefined}
            actionLabel={lastCorrect ? "Weiter" : t.tryAgain}
            onAction={lastCorrect ? goNext : retry}
          />
        )}
      </main>
    </>
  );
}
