import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Flame, Heart, Lock, RotateCcw, Share, Smartphone, SquarePlus, Sparkles, Star, Trash2, Volume2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { playLetter, playWord } from "@/lib/word-audio";

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
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const letterTiles = useMemo(() => ["G", "V", "O", "L", "E", "O"], []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch { /* localStorage unavailable — treat as no saved profile */ }
    setProfileChecked(true);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    const w = window as Window & { __bip?: InstallPromptEvent | null };
    const pickUpPrompt = () => { if (w.__bip) setInstallPrompt(w.__bip); };
    pickUpPrompt();
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("bip-ready", pickUpPrompt);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    try {
      const redirectUrl = new URL(window.location.href);
      if (redirectUrl.searchParams.get("install") === "1") {
        redirectUrl.searchParams.delete("install");
        window.history.replaceState({}, "", redirectUrl.pathname + redirectUrl.search + redirectUrl.hash);
        setShowInstallHelp(true);
      }
    } catch { /* URL parsing failed — skip the auto-reopen, rest of the app still works */ }

    return () => {
      window.removeEventListener("bip-ready", pickUpPrompt);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const saveProfile = (next: Profile) => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch { /* localStorage unavailable — profile still works for this session */ }
    setProfile(next);
  };

  const clearAllData = () => {
    try { localStorage.clear(); } catch { /* localStorage unavailable — nothing to clear */ }
    setProfile(null);
    setShowClearConfirm(false);
    setShowProfileMenu(false);
    go("home");
  };

  const addToHomeScreen = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      (window as Window & { __bip?: InstallPromptEvent | null }).__bip = null;
      setInstallPrompt(null);
      return;
    }
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (isIOS) setShowInstallHelp(true);
  };
  const sequence: Screen[] = ["home", "picture", "build", "listen"];
  const step = sequence.indexOf(screen);
  const previousScreen = sequence[Math.max(0, step - 1)] ?? "home";

  const go = (next: Screen) => { setAnswer(null); setLetters([]); setHeard(false); setChecked(false); setAttempts(0); setScreen(next); };
  const checkAnswer = (isCorrect: boolean) => { setChecked(true); if (!isCorrect) setAttempts((a) => a + 1); };
  const retry = () => { setChecked(false); setAnswer(null); };
  const retryBuild = () => { setChecked(false); setLetters([]); };
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
    playWord("der Vogel");
  };

  return (
    <div className="app-sky relative min-h-dvh overflow-hidden text-foreground [padding:env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)]">
      <header className="relative z-20 mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => setShowProfileMenu(true)} className="glass-panel grid size-11 shrink-0 place-items-center rounded-2xl text-2xl" aria-label="Open profile menu">🦉</button>
          <button onClick={() => go("home")} className="min-w-0 text-left" aria-label="Go to learning path">
            <span className="block truncate font-display text-xl font-extrabold leading-none">WortWunder</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">{profile?.name || "Freund"}</span>
          </button>
        </div>
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
          <AnswerGrid options={["der Hund", "der Vogel", "das Pferd", "die Katze"]} selected={answer} correct="der Vogel" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue label="Check" disabled={!answer} onClick={() => checkAnswer(answer === "der Vogel")} />}
        </LessonFrame>}
        {screen === "build" && <LessonFrame eyebrow="Word builder" title="Baue das Wort" subtitle="Tap the letters to spell Vogel.">
          <Picture emoji="🐦" />
          <div className="my-5 flex min-h-14 flex-wrap justify-center gap-2">{[0,1,2,3,4].map((i) => <span key={i} className="grid size-12 place-items-center rounded-xl border-2 border-dashed border-ring/50 bg-glass font-display text-xl font-extrabold">{letters[i] !== undefined ? letterTiles[letters[i]] : ""}</span>)}</div>
          <div className="flex flex-wrap justify-center gap-2">{letterTiles.map((letter, i) => <Button key={`${letter}-${i}`} variant="tile" size="tile" disabled={checked || letters.includes(i) || letters.length >= 5} onClick={() => { playLetter(letter); setLetters((old) => [...old, i]); }}>{letter}</Button>)}<Button variant="tile" size="tile" disabled={checked} onClick={() => setLetters([])} aria-label="Reset letters"><RotateCcw /></Button></div>
          {!checked && <Continue label="Check" disabled={letters.length !== 5} onClick={() => checkAnswer(letters.map((i) => letterTiles[i]).join("") === "VOGEL")} />}
        </LessonFrame>}
        {screen === "listen" && <LessonFrame eyebrow="Listening challenge" title="Was hörst du?" subtitle="Listen, then choose the word you hear.">
          <div className="my-5 flex justify-center"><Button onClick={speak} className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none" aria-label="Play German word"><Volume2 className="size-10" /></Button></div>
          {heard && <p className="mb-4 text-center text-sm font-bold text-ink-soft">Listen again as many times as you like.</p>}
          <AnswerGrid options={["der Hund", "der Vogel", "das Pferd", "die Katze"]} selected={answer} correct="der Vogel" revealed={checked} onSelect={setAnswer} />
          {checked && answer === "der Vogel" && <div className="animate-pop mt-5 rounded-3xl bg-sun/35 p-5 text-center ring-2 ring-sun"><Star className="mx-auto size-10 fill-sun text-foreground" /><p className="mt-1 font-display text-2xl font-extrabold">Lektion geschafft!</p><p className="font-bold text-ink-soft">+25 XP · Your 5 day streak continues!</p></div>}
          {!checked && <Continue label="Check" disabled={!answer} onClick={() => checkAnswer(answer === "der Vogel")} />}
        </LessonFrame>}

        {checked && screen === "picture" && <ResultCard correct={answer === "der Vogel"} correctText="der Vogel means the bird!" hint={attempts >= 2 ? "Hint: this animal has feathers and loves to sing." : undefined} actionLabel={answer === "der Vogel" ? "Weiter" : "Try again"} onAction={answer === "der Vogel" ? () => go("build") : retry} />}
        {checked && screen === "build" && <ResultCard correct={letters.map((i) => letterTiles[i]).join("") === "VOGEL"} correctText="der Vogel means the bird!" hint={attempts >= 2 ? "Hint: this animal has feathers and loves to sing." : undefined} actionLabel={letters.map((i) => letterTiles[i]).join("") === "VOGEL" ? "Weiter" : "Try again"} onAction={letters.map((i) => letterTiles[i]).join("") === "VOGEL" ? () => go("listen") : retryBuild} />}
        {checked && screen === "listen" && <ResultCard correct={answer === "der Vogel"} correctText="der Vogel means the bird!" hint={attempts >= 2 ? "Hint: this animal has feathers and loves to sing." : undefined} actionLabel={answer === "der Vogel" ? "Back to my path" : "Try again"} onAction={answer === "der Vogel" ? () => go("home") : retry} />}
      </main>

      {profileChecked && !profile && <Onboarding onSubmit={saveProfile} />}
      {showInstallHelp && <InstallHelp onClose={() => setShowInstallHelp(false)} />}
      {showProfileMenu && <ProfileMenu profile={profile} onClose={() => setShowProfileMenu(false)} onSave={(next) => { saveProfile(next); setShowProfileMenu(false); }} onRequestClear={() => setShowClearConfirm(true)} />}
      {showClearConfirm && <ClearConfirm onCancel={() => setShowClearConfirm(false)} onConfirm={clearAllData} />}
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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div className="min-w-0"><p className="text-sm font-extrabold text-ink-soft">Hallo, {name || "Freund"}!</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Dein Lernweg</h1><p className="mt-1 font-bold text-ink-soft">Ready for a little German adventure?</p>{showInstall && <Button variant="outline" size="sm" className="mt-3 rounded-xl border-2 border-border bg-card font-display font-extrabold" onClick={onAddToHomeScreen}><Smartphone /> Add to Home Screen</Button>}</div><div className="animate-bob grid size-20 shrink-0 place-items-center rounded-3xl bg-sun/40 text-5xl ring-2 ring-border">🦉</div></div>
      <div className="relative mx-auto mt-7 max-w-lg space-y-4 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-2 before:rounded-full before:bg-ice">
        {levels.map((level, index) => <button key={level.title} disabled={level.state === "locked"} onClick={level.state === "active" ? onStart : undefined} className={cn("relative grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 text-left", index % 2 === 1 && "sm:translate-x-10")}><span className={cn("z-10 grid size-14 place-items-center rounded-full border-4 border-frost text-2xl shadow-md [&_svg]:size-6", level.state === "done" && "bg-mint", level.state === "active" && "animate-bob bg-sun", level.state === "locked" && "bg-ice text-ink-soft")}>{level.state === "locked" ? <Lock className="size-5" /> : level.icon}</span><span className={cn("rounded-2xl p-4 ring-1 ring-border", level.state === "active" ? "bg-sun/30 ring-2 ring-sun" : "bg-card", level.state === "locked" && "opacity-65")}><span className="block font-display text-lg font-extrabold">{level.title}</span><span className="block text-xs font-bold text-ink-soft">{level.detail}</span></span></button>)}
      </div>
    </section>
    <aside className="space-y-5">
      <section className="glass-panel rounded-[28px] p-5"><p className="text-sm font-extrabold text-ink-soft">TODAY'S GOAL</p><div className="mt-2 flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-mint/35"><Sparkles className="size-8" /></div><div className="min-w-0 flex-1"><p className="font-display text-xl font-extrabold">10 of 20 XP</p><div className="mt-2 h-3 overflow-hidden rounded-full bg-ice"><div className="h-full w-1/2 rounded-full bg-mint" /></div></div></div></section>
      <Button variant="adventure" size="lesson" className="w-full" onClick={onStart}>Start lesson <Zap /></Button>
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
          <Input id="onboarding-age" type="number" min={1} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 7" className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
      </div>
      <Button type="submit" variant="adventure" size="lesson" className="mt-6 w-full" disabled={!valid}>Los geht's!</Button>
    </form>
  </div>;
}

