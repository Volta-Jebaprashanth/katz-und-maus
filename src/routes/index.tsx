import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Flame, Heart, Lock, RotateCcw, Share, Smartphone, SquarePlus, Sparkles, Star, Trash2, Volume2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { playLetter, playWord } from "@/lib/word-audio";
import { TIERE_WORDS, type VocabWord } from "@/data/vocabulary";
import { MOTHER_TONGUES, TRANSLATIONS, type MotherTongue, type Strings } from "@/lib/i18n";

const PROFILE_KEY = "wortwunder:profile";
type Profile = { name: string; age: string; motherTongue: MotherTongue };

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

type Screen = "home" | "picture" | "wordPicture" | "meaning" | "translate" | "article" | "build" | "missing" | "unscramble" | "listen" | "listenPicture" | "listenBuild" | "match";

function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [answer, setAnswer] = useState<string | null>(null);
  const [letters, setLetters] = useState<number[]>([]);
  const [heard, setHeard] = useState(false);
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const lang: MotherTongue = profile?.motherTongue ?? "english";
  const t = TRANSLATIONS[lang];
  const letterTiles = useMemo(() => ["G", "V", "O", "L", "E", "O"], []);
  const unscrambleTiles = useMemo(() => ["L", "O", "G", "E", "V"], []);
  const listenBuildTiles = useMemo(() => ["E", "V", "L", "O", "G"], []);
  const missingLetterOptions = useMemo(() => ["O", "A", "U", "I"], []);
  const vogel = useMemo(() => TIERE_WORDS.find((w) => w.id === "vogel")!, []);
  const meaningOptions = useMemo(() => TIERE_WORDS.map((w) => w[lang]), [lang]);
  const translateOptions = useMemo(() => TIERE_WORDS.map((w) => w.full), []);
  const pictureOptions = useMemo(() => TIERE_WORDS.map((w) => ({ id: w.id, image: w.image, label: w[lang] })), [lang]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Profile>;
        setProfile({ name: parsed.name ?? "", age: parsed.age ?? "", motherTongue: parsed.motherTongue ?? "english" });
      }
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
  const sequence: Screen[] = ["home", "picture", "wordPicture", "meaning", "translate", "article", "build", "missing", "unscramble", "listen", "listenPicture", "listenBuild", "match"];
  const step = sequence.indexOf(screen);
  const previousScreen = sequence[Math.max(0, step - 1)] ?? "home";

  const go = (next: Screen) => { setAnswer(null); setLetters([]); setHeard(false); setChecked(false); setAttempts(0); setScreen(next); };
  const checkAnswer = (isCorrect: boolean) => { setChecked(true); setLastCorrect(isCorrect); if (!isCorrect) setAttempts((a) => a + 1); };
  const retry = () => { setChecked(false); setAnswer(null); setLetters([]); };
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
          <button onClick={() => setShowProfileMenu(true)} className="glass-panel grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl" aria-label={t.openProfileMenu}><img src="/images/logo.png" alt="" className="size-full object-cover" /></button>
          <button onClick={() => go("home")} className="min-w-0 text-left" aria-label="Go to learning path">
            <span className="block truncate font-display text-xl font-extrabold leading-none">WortWunder</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">{profile?.name || "Freund"}</span>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Stat icon={<Flame />} value="5" label={t.dayStreak} />
          <Stat icon={<Zap />} value="240" label={t.experiencePoints} />
          <span className="hidden sm:block"><Stat icon={<Heart />} value="3" label={t.hearts} /></span>
        </div>
      </header>

      {screen !== "home" && (
        <div className="relative z-10 mx-auto flex max-w-3xl items-center gap-3 px-4 pb-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => go(previousScreen)} aria-label={t.previousScreen}><ArrowLeft /></Button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-glass ring-1 ring-border"><div className="h-full rounded-full bg-mint transition-all duration-500" style={{ width: `${(step / (sequence.length - 1)) * 100}%` }} /></div>
          <span className="font-display text-sm font-bold">{step}/{sequence.length - 1}</span>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        {screen === "home" && <Home t={t} onStart={startLesson} name={profile?.name} showInstall={!installed} onAddToHomeScreen={addToHomeScreen} />}

        {screen === "picture" && <LessonFrame t={t} eyebrow={t.pictureChallenge} title="Was ist das?" subtitle={t.chooseGermanWordForPicture}>
          <Picture src={vogel.image} alt={vogel.full} />
          <AnswerGrid options={["der Hund", "der Vogel", "das Pferd", "die Katze"]} selected={answer} correct="der Vogel" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "der Vogel")} />}
        </LessonFrame>}

        {screen === "wordPicture" && <LessonFrame t={t} eyebrow={t.wordPictureChallenge} title="Welches Bild ist das?" subtitle={t.chooseGermanPictureForWord}>
          <WordCard t={t} text="der Vogel" speak />
          <PictureOptions options={pictureOptions} selected={answer} correct="vogel" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "vogel")} />}
        </LessonFrame>}

        {screen === "meaning" && <LessonFrame t={t} eyebrow={t.meaningCheck} title="Was bedeutet das?" subtitle={t.chooseMeaning}>
          <WordCard t={t} text="der Vogel" speak />
          <AnswerGrid options={meaningOptions} selected={answer} correct={vogel[lang]} revealed={checked} onSelect={setAnswer} speak={false} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === vogel[lang])} />}
        </LessonFrame>}

        {screen === "translate" && <LessonFrame t={t} eyebrow={t.translationChallenge} title="Wie sagt man das auf Deutsch?" subtitle={t.chooseGermanWord}>
          <WordCard t={t} text={vogel[lang]} />
          <AnswerGrid options={translateOptions} selected={answer} correct="der Vogel" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "der Vogel")} />}
        </LessonFrame>}

        {screen === "article" && <LessonFrame t={t} eyebrow={t.articleChallenge} title="Welcher Artikel passt?" subtitle={t.chooseCorrectArticle}>
          <Picture src={vogel.image} alt={vogel.full} />
          <div className="my-5 flex items-center justify-center gap-2">
            <span className={cn("grid h-12 min-w-20 place-items-center rounded-xl px-3 font-display text-xl font-extrabold", "border-2 bg-glass", !checked && "border-dashed border-ring/50", checked && lastCorrect && "border-success text-success", checked && !lastCorrect && "border-destructive text-destructive")}>{checked ? (answer ?? "___") : "___"}</span>
            <span className="font-display text-xl font-extrabold">Vogel</span>
          </div>
          <ArticleGrid options={["der", "die", "das"]} selected={answer} correct="der" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "der")} />}
        </LessonFrame>}

        {screen === "build" && <LessonFrame t={t} eyebrow={t.wordBuilder} title="Baue das Wort" subtitle={t.tapLettersToSpell("Vogel")}>
          <Picture src={vogel.image} alt={vogel.full} />
          <LetterBuilder t={t} answerLength={5} tiles={letterTiles} letters={letters} disabled={checked} onTapTile={(i, letter) => { playLetter(letter); setLetters((old) => [...old, i]); }} onReset={() => setLetters([])} />
          {!checked && <Continue t={t} disabled={letters.length !== 5} onClick={() => checkAnswer(letters.map((i) => letterTiles[i]).join("") === "VOGEL")} />}
        </LessonFrame>}

        {screen === "missing" && <LessonFrame t={t} eyebrow={t.missingLetter} title="Welcher Buchstabe fehlt?" subtitle={t.pickLetterThatCompletes}>
          <Picture src={vogel.image} alt={vogel.full} />
          <div className="my-5 flex justify-center gap-2">
            {["V", checked ? (answer ?? "_") : "_", "G", "E", "L"].map((ch, i) => <span key={i} className={cn("grid size-12 place-items-center rounded-xl font-display text-xl font-extrabold", i === 1 ? cn("border-2 bg-glass", !checked && "border-dashed border-ring/50", checked && lastCorrect && "border-success text-success", checked && !lastCorrect && "border-destructive text-destructive") : "bg-card ring-1 ring-border")}>{ch}</span>)}
          </div>
          <LetterOptions options={missingLetterOptions} selected={answer} correct="O" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "O")} />}
        </LessonFrame>}

        {screen === "unscramble" && <LessonFrame t={t} eyebrow={t.unscramble} title="Ordne die Buchstaben" subtitle={t.arrangeLetters}>
          <Picture src={vogel.image} alt={vogel.full} />
          <LetterBuilder t={t} answerLength={5} tiles={unscrambleTiles} letters={letters} disabled={checked} onTapTile={(i, letter) => { playLetter(letter); setLetters((old) => [...old, i]); }} onReset={() => setLetters([])} />
          {!checked && <Continue t={t} disabled={letters.length !== 5} onClick={() => checkAnswer(letters.map((i) => unscrambleTiles[i]).join("") === "VOGEL")} />}
        </LessonFrame>}

        {screen === "listen" && <LessonFrame t={t} eyebrow={t.listeningChallenge} title="Was hörst du?" subtitle={t.listenThenChoose}>
          <div className="my-5 flex justify-center"><Button onClick={speak} className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none" aria-label={t.playGermanWord}><Volume2 className="size-10" /></Button></div>
          {heard && <p className="mb-4 text-center text-sm font-bold text-ink-soft">{t.listenAgain}</p>}
          <AnswerGrid options={["der Hund", "der Vogel", "das Pferd", "die Katze"]} selected={answer} correct="der Vogel" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "der Vogel")} />}
        </LessonFrame>}

        {screen === "listenPicture" && <LessonFrame t={t} eyebrow={t.listeningChallenge} title="Welches Bild hörst du?" subtitle={t.listenThenTapPicture}>
          <div className="my-5 flex justify-center"><Button onClick={speak} className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none" aria-label={t.playGermanWord}><Volume2 className="size-10" /></Button></div>
          {heard && <p className="mb-4 text-center text-sm font-bold text-ink-soft">{t.listenAgain}</p>}
          <PictureOptions options={pictureOptions} selected={answer} correct="vogel" revealed={checked} onSelect={setAnswer} />
          {!checked && <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "vogel")} />}
        </LessonFrame>}

        {screen === "listenBuild" && <LessonFrame t={t} eyebrow={t.listeningChallenge} title="Baue das Wort" subtitle={t.listenThenSpell}>
          <div className="my-5 flex justify-center"><Button onClick={speak} className="size-24 rounded-full bg-berry text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] hover:bg-berry/90 active:translate-y-1 active:shadow-none" aria-label={t.playGermanWord}><Volume2 className="size-10" /></Button></div>
          {heard && <p className="mb-4 text-center text-sm font-bold text-ink-soft">{t.listenAgain}</p>}
          <LetterBuilder t={t} answerLength={5} tiles={listenBuildTiles} letters={letters} disabled={checked} onTapTile={(i, letter) => { playLetter(letter); setLetters((old) => [...old, i]); }} onReset={() => setLetters([])} />
          {!checked && <Continue t={t} disabled={letters.length !== 5} onClick={() => checkAnswer(letters.map((i) => listenBuildTiles[i]).join("") === "VOGEL")} />}
        </LessonFrame>}

        {screen === "match" && <LessonFrame t={t} eyebrow={t.roundUp} title="Finde die Paare" subtitle={t.matchWordsToMeaning}>
          <MatchPairs t={t} lang={lang} words={TIERE_WORDS} onComplete={() => go("home")} />
        </LessonFrame>}

        {checked && screen !== "home" && <ResultCard correct={lastCorrect} correctText={t.correctMeaning("der Vogel", vogel[lang])} hint={attempts >= 2 ? t.hintBird : undefined} actionLabel={lastCorrect ? "Weiter" : t.tryAgain} onAction={lastCorrect ? () => go(sequence[step + 1] ?? "home") : retry} />}
      </main>

      {profileChecked && !profile && <Onboarding onSubmit={saveProfile} />}
      {showInstallHelp && <InstallHelp t={t} onClose={() => setShowInstallHelp(false)} />}
      {showProfileMenu && <ProfileMenu profile={profile} onClose={() => setShowProfileMenu(false)} onSave={(next) => { saveProfile(next); setShowProfileMenu(false); }} onRequestClear={() => setShowClearConfirm(true)} />}
      {showClearConfirm && <ClearConfirm t={t} onCancel={() => setShowClearConfirm(false)} onConfirm={clearAllData} />}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <span className="glass-panel flex items-center gap-1.5 rounded-full px-2.5 py-2 sm:px-3" aria-label={`${value} ${label}`}><span className="[&_svg]:size-4">{icon}</span><span className="font-display text-sm font-bold">{value}</span></span>;
}

