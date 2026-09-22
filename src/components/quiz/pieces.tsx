import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Star, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playLetter, playWord } from "@/lib/word-audio";
import { playCorrectSound, playWrongSound } from "@/lib/feedback-sound";
import { shuffle } from "@/lib/quiz-engine";
import type { MotherTongue, Strings } from "@/lib/i18n";

// Shared presentational building blocks for a lesson screen. Originally
// written inline in routes/index.tsx for the (single, hardcoded) Vogel
// lesson; extracted here so both that lesson and the data-driven Greetings
// quiz (components/quiz/GreetingsQuiz.tsx) render from the same pieces
// instead of forking the UI. Behavior for existing call sites is unchanged —
// the only additions are optional props (icon fallbacks, tile grouping,
// grid column count) that new call sites opt into.

export function LessonFrame({
  t,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  t: Strings;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel mx-auto max-w-3xl rounded-[28px] p-5 sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
        <button
          type="button"
          onClick={() => playWord(title)}
          className="inline-flex items-center gap-2 text-left"
          aria-label={t.tapToHear(title)}
        >
          {title} <Volume2 className="size-6 shrink-0 text-ink-soft" />
        </button>
      </h1>
      <p className="font-bold text-ink-soft">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

// `caption` labels the picture with its word so a photo that can't be told
// apart from a similar one on its own (e.g. a hello-wave vs. a bye-wave)
// still reads unambiguously. Pass the language the learner ISN'T being
// asked to produce on this screen: if the question wants a German answer,
// caption in their mother tongue; if it wants a mother-tongue answer,
// caption in German.
export function Picture({
  src,
  icon,
  alt,
  caption,
}: {
  src?: string;
  icon?: string;
  alt: string;
  caption?: string;
}) {
  return (
    <div className="mx-auto my-5 flex flex-col items-center gap-2">
      <div className="grid size-36 place-items-center overflow-hidden rounded-[28px] bg-card shadow-inner ring-1 ring-border sm:size-40">
        {src ? (
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <span className="text-7xl" role="img" aria-label={alt}>
            {icon}
          </span>
        )}
      </div>
      {caption && (
        <span className="rounded-full bg-glass px-3 py-1 text-xs font-bold text-ink-soft ring-1 ring-border">
          {caption}
        </span>
      )}
    </div>
  );
}

export function AnswerGrid({
  options,
  selected,
  correct,
  revealed,
  onSelect,
  speak = true,
}: {
  options: string[];
  selected: string | null;
  correct: string;
  revealed: boolean;
  onSelect: (answer: string) => void;
  speak?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <Button
          key={option}
          variant="answer"
          disabled={revealed}
          onClick={() => {
            if (speak) playWord(option);
            onSelect(option);
          }}
          className={cn(
            !revealed && selected === option && "border-primary bg-primary/10",
            revealed &&
              selected === option &&
              option === correct &&
              "border-success bg-success-soft",
            revealed &&
              selected === option &&
              option !== correct &&
              "border-destructive bg-danger-soft",
            revealed && option === correct && "border-success",
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

export function OptionGrid({
  options,
  selected,
  correct,
  revealed,
  onSelect,
  columns = 3,
}: {
  options: string[];
  selected: string | null;
  correct: string;
  revealed: boolean;
  onSelect: (answer: string) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={cn("grid gap-3", columns === 2 ? "grid-cols-2" : "grid-cols-3")}>
      {options.map((option) => (
        <Button
          key={option}
          variant="answer"
          disabled={revealed}
          onClick={() => {
            playWord(option);
            onSelect(option);
          }}
          className={cn(
            !revealed && selected === option && "border-primary bg-primary/10",
            revealed &&
              selected === option &&
              option === correct &&
              "border-success bg-success-soft",
            revealed &&
              selected === option &&
              option !== correct &&
              "border-destructive bg-danger-soft",
            revealed && option === correct && "border-success",
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

export function WordCard({
  t,
  text,
  speak = false,
}: {
  t: Strings;
  text: string;
  speak?: boolean;
}) {
  if (!speak)
    return (
      <div className="mx-auto my-5 grid min-h-32 max-w-xs place-items-center rounded-[28px] bg-card px-6 py-4 text-center font-display text-2xl font-extrabold shadow-inner ring-1 ring-border sm:min-h-36 sm:text-3xl">
        {text}
      </div>
    );
  return (
    <button
      type="button"
      onClick={() => playWord(text)}
      aria-label={t.tapToHear(text)}
      className="mx-auto my-5 flex min-h-32 max-w-xs items-center justify-center gap-2 rounded-[28px] bg-card px-6 py-4 text-center font-display text-2xl font-extrabold shadow-inner ring-1 ring-border transition hover:bg-card/80 sm:min-h-36 sm:text-3xl"
    >
      {text} <Volume2 className="size-6 shrink-0 text-ink-soft" />
    </button>
  );
}

export function LetterOptions({
  options,
  selected,
  correct,
  revealed,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  correct: string;
  revealed: boolean;
  onSelect: (letter: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {options.map((option) => (
        <Button
          key={option}
          variant="tile"
          size="tile"
          disabled={revealed}
          onClick={() => {
            playLetter(option);
            onSelect(option);
          }}
          className={cn(
            !revealed && selected === option && "border-primary bg-primary/10",
            revealed &&
              selected === option &&
              option === correct &&
              "border-success bg-success-soft",
            revealed &&
              selected === option &&
              option !== correct &&
              "border-destructive bg-danger-soft",
            revealed && option === correct && "border-success",
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

export function PictureOptions({
  options,
  selected,
  correct,
  revealed,
  onSelect,
}: {
  options: { id: string; image?: string; icon?: string; label: string }[];
  selected: string | null;
  correct: string;
  revealed: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={revealed}
          onClick={() => onSelect(option.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 overflow-hidden rounded-3xl bg-card ring-2 ring-border transition",
            !revealed && selected === option.id && "ring-primary bg-primary/10",
            revealed &&
              selected === option.id &&
              option.id === correct &&
              "ring-success bg-success-soft",
            revealed &&
              selected === option.id &&
              option.id !== correct &&
              "ring-destructive bg-danger-soft",
            revealed && option.id === correct && "ring-success",
          )}
        >
          <span className="grid aspect-square w-full place-items-center">
            {option.image ? (
              <img src={option.image} alt={option.label} className="size-full object-cover" />
            ) : (
              <span className="text-5xl" role="img" aria-label={option.label}>
                {option.icon}
              </span>
            )}
          </span>
          <span className="px-2 pb-2 text-xs font-bold text-ink-soft">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function LetterBuilder({
  t,
  answerLength,
  tiles,
  letters,
  onTapTile,
  onReset,
  disabled,
  segments,
}: {
  t: Strings;
  answerLength: number;
  tiles: string[];
  letters: number[];
  onTapTile: (index: number, letter: string) => void;
  onReset: () => void;
  disabled: boolean;
  segments?: number[];
}) {
  const groups = segments && segments.length > 0 ? segments : [answerLength];
  let offset = 0;
  const groupRanges = groups.map((len) => {
    const start = offset;
    offset += len;
    return { start, len };
  });
  return (
    <>
      <div className="my-5 flex min-h-14 flex-wrap items-center justify-center gap-3">
        {groupRanges.map(({ start, len }, gi) => (
          <div key={gi} className="flex gap-2">
            {Array.from({ length: len }).map((_, i) => {
              const tileIndex = letters[start + i];
              return (
                <span
                  key={i}
                  className="grid size-12 place-items-center rounded-xl border-2 border-dashed border-ring/50 bg-glass font-display text-xl font-extrabold"
                >
                  {tileIndex !== undefined ? tiles[tileIndex] : ""}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((letter, i) => (
          <Button
            key={`${letter}-${i}`}
            variant="tile"
            size="tile"
            disabled={disabled || letters.includes(i) || letters.length >= answerLength}
            onClick={() => onTapTile(i, letter)}
          >
            {letter}
          </Button>
        ))}
        <Button
          variant="tile"
          size="tile"
          disabled={disabled}
          onClick={onReset}
          aria-label={t.resetLetters}
        >
          <RotateCcw />
        </Button>
      </div>
    </>
  );
}

type MatchWord = { id: string; full: string; image?: string; icon?: string } & Record<
  MotherTongue,
  string
>;

export function MatchPairs<W extends MatchWord>({
  t,
  lang,
  words,
  onComplete,
  onAttempt,
  title = "Lektion geschafft!",
  subtitle,
  actionLabel,
}: {
  t: Strings;
  lang: MotherTongue;
  words: W[];
  onComplete: () => void;
  onAttempt?: (wordId: string, isCorrect: boolean) => void;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
}) {
  const rightOrder = useMemo(() => shuffle(words.map((w) => w.id)), [words]);
  const byId = useMemo(() => Object.fromEntries(words.map((w) => [w.id, w])), [words]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  // Only the first mismatch a word is involved in this round counts against
  // it — repeated mismatches on an already-penalized word don't stack.
  const [failedOnce, setFailedOnce] = useState<Set<string>>(new Set());
  const allMatched = matched.length === words.length;

  useEffect(() => {
    if (!wrong) return;
    const timer = setTimeout(() => setWrong(null), 600);
    return () => clearTimeout(timer);
  }, [wrong]);

  const selectLeft = (id: string) => {
    if (matched.includes(id)) return;
    const word = byId[id];
    if (word) playWord(word.full);
    setSelectedLeft(id);
    setWrong(null);
  };
  const selectRight = (id: string) => {
    if (!selectedLeft || matched.includes(id)) return;
    if (selectedLeft === id) {
      const word = byId[id];
      if (word) playWord(word.full);
      playCorrectSound();
      setMatched((old) => [...old, id]);
      setSelectedLeft(null);
      onAttempt?.(id, true);
    } else {
      playWrongSound();
      setWrong({ left: selectedLeft, right: id });
      setFailedOnce((prev) => {
        const next = new Set(prev);
        for (const missedId of [selectedLeft, id]) {
          if (!next.has(missedId)) {
            onAttempt?.(missedId, false);
            next.add(missedId);
          }
        }
        return next;
      });
      setSelectedLeft(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-3">
          {words.map((w) => (
            <button
              key={w.id}
              type="button"
              disabled={matched.includes(w.id)}
              onClick={() => selectLeft(w.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-2xl bg-card p-3 text-left ring-2 ring-border transition sm:p-4",
                matched.includes(w.id) && "bg-success-soft ring-success opacity-70",
                selectedLeft === w.id && "ring-primary bg-primary/10",
                wrong?.left === w.id && "ring-destructive bg-danger-soft",
              )}
            >
              {w.image ? (
                <img src={w.image} alt={w.full} className="size-8 shrink-0 object-contain" />
              ) : (
                <span className="text-2xl" role="img" aria-label={w.full}>
                  {w.icon}
                </span>
              )}
              <span className="font-display text-sm font-extrabold sm:text-base">{w.full}</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {rightOrder.map((id) => {
            const w = byId[id];
            if (!w) return null;
            return (
              <button
                key={id}
                type="button"
                disabled={matched.includes(id)}
                onClick={() => selectRight(id)}
                className={cn(
                  "w-full rounded-2xl bg-card p-3 text-center ring-2 ring-border transition sm:p-4",
                  matched.includes(id) && "bg-success-soft ring-success opacity-70",
                  wrong?.right === id && "ring-destructive bg-danger-soft",
                )}
              >
                <span className="font-display text-sm font-extrabold sm:text-base">{w[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>
      {allMatched && (
        <div className="animate-pop mt-6 rounded-3xl bg-sun/35 p-5 text-center ring-2 ring-sun">
          <Star className="mx-auto size-10 fill-sun text-foreground" />
          <p className="mt-1 font-display text-2xl font-extrabold">{title}</p>
          {subtitle && <p className="font-bold text-ink-soft">{subtitle}</p>}
          <Button variant="adventure" size="lesson" className="mt-4 w-full" onClick={onComplete}>
            {actionLabel ?? t.backToPath}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ResultCard({
  correct,
  correctText,
  hint,
  actionLabel,
  onAction,
}: {
  correct: boolean;
  correctText: string;
  hint?: string | undefined;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4">
      <div
        className={cn(
          "animate-slide-in-up w-full max-w-3xl rounded-t-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.18)] sm:p-7",
          correct ? "bg-success-soft" : "bg-danger-soft",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full",
              correct ? "bg-success" : "bg-destructive",
            )}
          >
            {correct ? (
              <Check className="text-primary-foreground" />
            ) : (
              <X className="text-primary-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "font-display text-xl font-extrabold",
                correct ? "text-success" : "text-destructive",
              )}
            >
              {correct ? "Richtig!" : "Fast! Versuch's nochmal."}
            </p>
            {correct && <p className="text-sm font-bold text-ink-soft">{correctText}</p>}
            {!correct && hint && <p className="text-sm font-bold text-ink-soft">💡 {hint}</p>}
          </div>
        </div>
        <Button variant="adventure" size="lesson" className="mt-4 w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

export function Continue({
  t,
  onClick,
  disabled,
}: {
  t: Strings;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="adventure"
      size="lesson"
      className="mt-6 w-full"
      disabled={disabled}
      onClick={onClick}
    >
      {t.check}
    </Button>
  );
}