function ProfileMenu({ profile, onClose, onSave, onRequestClear }: { profile: Profile | null; onClose: () => void; onSave: (profile: Profile) => void; onRequestClear: () => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age ?? "");
  const valid = name.trim().length > 0 && Number(age) > 0;
  return <div className="fixed inset-0 z-50 flex bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="animate-slide-in-left glass-panel flex h-full w-full max-w-xs flex-col rounded-r-[28px] bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-sun/40 text-2xl ring-2 ring-border">🦉</div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu"><X /></Button>
      </div>
      <h2 className="mt-4 font-display text-xl font-extrabold">About me</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="profile-name" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Name</label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
        <div>
          <label htmlFor="profile-age" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">Age</label>
          <Input id="profile-age" type="number" min={1} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
      </div>
      <Button variant="adventure" size="lesson" className="mt-4 w-full" disabled={!valid} onClick={() => onSave({ name: name.trim(), age: age.trim() })}>Save</Button>

      <div className="mt-auto border-t border-border pt-4">
        <Button variant="outline" className="w-full rounded-2xl border-2 border-destructive text-destructive hover:bg-danger-soft" onClick={onRequestClear}><Trash2 className="size-4" /> Clear all my data</Button>
      </div>
    </div>
  </div>;
}

function ClearConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 text-center sm:p-7">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-danger-soft"><Trash2 className="size-7 text-destructive" /></div>
      <h2 className="mt-4 font-display text-xl font-extrabold">Delete everything?</h2>
      <p className="mt-2 font-bold text-ink-soft">This will erase your name, age, and progress. You can't undo this.</p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1 rounded-2xl" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" className="flex-1 rounded-2xl" onClick={onConfirm}>Yes, delete</Button>
      </div>
    </div>
  </div>;
}