function Home({ t, onStart, name, showInstall, onAddToHomeScreen }: { t: Strings; onStart: () => void; name?: string | undefined; showInstall: boolean; onAddToHomeScreen: () => void }) {
  const levels = [
    { icon: <Check />, title: "Hallo!", detail: t.lessonComplete(30), state: "done" },
    { icon: "🐕", title: "Tiere", detail: t.wordsStartHere(8), state: "active" },
    { icon: "🍎", title: "Essen", detail: t.wordsLocked(8), state: "locked" },
    { icon: "📘", title: "Zu Hause", detail: t.wordsLocked(8), state: "locked" },
  ];
  return <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
    <section className="glass-panel rounded-[28px] p-5 sm:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div className="min-w-0"><p className="text-sm font-extrabold text-ink-soft">Hallo, {name || "Freund"}!</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Dein Lernweg</h1><p className="mt-1 font-bold text-ink-soft">{t.readyForAdventure}</p>{showInstall && <Button variant="outline" size="sm" className="mt-3 rounded-xl border-2 border-border bg-card font-display font-extrabold" onClick={onAddToHomeScreen}><Smartphone /> {t.addToHomeScreen}</Button>}</div><div className="animate-bob grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl ring-2 ring-border"><img src="/images/logo.png" alt="WortWunder mascot" className="size-full object-cover" /></div></div>
      <div className="relative mx-auto mt-7 max-w-lg space-y-4 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-2 before:rounded-full before:bg-ice">
        {levels.map((level, index) => <button key={level.title} disabled={level.state === "locked"} onClick={level.state === "active" ? onStart : undefined} className={cn("relative grid w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 text-left", index % 2 === 1 && "sm:translate-x-10")}><span className={cn("z-10 grid size-14 place-items-center rounded-full border-4 border-frost text-2xl shadow-md [&_svg]:size-6", level.state === "done" && "bg-mint", level.state === "active" && "animate-bob bg-sun", level.state === "locked" && "bg-ice text-ink-soft")}>{level.state === "locked" ? <Lock className="size-5" /> : level.icon}</span><span className={cn("rounded-2xl p-4 ring-1 ring-border", level.state === "active" ? "bg-sun/30 ring-2 ring-sun" : "bg-card", level.state === "locked" && "opacity-65")}><span className="block font-display text-lg font-extrabold">{level.title}</span><span className="block text-xs font-bold text-ink-soft">{level.detail}</span></span></button>)}
      </div>
    </section>
    <aside className="space-y-5">
      <section className="glass-panel rounded-[28px] p-5"><p className="text-sm font-extrabold text-ink-soft">{t.todaysGoal}</p><div className="mt-2 flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-mint/35"><Sparkles className="size-8" /></div><div className="min-w-0 flex-1"><p className="font-display text-xl font-extrabold">{t.xpProgress(10, 20)}</p><div className="mt-2 h-3 overflow-hidden rounded-full bg-ice"><div className="h-full w-1/2 rounded-full bg-mint" /></div></div></div></section>
      <Button variant="adventure" size="lesson" className="w-full" onClick={onStart}>{t.startLesson} <Zap /></Button>
    </aside>
  </div>;
}

