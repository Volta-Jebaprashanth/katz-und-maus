import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Flame, Heart, Lock, RotateCcw, Sparkles, Star, Volume2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "WortWunder — German vocabulary for kids" },
    { name: "description", content: "Learn beginner German words through playful picture, spelling, and listening lessons." },
    { property: "og:title", content: "WortWunder — German vocabulary for kids" },
    { property: "og:description", content: "A playful German vocabulary adventure for young learners." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

type Screen = "home" | "vocab" | "picture" | "build" | "listen";
const words = [
  { german: "der Hund", english: "the dog", emoji: "🐕", tint: "bg-sun/30" },
  { german: "die Katze", english: "the cat", emoji: "🐈", tint: "bg-berry/20" },
  { german: "der Vogel", english: "the bird", emoji: "🐦", tint: "bg-ice/70" },
  { german: "das Pferd", english: "the horse", emoji: "🐎", tint: "bg-mint/30" },
  { german: "der Apfel", english: "the apple", emoji: "🍎", tint: "bg-berry/20" },
  { german: "die Banane", english: "the banana", emoji: "🍌", tint: "bg-sun/30" },
  { german: "das Buch", english: "the book", emoji: "📘", tint: "bg-ice/70" },
  { german: "das Wasser", english: "the water", emoji: "💧", tint: "bg-mint/30" },
];

function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [answer, setAnswer] = useState<string | null>(null);
  const [letters, setLetters] = useState<number[]>([]);
  const [heard, setHeard] = useState(false);
  const letterTiles = useMemo(() => ["F", "A", "P", "E", "L", "P"], []);
  const sequence: Screen[] = ["home", "vocab", "picture", "build", "listen"];
  const step = sequence.indexOf(screen);

  const go = (next: Screen) => { setAnswer(null); setLetters([]); setHeard(false); setScreen(next); };
  const speak = () => {
    setHeard(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("das Buch");
      utterance.lang = "de-DE";
      utterance.rate = 0.78;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="app-sky relative min-h-screen overflow-hidden text-foreground">
      <header className="relative z-20 mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
        <button onClick={() => go("home")} className="flex min-w-0 items-center gap-2 text-left" aria-label="Go to learning path">
          <span className="glass-panel grid size-11 shrink-0 place-items-center rounded-2xl text-2xl">🦉</span>
          <span className="min-w-0"><span className="block truncate font-display text-xl font-extrabold leading-none">WortWunder</span><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">Little German</span></span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Stat icon={<Flame />} value="5" label="day streak" />
          <Stat icon={<Zap />} value="240" label="experience points" />
          <span className="hidden sm:block"><Stat icon={<Heart />} value="3" label="hearts" /></span>
        </div>
      </header>

      {screen !== "home" && (
        <div className="relative z-10 mx-auto flex max-w-3xl items-center gap-3 px-4 pb-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => go(sequence[Math.max(0, step - 1)])} aria-label="Previous screen"><ArrowLeft /></Button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-glass ring-1 ring-border"><div className="h-full rounded-full bg-mint transition-all duration-500" style={{ width: `${step * 25}%` }} /></div>
          <span className="font-display text-sm font-bold">{step}/4</span>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        {screen === "home" && <Home onStart={() => go("vocab")} />}
        {screen === "vocab" && <LessonFrame eyebrow="Meet your new words" title="Neue Wörter" subtitle="Tap each picture and say it out loud.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{words.map((word) => <div key={word.german} className="rounded-2xl bg-card p-3 text-center shadow-sm ring-1 ring-border"><div className={cn("mx-auto mb-2 grid aspect-square max-w-24 place-items-center rounded-2xl text-5xl", word.tint)}>{word.emoji}</div><p className="font-display text-base font-extrabold sm:text-lg">{word.german}</p><p className="text-xs font-bold text-ink-soft">{word.english}</p></div>)}</div>
          <Continue onClick={() => go("picture")} />
        </LessonFrame>}
        {screen === "picture" && <LessonFrame eyebrow="Picture challenge" title="Was ist das?" subtitle="Choose the German word for this picture.">
          <Picture emoji="🐦" />
          <AnswerGrid options={["der Hund", "der Vogel", "das Pferd", "die Katze"]} selected={answer} correct="der Vogel" onSelect={setAnswer} />
          {answer && <Feedback correct={answer === "der Vogel"} correctText="der Vogel means the bird!" />}
          <Continue disabled={answer !== "der Vogel"} onClick={() => go("build")} />
        </LessonFrame>}
        {screen === "build" && <LessonFrame eyebrow="Word builder" title="Baue das Wort" subtitle="Tap the letters to spell Apfel.">
          <Picture emoji="🍎" />
          <div className="my-5 flex min-h-14 flex-wrap justify-center gap-2">{[0,1,2,3,4].map((i) => <span key={i} className="grid size-12 place-items-center rounded-xl border-2 border-dashed border-ring/50 bg-glass font-display text-xl font-extrabold">{letters[i] !== undefined ? letterTiles[letters[i]] : ""}</span>)}</div>
          <div className="flex flex-wrap justify-center gap-2">{letterTiles.map((letter, i) => <Button key={`${letter}-${i}`} variant="tile" size="tile" disabled={letters.includes(i) || letters.length >= 5} onClick={() => setLetters((old) => [...old, i])}>{letter}</Button>)}<Button variant="tile" size="tile" onClick={() => setLetters([])} aria-label="Reset letters"><RotateCcw /></Button></div>
          {letters.length === 5 && <Feedback correct={letters.map((i) => letterTiles[i]).join("") === "APFEL"} correctText="Apfel means apple!" />}
          <Continue disabled={letters.map((i) => letterTiles[i]).join("") !== "APFEL"} onClick={() => go("listen")} />
        </LessonFrame>}
        {screen === "listen" && <LessonFrame eyebrow="Listening challenge" title="Was hörst du?" subtitle="Listen, then choose the word you hear.">
          <div className="my-5 flex justify-center"><Button onClick={speak} className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none" aria-label="Play German word"><Volume2 className="size-10" /></Button></div>
          {heard && <p className="mb-4 text-center text-sm font-bold text-ink-soft">Listen again as many times as you like.</p>}
          <AnswerGrid options={["das Wasser", "das Buch", "die Banane", "der Apfel"]} selected={answer} correct="das Buch" onSelect={setAnswer} />
          {answer && <Feedback correct={answer === "das Buch"} correctText="das Buch means the book!" />}
          {answer === "das Buch" && <div className="animate-pop mt-5 rounded-3xl bg-sun/35 p-5 text-center ring-2 ring-sun"><Star className="mx-auto size-10 fill-sun text-foreground" /><p className="mt-1 font-display text-2xl font-extrabold">Lektion geschafft!</p><p className="font-bold text-ink-soft">+25 XP · Your 5 day streak continues!</p></div>}
          <Continue label="Back to my path" disabled={answer !== "das Buch"} onClick={() => go("home")} />
        </LessonFrame>}
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <span className="glass-panel flex items-center gap-1.5 rounded-full px-2.5 py-2 sm:px-3" aria-label={`${value} ${label}`}><span className="[&_svg]:size-4">{icon}</span><span className="font-display text-sm font-bold">{value}</span></span>;
}

function Home({ onStart }: { onStart: () => void }) {
  const levels = [
    { icon: <Check />, title: "Hallo!", detail: "Complete · 30 XP", state: "done" },
    { icon: "🐕", title: "Tiere", detail: "8 words · Start here", state: "active" },
    { icon: "🍎", title: "Essen", detail: "8 words · Locked", state: "locked" },
    { icon: "📘", title: "Zu Hause", detail: "8 words · Locked", state: "locked" },
  ];
  return <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
    <section className="glass-panel rounded-[28px] p-5 sm:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div className="min-w-0"><p className="text-sm font-extrabold text-ink-soft">Hallo, Leni!</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Dein Lernweg</h1><p className="mt-1 font-bold text-ink-soft">Ready for a little German adventure?</p></div><div className="animate-bob grid size-20 shrink-0 place-items-center rounded-3xl bg-sun/40 text-5xl ring-2 ring-border">🦉</div></div>
      <div className="relative mx-auto mt-7 max-w-lg space-y-4 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-2 before:rounded-full before:bg-ice">
        {levels.map((level, index) => <button key={level.title} disabled={level.state === "locked"} onClick={level.state === "active" ? onStart : undefined} className={cn("relative grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 text-left", index % 2 === 1 && "sm:translate-x-10")}><span className={cn("z-10 grid size-14 place-items-center rounded-full border-4 border-frost text-2xl shadow-md [&_svg]:size-6", level.state === "done" && "bg-mint", level.state === "active" && "animate-bob bg-sun", level.state === "locked" && "bg-ice text-ink-soft")}>{level.state === "locked" ? <Lock className="size-5" /> : level.icon}</span><span className={cn("rounded-2xl p-4 ring-1 ring-border", level.state === "active" ? "bg-sun/30 ring-2 ring-sun" : "bg-card", level.state === "locked" && "opacity-65")}><span className="block font-display text-lg font-extrabold">{level.title}</span><span className="block text-xs font-bold text-ink-soft">{level.detail}</span></span></button>)}
      </div>
    </section>
    <aside className="space-y-5">
      <section className="glass-panel rounded-[28px] p-5"><p className="text-sm font-extrabold text-ink-soft">TODAY'S GOAL</p><div className="mt-2 flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-mint/35"><Sparkles className="size-8" /></div><div className="min-w-0 flex-1"><p className="font-display text-xl font-extrabold">10 of 20 XP</p><div className="mt-2 h-3 overflow-hidden rounded-full bg-ice"><div className="h-full w-1/2 rounded-full bg-mint" /></div></div></div></section>
      <section className="glass-panel rounded-[28px] p-5"><p className="font-display text-xl font-extrabold">Your treasures</p><div className="mt-4 grid grid-cols-3 gap-2"><Reward icon="⚡" value="240" label="Total XP" /><Reward icon="🔥" value="5" label="Day streak" /><Reward icon="❤️" value="3" label="Hearts" /></div></section>
      <Button variant="adventure" size="lesson" className="w-full" onClick={onStart}>Start animal lesson <Zap /></Button>
    </aside>
  </div>;
}

function Reward({ icon, value, label }: { icon: string; value: string; label: string }) { return <div className="rounded-2xl bg-card p-3 text-center ring-1 ring-border"><span className="text-2xl">{icon}</span><p className="font-display text-lg font-extrabold">{value}</p><p className="text-[10px] font-extrabold text-ink-soft">{label}</p></div>; }
function LessonFrame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) { return <section className="glass-panel mx-auto max-w-3xl rounded-[28px] p-5 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p><h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{title}</h1><p className="font-bold text-ink-soft">{subtitle}</p><div className="mt-6">{children}</div></section>; }
function Picture({ emoji }: { emoji: string }) { return <div className="mx-auto my-5 grid size-36 place-items-center rounded-[28px] bg-card text-7xl shadow-inner ring-1 ring-border sm:size-40">{emoji}</div>; }
function AnswerGrid({ options, selected, correct, onSelect }: { options: string[]; selected: string | null; correct: string; onSelect: (answer: string) => void }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((option) => <Button key={option} variant="answer" onClick={() => onSelect(option)} className={cn(selected === option && option === correct && "border-success bg-success-soft", selected === option && option !== correct && "border-destructive bg-danger-soft", selected && option === correct && "border-success")}>{option}</Button>)}</div>; }
function Feedback({ correct, correctText }: { correct: boolean; correctText: string }) { return <div className={cn("animate-pop mt-4 flex items-center gap-3 rounded-2xl p-4 ring-1", correct ? "bg-success-soft ring-success" : "bg-danger-soft ring-destructive")}><span className={cn("grid size-9 shrink-0 place-items-center rounded-full", correct ? "bg-success" : "bg-destructive")}>{correct ? <Check className="text-primary-foreground" /> : <RotateCcw className="text-primary-foreground" />}</span><div><p className="font-display text-lg font-extrabold">{correct ? "Richtig!" : "Fast! Try again."}</p>{correct && <p className="text-sm font-bold text-ink-soft">{correctText}</p>}</div></div>; }
function Continue({ onClick, disabled, label = "Weiter" }: { onClick: () => void; disabled?: boolean; label?: string }) { return <Button variant="adventure" size="lesson" className="mt-6 w-full" disabled={disabled} onClick={onClick}>{label}</Button>; }
