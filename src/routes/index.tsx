import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Flame, Heart, Lock, RotateCcw, Share, Smartphone, Sparkles, Star, Volume2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PROFILE_KEY = "wortwunder:profile";
type Profile = { name: string; age: string };

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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

type Screen = "home" | "picture" | "build" | "listen";

function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [answer, setAnswer] = useState<string | null>(null);
  const [letters, setLetters] = useState<number[]>([]);
  const [heard, setHeard] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const letterTiles = useMemo(() => ["F", "A", "P", "E", "L", "P"], []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch { /* localStorage unavailable — treat as no saved profile */ }
    setProfileChecked(true);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const saveProfile = (next: Profile) => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch { /* localStorage unavailable — profile still works for this session */ }
    setProfile(next);
  };

  const addToHomeScreen = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else {
      setShowInstallHelp(true);
    }
  };
  const sequence: Screen[] = ["home", "picture", "build", "listen"];
  const step = sequence.indexOf(screen);
  const previousScreen = sequence[Math.max(0, step - 1)] ?? "home";

  const go = (next: Screen) => { setAnswer(null); setLetters([]); setHeard(false); setScreen(next); };
  const startLesson = () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        mozRequestFullScreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };
      const request = root.requestFullscreen ?? root.webkitRequestFullscreen ?? root.mozRequestFullScreen ?? root.msRequestFullscreen;
      try { request?.call(root)?.catch?.(() => {}); } catch { /* fullscreen unsupported (e.g. iOS Safari) — layout still fills the viewport */ }
    }
    go("picture");
  };
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
    <div className="app-sky relative min-h-dvh overflow-hidden text-foreground [padding:env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)]">
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
          <Button variant="ghost" size="icon" onClick={() => go(previousScreen)} aria-label="Previous screen"><ArrowLeft /></Button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-glass ring-1 ring-border"><div className="h-full rounded-full bg-mint transition-all duration-500" style={{ width: `${(step / (sequence.length - 1)) * 100}%` }} /></div>
          <span className="font-display text-sm font-bold">{step}/{sequence.length - 1}</span>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        {screen === "home" && <Home onStart={startLesson} name={profile?.name} showInstall={!installed} onAddToHomeScreen={addToHomeScreen} />}
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

      {profileChecked && !profile && <Onboarding onSubmit={saveProfile} />}
      {showInstallHelp && <InstallHelp onClose={() => setShowInstallHelp(false)} />}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <span className="glass-panel flex items-center gap-1.5 rounded-full px-2.5 py-2 sm:px-3" aria-label={`${value} ${label}`}><span className="[&_svg]:size-4">{icon}</span><span className="font-display text-sm font-bold">{value}</span></span>;
}

function Home({ onStart, name, showInstall, onAddToHomeScreen }: { onStart: () => void; name?: string | undefined; showInstall: boolean; onAddToHomeScreen: () => void }) {
  const levels = [
    { icon: <Check />, title: "Hallo!", detail: "Complete · 30 XP", state: "done" },
    { icon: "🐕", title: "Tiere", detail: "8 words · Start here", state: "active" },
    { icon: "🍎", title: "Essen", detail: "8 words · Locked", state: "locked" },
    { icon: "📘", title: "Zu Hause", detail: "8 words · Locked", state: "locked" },
  ];
  return <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
    <section className="glass-panel rounded-[28px] p-5 sm:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div className="min-w-0"><p className="text-sm font-extrabold text-ink-soft">Hallo, {name || "Freund"}!</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Dein Lernweg</h1><p className="mt-1 font-bold text-ink-soft">Ready for a little German adventure?</p></div><div className="animate-bob grid size-20 shrink-0 place-items-center rounded-3xl bg-sun/40 text-5xl ring-2 ring-border">🦉</div></div>
      <div className="relative mx-auto mt-7 max-w-lg space-y-4 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-2 before:rounded-full before:bg-ice">
        {levels.map((level, index) => <button key={level.title} disabled={level.state === "locked"} onClick={level.state === "active" ? onStart : undefined} className={cn("relative grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 text-left", index % 2 === 1 && "sm:translate-x-10")}><span className={cn("z-10 grid size-14 place-items-center rounded-full border-4 border-frost text-2xl shadow-md [&_svg]:size-6", level.state === "done" && "bg-mint", level.state === "active" && "animate-bob bg-sun", level.state === "locked" && "bg-ice text-ink-soft")}>{level.state === "locked" ? <Lock className="size-5" /> : level.icon}</span><span className={cn("rounded-2xl p-4 ring-1 ring-border", level.state === "active" ? "bg-sun/30 ring-2 ring-sun" : "bg-card", level.state === "locked" && "opacity-65")}><span className="block font-display text-lg font-extrabold">{level.title}</span><span className="block text-xs font-bold text-ink-soft">{level.detail}</span></span></button>)}
      </div>
    </section>
    <aside className="space-y-5">
      <section className="glass-panel rounded-[28px] p-5"><p className="text-sm font-extrabold text-ink-soft">TODAY'S GOAL</p><div className="mt-2 flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-mint/35"><Sparkles className="size-8" /></div><div className="min-w-0 flex-1"><p className="font-display text-xl font-extrabold">10 of 20 XP</p><div className="mt-2 h-3 overflow-hidden rounded-full bg-ice"><div className="h-full w-1/2 rounded-full bg-mint" /></div></div></div></section>
      <Button variant="adventure" size="lesson" className="w-full" onClick={onStart}>Start lesson <Zap /></Button>
      {showInstall && <Button variant="outline" size="lesson" className="w-full rounded-2xl border-2 border-border bg-card font-display font-extrabold" onClick={onAddToHomeScreen}><Smartphone /> Add to Home Screen</Button>}
    </aside>
  </div>;
}