function Onboarding({ onSubmit }: { onSubmit: (profile: Profile) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [motherTongue, setMotherTongue] = useState<MotherTongue>("english");
  const t = TRANSLATIONS[motherTongue];
  const valid = name.trim().length > 0 && Number(age) > 0;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit({ name: name.trim(), age: age.trim(), motherTongue }); }} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 sm:p-7">
      <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-3xl ring-2 ring-border"><img src="/images/logo.png" alt="WortWunder" className="size-full object-cover" /></div>
      <h2 className="mt-4 text-center font-display text-2xl font-extrabold">Wer bist du?</h2>
      <p className="mt-1 text-center font-bold text-ink-soft">{t.whoAreYouSubtitle}</p>
      <div className="mt-6 space-y-3">
        <div>
          <label htmlFor="onboarding-name" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{t.nameLabel}</label>
          <Input id="onboarding-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} autoFocus className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
        <div>
          <label htmlFor="onboarding-age" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{t.ageLabel}</label>
          <Input id="onboarding-age" type="number" min={1} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder={t.agePlaceholder} className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
        <MotherTongueField label={t.motherTongueLabel} value={motherTongue} onChange={setMotherTongue} />
      </div>
      <Button type="submit" variant="adventure" size="lesson" className="mt-6 w-full" disabled={!valid}>Los geht's!</Button>
    </form>
  </div>;
}