function InstallHelp({ onClose }: { onClose: () => void }) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const safariLink = (() => {
    if (typeof window === "undefined") return "#";
    const url = new URL(window.location.href);
    url.searchParams.set("install", "1");
    return url.toString().replace(/^https?:\/\//, (m) => `x-safari-${m}`);
  })();

  const steps: { icon: React.ReactNode; text: React.ReactNode; href?: string }[] = [
    ...(!isSafari ? [{ icon: <ExternalLink />, text: <>Open this page in <strong>Safari</strong> — tap the button below.</>, href: safariLink }] : []),
    { icon: <Share />, text: <>Tap the <strong>Share</strong> button (square with an arrow ⬆️) at the bottom of the screen.</> },
    { icon: <SquarePlus />, text: <>Scroll down the menu and tap <strong>"Add to Home Screen"</strong>.</> },
    { icon: <Check />, text: <>Tap <strong>"Add"</strong> in the top-right corner.</> },
    { icon: <Smartphone />, text: <>Find the WortWunder icon on your Home Screen and tap it to play!</> },
  ];

  return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 sm:p-7">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-mint/35"><Smartphone className="size-7" /></div>
      <h2 className="mt-4 text-center font-display text-xl font-extrabold">Add to Home Screen</h2>
      <p className="mt-1 text-center font-bold text-ink-soft">Follow these steps with a grown-up!</p>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => <li key={index} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sun/40 font-display text-base font-extrabold ring-2 ring-border">{index + 1}</span>
          <div className="rounded-2xl bg-glass p-3 ring-1 ring-border">
            <p className="flex items-start gap-1.5 text-sm font-bold leading-snug"><span className="mt-0.5 shrink-0 text-ink-soft [&_svg]:size-4">{step.icon}</span><span>{step.text}</span></p>
            {step.href && <a href={step.href} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-display text-sm font-extrabold text-primary-foreground">Open in Safari <ExternalLink className="size-4" /></a>}
          </div>
        </li>)}
      </ol>
      <Button variant="adventure" size="lesson" className="mt-6 w-full" onClick={onClose}>Got it</Button>
    </div>
  </div>;
}