function Onboarding({ onSubmit }: { onSubmit: (profile: Profile) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const valid = name.trim().length > 0 && Number(age) > 0;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ name: name.trim(), age: age.trim() }); }} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 sm:p-7">
      <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-sun/40 text-4xl ring-2 ring-border">🦉</div>
      <h2 className="mt-4 text-center font-display text-2xl font-extrabold">Wer bist du?</h2>
      <p className="mt-1 text-center font-bold text-ink-soft">Tell us your name and age to start learning!</p>
      <div className="mt-6 space-y-3">
        <div>
          <label htmlFor="onboarding-name" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Name</label>
          <Input id="onboarding-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leni" autoFocus className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
        <div>
          <label htmlFor="onboarding-age" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Age</label>
          <Input id="onboarding-age" type="number" min={1} max={17} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 7" className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
      </div>
      <Button type="submit" variant="adventure" size="lesson" className="mt-6 w-full" disabled={!valid}>Los geht's!</Button>
    </form>
  </div>;
}

function InstallHelp({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 text-center sm:p-7">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-mint/35"><Share className="size-7" /></div>
      <h2 className="mt-4 font-display text-xl font-extrabold">Add to Home Screen</h2>
      <p className="mt-2 font-bold text-ink-soft">Tap your browser's <span className="inline-flex items-center gap-1 align-middle"><Share className="size-4" /> Share</span> button, then choose "Add to Home Screen".</p>
      <Button variant="adventure" size="lesson" className="mt-6 w-full" onClick={onClose}>Got it</Button>
    </div>
  </div>;
}

function LessonFrame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) { return <section className="glass-panel mx-auto max-w-3xl rounded-[28px] p-5 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p><h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{title}</h1><p className="font-bold text-ink-soft">{subtitle}</p><div className="mt-6">{children}</div></section>; }
function Picture({ emoji }: { emoji: string }) { return <div className="mx-auto my-5 grid size-36 place-items-center rounded-[28px] bg-card text-7xl shadow-inner ring-1 ring-border sm:size-40">{emoji}</div>; }
function AnswerGrid({ options, selected, correct, onSelect }: { options: string[]; selected: string | null; correct: string; onSelect: (answer: string) => void }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((option) => <Button key={option} variant="answer" onClick={() => onSelect(option)} className={cn(selected === option && option === correct && "border-success bg-success-soft", selected === option && option !== correct && "border-destructive bg-danger-soft", selected && option === correct && "border-success")}>{option}</Button>)}</div>; }
function Feedback({ correct, correctText }: { correct: boolean; correctText: string }) { return <div className={cn("animate-pop mt-4 flex items-center gap-3 rounded-2xl p-4 ring-1", correct ? "bg-success-soft ring-success" : "bg-danger-soft ring-destructive")}><span className={cn("grid size-9 shrink-0 place-items-center rounded-full", correct ? "bg-success" : "bg-destructive")}>{correct ? <Check className="text-primary-foreground" /> : <RotateCcw className="text-primary-foreground" />}</span><div><p className="font-display text-lg font-extrabold">{correct ? "Richtig!" : "Fast! Try again."}</p>{correct && <p className="text-sm font-bold text-ink-soft">{correctText}</p>}</div></div>; }
function Continue({ onClick, disabled, label = "Weiter" }: { onClick: () => void; disabled?: boolean; label?: string }) { return <Button variant="adventure" size="lesson" className="mt-6 w-full" disabled={disabled} onClick={onClick}>{label}</Button>; }