function MotherTongueField({ label, value, onChange }: { label: string; value: MotherTongue; onChange: (value: MotherTongue) => void }) {
  return <div>
    <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{label}</span>
    <div className="grid grid-cols-3 gap-2">
      {MOTHER_TONGUES.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={cn("h-12 rounded-2xl border-2 font-display text-sm font-extrabold transition", value === option.value ? "border-primary bg-primary/10" : "border-border bg-glass text-ink-soft")}>{option.label}</button>)}
    </div>
  </div>;
}

function ProfileMenu({ profile, onClose, onSave, onRequestClear }: { profile: Profile | null; onClose: () => void; onSave: (profile: Profile) => void; onRequestClear: () => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age ?? "");
  const [motherTongue, setMotherTongue] = useState<MotherTongue>(profile?.motherTongue ?? "english");
  const t = TRANSLATIONS[motherTongue];
  const valid = name.trim().length > 0 && Number(age) > 0;
  return <div className="fixed inset-0 z-50 flex bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="animate-slide-in-left glass-panel flex h-full w-full max-w-xs flex-col rounded-r-[28px] bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="grid size-12 place-items-center overflow-hidden rounded-2xl ring-2 ring-border"><img src="/images/logo.png" alt="WortWunder" className="size-full object-cover" /></div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t.closeMenu}><X /></Button>
      </div>
      <h2 className="mt-4 font-display text-xl font-extrabold">{t.aboutMe}</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="profile-name" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{t.nameLabel}</label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
        <div>
          <label htmlFor="profile-age" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{t.ageLabel}</label>
          <Input id="profile-age" type="number" min={1} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold" />
        </div>
        <MotherTongueField label={t.motherTongueLabel} value={motherTongue} onChange={setMotherTongue} />
      </div>
      <Button variant="adventure" size="lesson" className="mt-4 w-full" disabled={!valid} onClick={() => onSave({ name: name.trim(), age: age.trim(), motherTongue })}>{t.save}</Button>

      <div className="mt-auto border-t border-border pt-4">
        <Button variant="outline" className="w-full rounded-2xl border-2 border-destructive text-destructive hover:bg-danger-soft" onClick={onRequestClear}><Trash2 className="size-4" /> {t.clearAllData}</Button>
      </div>
    </div>
  </div>;
}