function LessonFrame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) { return <section className="glass-panel mx-auto max-w-3xl rounded-[28px] p-5 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p><h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{title}</h1><p className="font-bold text-ink-soft">{subtitle}</p><div className="mt-6">{children}</div></section>; }
function Picture({ emoji }: { emoji: string }) { return <div className="mx-auto my-5 grid size-36 place-items-center rounded-[28px] bg-card text-7xl shadow-inner ring-1 ring-border sm:size-40">{emoji}</div>; }
function AnswerGrid({ options, selected, correct, revealed, onSelect }: { options: string[]; selected: string | null; correct: string; revealed: boolean; onSelect: (answer: string) => void }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((option) => <Button key={option} variant="answer" disabled={revealed} onClick={() => { playWord(option); onSelect(option); }} className={cn(!revealed && selected === option && "border-primary bg-primary/10", revealed && selected === option && option === correct && "border-success bg-success-soft", revealed && selected === option && option !== correct && "border-destructive bg-danger-soft", revealed && option === correct && "border-success")}>{option}</Button>)}</div>; }
function ResultCard({ correct, correctText, hint, actionLabel, onAction }: { correct: boolean; correctText: string; hint?: string | undefined; actionLabel: string; onAction: () => void }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4">
    <div className={cn("animate-slide-in-up w-full max-w-3xl rounded-t-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.18)] sm:p-7", correct ? "bg-success-soft" : "bg-danger-soft")}>
      <div className="flex items-center gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", correct ? "bg-success" : "bg-destructive")}>{correct ? <Check className="text-primary-foreground" /> : <X className="text-primary-foreground" />}</span>
        <div className="min-w-0">
          <p className={cn("font-display text-xl font-extrabold", correct ? "text-success" : "text-destructive")}>{correct ? "Richtig!" : "Fast! Versuch's nochmal."}</p>
          {correct && <p className="text-sm font-bold text-ink-soft">{correctText}</p>}
          {!correct && hint && <p className="text-sm font-bold text-ink-soft">💡 {hint}</p>}
        </div>
      </div>
      <Button variant="adventure" size="lesson" className="mt-4 w-full" onClick={onAction}>{actionLabel}</Button>
    </div>
  </div>;
}
function Continue({ onClick, disabled, label = "Weiter" }: { onClick: () => void; disabled?: boolean; label?: string }) { return <Button variant="adventure" size="lesson" className="mt-6 w-full" disabled={disabled} onClick={onClick}>{label}</Button>; }