function ClearConfirm({ t, onCancel, onConfirm }: { t: Strings; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 text-center sm:p-7">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-danger-soft"><Trash2 className="size-7 text-destructive" /></div>
      <h2 className="mt-4 font-display text-xl font-extrabold">{t.deleteEverythingTitle}</h2>
      <p className="mt-2 font-bold text-ink-soft">{t.deleteEverythingBody}</p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1 rounded-2xl" onClick={onCancel}>{t.cancel}</Button>
        <Button variant="destructive" className="flex-1 rounded-2xl" onClick={onConfirm}>{t.yesDelete}</Button>
      </div>
    </div>
  </div>;
}

function InstallHelp({ t, onClose }: { t: Strings; onClose: () => void }) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const safariLink = (() => {
    if (typeof window === "undefined") return "#";
    const url = new URL(window.location.href);
    url.searchParams.set("install", "1");
    return url.toString().replace(/^https?:\/\//, (m) => `x-safari-${m}`);
  })();

  const steps: { icon: React.ReactNode; text: React.ReactNode; href?: string }[] = [
    ...(!isSafari ? [{ icon: <ExternalLink />, text: t.openInSafariStep, href: safariLink }] : []),
    { icon: <Share />, text: t.tapShareStep },
    { icon: <SquarePlus />, text: t.addToHomeScreenStep },
    { icon: <Check />, text: t.tapAddStep },
    { icon: <Smartphone />, text: t.findIconStep },
  ];

  return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 sm:p-7">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-mint/35"><Smartphone className="size-7" /></div>
      <h2 className="mt-4 text-center font-display text-xl font-extrabold">{t.addToHomeScreen}</h2>
      <p className="mt-1 text-center font-bold text-ink-soft">{t.followStepsGrownUp}</p>
      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => <li key={index} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sun/40 font-display text-base font-extrabold ring-2 ring-border">{index + 1}</span>
          <div className="rounded-2xl bg-glass p-3 ring-1 ring-border">
            <p className="flex items-start gap-1.5 text-sm font-bold leading-snug"><span className="mt-0.5 shrink-0 text-ink-soft [&_svg]:size-4">{step.icon}</span><span>{step.text}</span></p>
            {step.href && <a href={step.href} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-display text-sm font-extrabold text-primary-foreground">{t.openInSafari} <ExternalLink className="size-4" /></a>}
          </div>
        </li>)}
      </ol>
      <Button variant="adventure" size="lesson" className="mt-6 w-full" onClick={onClose}>{t.gotIt}</Button>
    </div>
  </div>;
}

function LessonFrame({ t, eyebrow, title, subtitle, children }: { t: Strings; eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="glass-panel mx-auto max-w-3xl rounded-[28px] p-5 sm:p-8">
    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p>
    <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
      <button type="button" onClick={() => playWord(title)} className="inline-flex items-center gap-2 text-left" aria-label={t.tapToHear(title)}>{title} <Volume2 className="size-6 shrink-0 text-ink-soft" /></button>
    </h1>
    <p className="font-bold text-ink-soft">{subtitle}</p>
    <div className="mt-6">{children}</div>
  </section>;
}
function Picture({ src, alt }: { src: string; alt: string }) { return <div className="mx-auto my-5 grid size-36 place-items-center rounded-[28px] bg-card p-4 shadow-inner ring-1 ring-border sm:size-40"><img src={src} alt={alt} className="size-full object-contain" /></div>; }
function AnswerGrid({ options, selected, correct, revealed, onSelect, speak = true }: { options: string[]; selected: string | null; correct: string; revealed: boolean; onSelect: (answer: string) => void; speak?: boolean }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((option) => <Button key={option} variant="answer" disabled={revealed} onClick={() => { if (speak) playWord(option); onSelect(option); }} className={cn(!revealed && selected === option && "border-primary bg-primary/10", revealed && selected === option && option === correct && "border-success bg-success-soft", revealed && selected === option && option !== correct && "border-destructive bg-danger-soft", revealed && option === correct && "border-success")}>{option}</Button>)}</div>; }
function ArticleGrid({ options, selected, correct, revealed, onSelect }: { options: string[]; selected: string | null; correct: string; revealed: boolean; onSelect: (answer: string) => void }) { return <div className="grid grid-cols-3 gap-3">{options.map((option) => <Button key={option} variant="answer" disabled={revealed} onClick={() => { playWord(option); onSelect(option); }} className={cn(!revealed && selected === option && "border-primary bg-primary/10", revealed && selected === option && option === correct && "border-success bg-success-soft", revealed && selected === option && option !== correct && "border-destructive bg-danger-soft", revealed && option === correct && "border-success")}>{option}</Button>)}</div>; }
function WordCard({ t, text, speak = false }: { t: Strings; text: string; speak?: boolean }) {
  if (!speak) return <div className="mx-auto my-5 grid min-h-32 max-w-xs place-items-center rounded-[28px] bg-card px-6 py-4 text-center font-display text-2xl font-extrabold shadow-inner ring-1 ring-border sm:min-h-36 sm:text-3xl">{text}</div>;
  return <button type="button" onClick={() => playWord(text)} aria-label={t.tapToHear(text)} className="mx-auto my-5 flex min-h-32 max-w-xs items-center justify-center gap-2 rounded-[28px] bg-card px-6 py-4 text-center font-display text-2xl font-extrabold shadow-inner ring-1 ring-border transition hover:bg-card/80 sm:min-h-36 sm:text-3xl">{text} <Volume2 className="size-6 shrink-0 text-ink-soft" /></button>;
}
function LetterOptions({ options, selected, correct, revealed, onSelect }: { options: string[]; selected: string | null; correct: string; revealed: boolean; onSelect: (letter: string) => void }) { return <div className="flex flex-wrap justify-center gap-3">{options.map((option) => <Button key={option} variant="tile" size="tile" disabled={revealed} onClick={() => { playLetter(option); onSelect(option); }} className={cn(!revealed && selected === option && "border-primary bg-primary/10", revealed && selected === option && option === correct && "border-success bg-success-soft", revealed && selected === option && option !== correct && "border-destructive bg-danger-soft", revealed && option === correct && "border-success")}>{option}</Button>)}</div>; }
function PictureOptions({ options, selected, correct, revealed, onSelect }: { options: { id: string; image: string; label: string }[]; selected: string | null; correct: string; revealed: boolean; onSelect: (id: string) => void }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{options.map((option) => <button key={option.id} type="button" disabled={revealed} aria-label={option.label} onClick={() => onSelect(option.id)} className={cn("grid aspect-square place-items-center rounded-3xl bg-card p-3 ring-2 ring-border transition", !revealed && selected === option.id && "ring-primary bg-primary/10", revealed && selected === option.id && option.id === correct && "ring-success bg-success-soft", revealed && selected === option.id && option.id !== correct && "ring-destructive bg-danger-soft", revealed && option.id === correct && "ring-success")}><img src={option.image} alt={option.label} className="size-full object-contain" /></button>)}</div>;
}
function LetterBuilder({ t, answerLength, tiles, letters, onTapTile, onReset, disabled }: { t: Strings; answerLength: number; tiles: string[]; letters: number[]; onTapTile: (index: number, letter: string) => void; onReset: () => void; disabled: boolean }) {
  return <>
    <div className="my-5 flex min-h-14 flex-wrap justify-center gap-2">{Array.from({ length: answerLength }).map((_, i) => { const tileIndex = letters[i]; return <span key={i} className="grid size-12 place-items-center rounded-xl border-2 border-dashed border-ring/50 bg-glass font-display text-xl font-extrabold">{tileIndex !== undefined ? tiles[tileIndex] : ""}</span>; })}</div>
    <div className="flex flex-wrap justify-center gap-2">{tiles.map((letter, i) => <Button key={`${letter}-${i}`} variant="tile" size="tile" disabled={disabled || letters.includes(i) || letters.length >= answerLength} onClick={() => onTapTile(i, letter)}>{letter}</Button>)}<Button variant="tile" size="tile" disabled={disabled} onClick={onReset} aria-label={t.resetLetters}><RotateCcw /></Button></div>
  </>;
}
function MatchPairs({ t, lang, words, onComplete }: { t: Strings; lang: MotherTongue; words: VocabWord[]; onComplete: () => void }) {
  const rightOrder = useMemo(() => { const order = [2, 0, 3, 1].map((i) => words[i % words.length]?.id).filter((id): id is string => Boolean(id)); return order.length === words.length ? order : words.map((w) => w.id); }, [words]);
  const byId = useMemo(() => Object.fromEntries(words.map((w) => [w.id, w])), [words]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  const allMatched = matched.length === words.length;

  useEffect(() => {
    if (!wrong) return;
    const timer = setTimeout(() => setWrong(null), 600);
    return () => clearTimeout(timer);
  }, [wrong]);

  const selectLeft = (id: string) => { if (matched.includes(id)) return; const word = byId[id]; if (word) playWord(word.full); setSelectedLeft(id); setWrong(null); };
  const selectRight = (id: string) => {
    if (!selectedLeft || matched.includes(id)) return;
    if (selectedLeft === id) { const word = byId[id]; if (word) playWord(word.full); setMatched((old) => [...old, id]); setSelectedLeft(null); }
    else { setWrong({ left: selectedLeft, right: id }); setSelectedLeft(null); }
  };

  return <div>
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="space-y-3">{words.map((w) => <button key={w.id} type="button" disabled={matched.includes(w.id)} onClick={() => selectLeft(w.id)} className={cn("flex w-full items-center gap-2 rounded-2xl bg-card p-3 text-left ring-2 ring-border transition sm:p-4", matched.includes(w.id) && "bg-success-soft ring-success opacity-70", selectedLeft === w.id && "ring-primary bg-primary/10", wrong?.left === w.id && "ring-destructive bg-danger-soft")}><img src={w.image} alt={w.full} className="size-8 shrink-0 object-contain" /><span className="font-display text-sm font-extrabold sm:text-base">{w.full}</span></button>)}</div>
      <div className="space-y-3">{rightOrder.map((id) => { const w = byId[id]; if (!w) return null; return <button key={id} type="button" disabled={matched.includes(id)} onClick={() => selectRight(id)} className={cn("w-full rounded-2xl bg-card p-3 text-center ring-2 ring-border transition sm:p-4", matched.includes(id) && "bg-success-soft ring-success opacity-70", wrong?.right === id && "ring-destructive bg-danger-soft")}><span className="font-display text-sm font-extrabold sm:text-base">{w[lang]}</span></button>; })}</div>
    </div>
    {allMatched && <div className="animate-pop mt-6 rounded-3xl bg-sun/35 p-5 text-center ring-2 ring-sun">
      <Star className="mx-auto size-10 fill-sun text-foreground" />
      <p className="mt-1 font-display text-2xl font-extrabold">Lektion geschafft!</p>
      <p className="font-bold text-ink-soft">{t.xpStreakContinues}</p>
      <Button variant="adventure" size="lesson" className="mt-4 w-full" onClick={onComplete}>{t.backToPath}</Button>
    </div>}
  </div>;
}
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
function Continue({ t, onClick, disabled }: { t: Strings; onClick: () => void; disabled?: boolean }) { return <Button variant="adventure" size="lesson" className="mt-6 w-full" disabled={disabled} onClick={onClick}>{t.check}</Button>; }
