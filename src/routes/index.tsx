import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Heart,
  Share,
  Smartphone,
  SquarePlus,
  Sparkles,
  Trash2,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { VocabQuiz } from "@/components/quiz/VocabQuiz";
import { TierSteps } from "@/components/quiz/TierSteps";
import { getTestStatus, type TestStatus } from "@/lib/progress-store";
import type { Tier } from "@/lib/quiz-engine";
import { GREETINGS_TEST_ID, GREETINGS_WORDS } from "@/data/greetings";
import { FAMILY_TEST_ID, FAMILY_WORDS } from "@/data/family";
import { TIERE_WORDS, type VocabWord } from "@/data/vocabulary";
import { MOTHER_TONGUES, TRANSLATIONS, type MotherTongue, type Strings } from "@/lib/i18n";

const PROFILE_KEY = "wortwunder:profile";
type Profile = { name: string; age: string; motherTongue: MotherTongue };

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WortWunder — German vocabulary for kids" },
      {
        name: "description",
        content:
          "Learn beginner German words through playful picture, spelling, and listening lessons.",
      },
      { property: "og:title", content: "WortWunder — German vocabulary for kids" },
      {
        property: "og:description",
        content: "A playful German vocabulary adventure for young learners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Screen =
  | "home"
  | "greetings"
  | "family"
  | "picture"
  | "wordPicture"
  | "meaning"
  | "translate"
  | "article"
  | "build"
  | "missing"
  | "unscramble"
  | "listen"
  | "listenPicture"
  | "listenBuild"
  | "match";

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
  const pictureOptions = useMemo(
    () => TIERE_WORDS.map((w) => ({ id: w.id, image: w.image, label: w[lang] })),
    [lang],
  );

  // Fetch a screen's word/letter clips as soon as it mounts, so tapping a
  // tile plays instantly instead of waiting on the network the first time.
  useEffect(() => {
    switch (screen) {
      case "picture":
      case "listen":
        preloadWords(["der Hund", "der Vogel", "das Pferd", "die Katze"]);
        break;
      case "wordPicture":
      case "listenPicture":
        preloadWords(["der Vogel"]);
        break;
      case "translate":
        preloadWords(translateOptions);
        break;
      case "article":
        preloadWords(["der", "die", "das"]);
        break;
      case "build":
        preloadLetters(letterTiles);
        break;
      case "missing":
        preloadLetters(missingLetterOptions);
        break;
      case "unscramble":
        preloadLetters(unscrambleTiles);
        break;
      case "listenBuild":
        preloadWords(["der Vogel"]);
        preloadLetters(listenBuildTiles);
        break;
      case "match":
        preloadWords(TIERE_WORDS.map((w) => w.full));
        break;
    }
  }, [
    screen,
    translateOptions,
    letterTiles,
    missingLetterOptions,
    unscrambleTiles,
    listenBuildTiles,
  ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Profile>;
        setProfile({
          name: parsed.name ?? "",
          age: parsed.age ?? "",
          motherTongue: parsed.motherTongue ?? "english",
        });
      }
    } catch {
      /* localStorage unavailable — treat as no saved profile */
    }
    setProfileChecked(true);
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );

    const w = window as Window & { __bip?: InstallPromptEvent | null };
    const pickUpPrompt = () => {
      if (w.__bip) setInstallPrompt(w.__bip);
    };
    pickUpPrompt();
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("bip-ready", pickUpPrompt);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    try {
      const redirectUrl = new URL(window.location.href);
      if (redirectUrl.searchParams.get("install") === "1") {
        redirectUrl.searchParams.delete("install");
        window.history.replaceState(
          {},
          "",
          redirectUrl.pathname + redirectUrl.search + redirectUrl.hash,
        );
        setShowInstallHelp(true);
      }
    } catch {
      /* URL parsing failed — skip the auto-reopen, rest of the app still works */
    }

    return () => {
      window.removeEventListener("bip-ready", pickUpPrompt);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const saveProfile = (next: Profile) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch {
      /* localStorage unavailable — profile still works for this session */
    }
    setProfile(next);
  };

  const clearAllData = () => {
    try {
      localStorage.clear();
    } catch {
      /* localStorage unavailable — nothing to clear */
    }
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
    const isIOS =
      /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (isIOS) setShowInstallHelp(true);
  };
  // Mirrors quiz-engine.ts's TEST_TIERS grouping (easy -> medium -> hard) so
  // this hand-written walkthrough exercises the same difficulty order as
  // the data-driven VocabQuiz. "match" stays last regardless of tier —
  // MatchPairs always exits via its own onComplete straight to "home"
  // rather than through this sequence, so anything placed after it here
  // would be unreachable.
  const sequence: Screen[] = [
    "home",
    "picture",
    "wordPicture",
    "meaning",
    "listen",
    "article",
    "missing",
    "listenPicture",
    "translate",
    "unscramble",
    "listenBuild",
    "build",
    "match",
  ];
  const step = sequence.indexOf(screen);

  const go = (next: Screen) => {
    setAnswer(null);
    setLetters([]);
    setHeard(false);
    setChecked(false);
    setAttempts(0);
    setScreen(next);
  };
  const checkAnswer = (isCorrect: boolean) => {
    setChecked(true);
    setLastCorrect(isCorrect);
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
  const startLesson = (nodeId: string) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        mozRequestFullScreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };
      const request =
        root.requestFullscreen ??
        root.webkitRequestFullscreen ??
        root.mozRequestFullScreen ??
        root.msRequestFullscreen;
      try {
        request?.call(root)?.catch?.(() => {});
      } catch {
        /* fullscreen unsupported (e.g. iOS Safari) — layout still fills the viewport */
      }
    }
    go(nodeId === "hallo" ? "greetings" : nodeId === "familie" ? "family" : "picture");
  };
  const speak = () => {
    setHeard(true);
    playWord("der Vogel");
  };

  return (
    <div className="app-sky relative min-h-dvh overflow-hidden text-foreground [padding:env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)]">
      <header className="relative z-20 mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setShowProfileMenu(true)}
            className="glass-panel grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl"
            aria-label={t.openProfileMenu}
          >
            <img src="/images/logo.png" alt="" className="size-full object-cover" />
          </button>
          <button
            onClick={() => go("home")}
            className="min-w-0 text-left"
            aria-label="Go to learning path"
          >
            <span className="block truncate font-display text-xl font-extrabold leading-none">
              WortWunder
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">
              {profile?.name || "Freund"}
            </span>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Stat icon={<Flame />} value="5" label={t.dayStreak} />
          <Stat icon={<Zap />} value="240" label={t.experiencePoints} />
          <span className="hidden sm:block">
            <Stat icon={<Heart />} value="3" label={t.hearts} />
          </span>
        </div>
      </header>

      {screen === "greetings" && (
        <VocabQuiz
          testId={GREETINGS_TEST_ID}
          words={GREETINGS_WORDS}
          t={t}
          lang={lang}
          onExit={() => go("home")}
        />
      )}

      {screen === "family" && (
        <VocabQuiz
          testId={FAMILY_TEST_ID}
          words={FAMILY_WORDS}
          t={t}
          lang={lang}
          onExit={() => go("home")}
        />
      )}

      {screen !== "greetings" && screen !== "family" && (
        <main className="relative z-10 mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          {screen === "home" && (
            <Home
              t={t}
              lang={lang}
              onStart={startLesson}
              name={profile?.name}
              showInstall={!installed}
              onAddToHomeScreen={addToHomeScreen}
            />
          )}

          {screen === "picture" && (
            <LessonFrame
              t={t}
              eyebrow={t.pictureChallenge}
              title="Was ist das?"
              subtitle={t.chooseGermanWordForPicture}
            >
              <Picture src={vogel.image} alt={vogel.full} caption={vogel[lang]} />
              <AnswerGrid
                options={["der Hund", "der Vogel", "das Pferd", "die Katze"]}
                selected={answer}
                correct="der Vogel"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={!answer}
                  onClick={() => checkAnswer(answer === "der Vogel")}
                />
              )}
            </LessonFrame>
          )}

          {screen === "wordPicture" && (
            <LessonFrame
              t={t}
              eyebrow={t.wordPictureChallenge}
              title="Welches Bild ist das?"
              subtitle={t.chooseGermanPictureForWord}
            >
              <WordCard t={t} text="der Vogel" speak />
              <PictureOptions
                options={pictureOptions}
                selected={answer}
                correct="vogel"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={!answer}
                  onClick={() => checkAnswer(answer === "vogel")}
                />
              )}
            </LessonFrame>
          )}

          {screen === "meaning" && (
            <LessonFrame
              t={t}
              eyebrow={t.meaningCheck}
              title="Was bedeutet das?"
              subtitle={t.chooseMeaning}
            >
              <WordCard t={t} text="der Vogel" speak />
              <AnswerGrid
                options={meaningOptions}
                selected={answer}
                correct={vogel[lang]}
                revealed={checked}
                onSelect={setAnswer}
                speak={false}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={!answer}
                  onClick={() => checkAnswer(answer === vogel[lang])}
                />
              )}
            </LessonFrame>
          )}

          {screen === "translate" && (
            <LessonFrame
              t={t}
              eyebrow={t.translationChallenge}
              title="Wie sagt man das auf Deutsch?"
              subtitle={t.chooseGermanWord}
            >
              <WordCard t={t} text={vogel[lang]} />
              <AnswerGrid
                options={translateOptions}
                selected={answer}
                correct="der Vogel"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={!answer}
                  onClick={() => checkAnswer(answer === "der Vogel")}
                />
              )}
            </LessonFrame>
          )}

          {screen === "article" && (
            <LessonFrame
              t={t}
              eyebrow={t.articleChallenge}
              title="Welcher Artikel passt?"
              subtitle={t.chooseCorrectArticle}
            >
              <Picture src={vogel.image} alt={vogel.full} caption={vogel[lang]} />
              <div className="my-5 flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "grid h-12 min-w-20 place-items-center rounded-xl px-3 font-display text-xl font-extrabold",
                    "border-2 bg-glass",
                    !checked && "border-dashed border-ring/50",
                    checked && lastCorrect && "border-success text-success",
                    checked && !lastCorrect && "border-destructive text-destructive",
                  )}
                >
                  {checked ? (answer ?? "___") : "___"}
                </span>
                <span className="font-display text-xl font-extrabold">Vogel</span>
              </div>
              <OptionGrid
                options={["der", "die", "das"]}
                selected={answer}
                correct="der"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "der")} />
              )}
            </LessonFrame>
          )}

          {screen === "build" && (
            <LessonFrame
              t={t}
              eyebrow={t.wordBuilder}
              title="Baue das Wort"
              subtitle={t.tapLettersToSpell("Vogel")}
            >
              <Picture src={vogel.image} alt={vogel.full} caption={vogel[lang]} />
              <LetterBuilder
                t={t}
                answerLength={5}
                tiles={letterTiles}
                letters={letters}
                disabled={checked}
                onTapTile={(i, letter) => {
                  playLetter(letter);
                  setLetters((old) => [...old, i]);
                }}
                onReset={() => setLetters([])}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={letters.length !== 5}
                  onClick={() =>
                    checkAnswer(letters.map((i) => letterTiles[i]).join("") === "VOGEL")
                  }
                />
              )}
            </LessonFrame>
          )}

          {screen === "missing" && (
            <LessonFrame
              t={t}
              eyebrow={t.missingLetter}
              title="Welcher Buchstabe fehlt?"
              subtitle={t.pickLetterThatCompletes}
            >
              <Picture src={vogel.image} alt={vogel.full} caption={vogel[lang]} />
              <div className="my-5 flex justify-center gap-2">
                {["V", checked ? (answer ?? "_") : "_", "G", "E", "L"].map((ch, i) => (
                  <span
                    key={i}
                    className={cn(
                      "grid size-12 place-items-center rounded-xl font-display text-xl font-extrabold",
                      i === 1
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
                ))}
              </div>
              <LetterOptions
                options={missingLetterOptions}
                selected={answer}
                correct="O"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue t={t} disabled={!answer} onClick={() => checkAnswer(answer === "O")} />
              )}
            </LessonFrame>
          )}

          {screen === "unscramble" && (
            <LessonFrame
              t={t}
              eyebrow={t.unscramble}
              title="Ordne die Buchstaben"
              subtitle={t.arrangeLetters}
            >
              <Picture src={vogel.image} alt={vogel.full} caption={vogel[lang]} />
              <LetterBuilder
                t={t}
                answerLength={5}
                tiles={unscrambleTiles}
                letters={letters}
                disabled={checked}
                onTapTile={(i, letter) => {
                  playLetter(letter);
                  setLetters((old) => [...old, i]);
                }}
                onReset={() => setLetters([])}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={letters.length !== 5}
                  onClick={() =>
                    checkAnswer(letters.map((i) => unscrambleTiles[i]).join("") === "VOGEL")
                  }
                />
              )}
            </LessonFrame>
          )}

          {screen === "listen" && (
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
                options={["der Hund", "der Vogel", "das Pferd", "die Katze"]}
                selected={answer}
                correct="der Vogel"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={!answer}
                  onClick={() => checkAnswer(answer === "der Vogel")}
                />
              )}
            </LessonFrame>
          )}

          {screen === "listenPicture" && (
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
                options={pictureOptions}
                selected={answer}
                correct="vogel"
                revealed={checked}
                onSelect={setAnswer}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={!answer}
                  onClick={() => checkAnswer(answer === "vogel")}
                />
              )}
            </LessonFrame>
          )}

          {screen === "listenBuild" && (
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
                answerLength={5}
                tiles={listenBuildTiles}
                letters={letters}
                disabled={checked}
                onTapTile={(i, letter) => {
                  playLetter(letter);
                  setLetters((old) => [...old, i]);
                }}
                onReset={() => setLetters([])}
              />
              {!checked && (
                <Continue
                  t={t}
                  disabled={letters.length !== 5}
                  onClick={() =>
                    checkAnswer(letters.map((i) => listenBuildTiles[i]).join("") === "VOGEL")
                  }
                />
              )}
            </LessonFrame>
          )}

          {screen === "match" && (
            <LessonFrame
              t={t}
              eyebrow={t.roundUp}
              title="Finde die Paare"
              subtitle={t.matchWordsToMeaning}
            >
              <MatchPairs t={t} lang={lang} words={TIERE_WORDS} onComplete={() => go("home")} />
            </LessonFrame>
          )}

          {checked && screen !== "home" && (
            <ResultCard
              correct={lastCorrect}
              correctText={t.correctMeaning("der Vogel", vogel[lang])}
              hint={attempts >= 2 ? t.hintBird : undefined}
              actionLabel={lastCorrect ? "Weiter" : t.tryAgain}
              onAction={lastCorrect ? () => go(sequence[step + 1] ?? "home") : retry}
            />
          )}
        </main>
      )}

      {profileChecked && !profile && <Onboarding onSubmit={saveProfile} />}
      {showInstallHelp && <InstallHelp t={t} onClose={() => setShowInstallHelp(false)} />}
      {showProfileMenu && (
        <ProfileMenu
          profile={profile}
          onClose={() => setShowProfileMenu(false)}
          onSave={(next) => {
            saveProfile(next);
            setShowProfileMenu(false);
          }}
          onRequestClear={() => setShowClearConfirm(true)}
        />
      )}
      {showClearConfirm && (
        <ClearConfirm t={t} onCancel={() => setShowClearConfirm(false)} onConfirm={clearAllData} />
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <span
      className="glass-panel flex items-center gap-1.5 rounded-full px-2.5 py-2 sm:px-3"
      aria-label={`${value} ${label}`}
    >
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="font-display text-sm font-bold">{value}</span>
    </span>
  );
}

type PathNode = {
  id: string;
  title: string;
  icon: React.ReactNode;
  state: "done" | "active";
  meaning: string;
  // The VocabQuiz test this node opens, if any — drives its tier badge and
  // completed tick (see getTestStatus).
  testId?: string;
  children?: PathNode[];
};

function collectTestIds(nodes: PathNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.testId ? [node.testId] : []),
    ...(node.children ? collectTestIds(node.children) : []),
  ]);
}

function collectContainerIds(nodes: PathNode[]): string[] {
  return nodes.flatMap((node) =>
    node.children ? [node.id, ...collectContainerIds(node.children)] : [],
  );
}

const PATH_MEANINGS = {
  grundlagen: { english: "Basics", tamil: "அடிப்படைகள்", sinhala: "මූලික කරුණු" },
  hallo: { english: "Hello!", tamil: "வணக்கம்!", sinhala: "ආයුබෝවන්!" },
  familie: { english: "Family", tamil: "குடும்பம்", sinhala: "පවුල" },
  wortschatz: { english: "Vocabulary", tamil: "சொல்வளம்", sinhala: "වචන මාලාව" },
  tiere: { english: "Animals", tamil: "விலங்குகள்", sinhala: "සතුන්" },
  klassenzimmer: { english: "Classroom", tamil: "வகுப்பறை", sinhala: "පන්ති කාமරය" },
  essen: { english: "Food", tamil: "உணவு", sinhala: "ආහாර" },
  zuhause: { english: "Home", tamil: "வீடு", sinhala: "නිවස" },
} satisfies Record<string, Record<MotherTongue, string>>;

function Home({
  t,
  lang,
  onStart,
  name,
  showInstall,
  onAddToHomeScreen,
}: {
  t: Strings;
  lang: MotherTongue;
  onStart: (nodeId: string) => void;
  name?: string | undefined;
  showInstall: boolean;
  onAddToHomeScreen: () => void;
}) {
  const path = useMemo<PathNode[]>(
    () => [
      {
        id: "grundlagen",
        title: "Grundlagen",
        icon: "🔤",
        state: "active",
        meaning: PATH_MEANINGS.grundlagen[lang],
        children: [
          {
            id: "hallo",
            title: "Hallo!",
            icon: "👋",
            state: "active",
            meaning: PATH_MEANINGS.hallo[lang],
            testId: GREETINGS_TEST_ID,
          },
          {
            id: "wortschatz",
            title: "Wortschatz",
            icon: "🗂️",
            state: "active",
            meaning: PATH_MEANINGS.wortschatz[lang],
            children: [
              {
                id: "familie",
                title: "Familie",
                icon: "👨‍👩‍👧",
                state: "active",
                meaning: PATH_MEANINGS.familie[lang],
                testId: FAMILY_TEST_ID,
              },
              {
                id: "tiere",
                title: "Tiere",
                icon: "🐕",
                state: "active",
                meaning: PATH_MEANINGS.tiere[lang],
              },
              {
                id: "klassenzimmer",
                title: "Klassenzimmer",
                icon: "🎒",
                state: "active",
                meaning: PATH_MEANINGS.klassenzimmer[lang],
              },
            ],
          },
        ],
      },
      {
        id: "essen",
        title: "Essen",
        icon: "🍎",
        state: "active",
        meaning: PATH_MEANINGS.essen[lang],
      },
      {
        id: "zuhause",
        title: "Zu Hause",
        icon: "📘",
        state: "active",
        meaning: PATH_MEANINGS.zuhause[lang],
      },
    ],
    [lang],
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectContainerIds(path)));
  const toggleNode = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const handleCardClick = (node: PathNode) => onStart(node.id);
  // Read after mount rather than during render: progress lives in
  // localStorage, which the server render can't see.
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  useEffect(() => {
    setStatuses(
      Object.fromEntries(collectTestIds(path).map((testId) => [testId, getTestStatus(testId)])),
    );
  }, [path]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
      <section className="glass-panel rounded-[28px] p-5 sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink-soft">Hallo, {name || "Freund"}!</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Dein Lernweg</h1>
            <p className="mt-1 font-bold text-ink-soft">{t.readyForAdventure}</p>
            {showInstall && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-xl border-2 border-border bg-card font-display font-extrabold"
                onClick={onAddToHomeScreen}
              >
                <Smartphone /> {t.addToHomeScreen}
              </Button>
            )}
          </div>
          <div className="animate-bob grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl ring-2 ring-border">
            <img
              src="/images/logo.png"
              alt="WortWunder mascot"
              className="size-full object-cover"
            />
          </div>
        </div>
        <div className="mx-auto mt-7 max-w-lg">
          <PathTree
            t={t}
            nodes={path}
            depth={0}
            expanded={expanded}
            statuses={statuses}
            onToggle={toggleNode}
            onCardClick={handleCardClick}
          />
        </div>
      </section>
      <aside className="space-y-5">
        <section className="glass-panel rounded-[28px] p-5">
          <p className="text-sm font-extrabold text-ink-soft">{t.todaysGoal}</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-mint/35">
              <Sparkles className="size-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-extrabold">{t.xpProgress(10, 20)}</p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-ice">
                <div className="h-full w-1/2 rounded-full bg-mint" />
              </div>
            </div>
          </div>
        </section>
        <Button
          variant="adventure"
          size="lesson"
          className="w-full"
          onClick={() => onStart("tiere")}
        >
          {t.startLesson} <Zap />
        </Button>
      </aside>
    </div>
  );
}

const CHEVRON_COLORS = ["bg-mint", "bg-sun", "bg-frost"];

function PathTree({
  t,
  nodes,
  depth,
  expanded,
  statuses,
  onToggle,
  onCardClick,
}: {
  t: Strings;
  nodes: PathNode[];
  depth: number;
  expanded: Set<string>;
  statuses: Record<string, TestStatus>;
  onToggle: (id: string) => void;
  onCardClick: (node: PathNode) => void;
}) {
  return (
    <div className={cn("space-y-2", depth > 0 && "ml-6 mt-2 border-l-2 border-ice pl-4")}>
      {nodes.map((node) => {
        const hasChildren = !!node.children?.length;
        const isExpanded = expanded.has(node.id);
        const openCard = () => onCardClick(node);
        const status = node.testId ? statuses[node.testId] : undefined;
        const state = status?.kind === "completed" ? "done" : node.state;
        const currentTier = status?.kind === "inProgress" ? status.tier : undefined;
        return (
          <div key={node.id}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border transition",
                depth === 0 && "p-4",
              )}
            >
              <button
                type="button"
                onClick={openCard}
                aria-label={node.title}
                className={cn(
                  "relative z-10 grid shrink-0 place-items-center rounded-full border-4 border-frost shadow-md [&>svg]:size-5",
                  depth === 0 ? "size-14 text-2xl" : "size-11 text-lg",
                  state === "done" && "bg-mint",
                  state === "active" && "animate-bob bg-frost",
                )}
              >
                {node.icon}
                {state === "done" && (
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-success ring-2 ring-frost">
                    <Check className="size-3 text-primary-foreground" />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={openCard}
                className="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-display font-extrabold",
                      depth === 0 ? "text-lg" : "text-base",
                    )}
                  >
                    {node.title}
                  </span>
                  <span className="block text-xs font-bold text-ink-soft">{node.meaning}</span>
                </span>
                {currentTier && <TierSteps tier={currentTier} />}
              </button>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => onToggle(node.id)}
                  aria-label={isExpanded ? t.collapseSection : t.expandSection}
                  aria-expanded={isExpanded}
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full text-foreground shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:brightness-105 active:translate-y-1 active:shadow-none",
                    CHEVRON_COLORS[depth % CHEVRON_COLORS.length],
                  )}
                >
                  <ChevronRight
                    className={cn("size-5 transition-transform", isExpanded && "rotate-90")}
                  />
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <PathTree
                t={t}
                nodes={node.children!}
                depth={depth + 1}
                expanded={expanded}
                statuses={statuses}
                onToggle={onToggle}
                onCardClick={onCardClick}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Onboarding({ onSubmit }: { onSubmit: (profile: Profile) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [motherTongue, setMotherTongue] = useState<MotherTongue>("english");
  const t = TRANSLATIONS[motherTongue];
  const valid = name.trim().length > 0 && Number(age) > 0;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit({ name: name.trim(), age: age.trim(), motherTongue });
        }}
        className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 sm:p-7"
      >
        <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-3xl ring-2 ring-border">
          <img src="/images/logo.png" alt="WortWunder" className="size-full object-cover" />
        </div>
        <h2 className="mt-4 text-center font-display text-2xl font-extrabold">Wer bist du?</h2>
        <p className="mt-1 text-center font-bold text-ink-soft">{t.whoAreYouSubtitle}</p>
        <div className="mt-6 space-y-3">
          <div>
            <label
              htmlFor="onboarding-name"
              className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft"
            >
              {t.nameLabel}
            </label>
            <Input
              id="onboarding-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              autoFocus
              className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold"
            />
          </div>
          <div>
            <label
              htmlFor="onboarding-age"
              className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft"
            >
              {t.ageLabel}
            </label>
            <Input
              id="onboarding-age"
              type="number"
              min={1}
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t.agePlaceholder}
              className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold"
            />
          </div>
          <MotherTongueField
            label={t.motherTongueLabel}
            value={motherTongue}
            onChange={setMotherTongue}
          />
        </div>
        <Button
          type="submit"
          variant="adventure"
          size="lesson"
          className="mt-6 w-full"
          disabled={!valid}
        >
          Los geht's!
        </Button>
      </form>
    </div>
  );
}

function MotherTongueField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MotherTongue;
  onChange: (value: MotherTongue) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </span>
      <div className="grid grid-cols-3 gap-2">
        {MOTHER_TONGUES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-12 rounded-2xl border-2 font-display text-sm font-extrabold transition",
              value === option.value
                ? "border-primary bg-primary/10"
                : "border-border bg-glass text-ink-soft",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileMenu({
  profile,
  onClose,
  onSave,
  onRequestClear,
}: {
  profile: Profile | null;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  onRequestClear: () => void;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age ?? "");
  const [motherTongue, setMotherTongue] = useState<MotherTongue>(
    profile?.motherTongue ?? "english",
  );
  const t = TRANSLATIONS[motherTongue];
  const valid = name.trim().length > 0 && Number(age) > 0;
  return (
    <div className="fixed inset-0 z-50 flex bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-left glass-panel flex h-full w-full max-w-xs flex-col rounded-r-[28px] bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="grid size-12 place-items-center overflow-hidden rounded-2xl ring-2 ring-border">
            <img src="/images/logo.png" alt="WortWunder" className="size-full object-cover" />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t.closeMenu}>
            <X />
          </Button>
        </div>
        <h2 className="mt-4 font-display text-xl font-extrabold">{t.aboutMe}</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft"
            >
              {t.nameLabel}
            </label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold"
            />
          </div>
          <div>
            <label
              htmlFor="profile-age"
              className="mb-1 block text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft"
            >
              {t.ageLabel}
            </label>
            <Input
              id="profile-age"
              type="number"
              min={1}
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="h-12 rounded-2xl border-2 border-border bg-glass px-4 font-display text-base font-bold"
            />
          </div>
          <MotherTongueField
            label={t.motherTongueLabel}
            value={motherTongue}
            onChange={setMotherTongue}
          />
        </div>
        <Button
          variant="adventure"
          size="lesson"
          className="mt-4 w-full"
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), age: age.trim(), motherTongue })}
        >
          {t.save}
        </Button>

        <div className="mt-auto border-t border-border pt-4">
          <Button
            variant="outline"
            className="w-full rounded-2xl border-2 border-destructive text-destructive hover:bg-danger-soft"
            onClick={onRequestClear}
          >
            <Trash2 className="size-4" /> {t.clearAllData}
          </Button>
          <p className="mt-4 text-center text-[10px] leading-snug text-ink-soft">
            Lesson photos:{" "}
            <a
              href="https://www.pexels.com/license/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Pexels License
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function ClearConfirm({
  t,
  onCancel,
  onConfirm,
}: {
  t: Strings;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 text-center sm:p-7"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-danger-soft">
          <Trash2 className="size-7 text-destructive" />
        </div>
        <h2 className="mt-4 font-display text-xl font-extrabold">{t.deleteEverythingTitle}</h2>
        <p className="mt-2 font-bold text-ink-soft">{t.deleteEverythingBody}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button variant="destructive" className="flex-1 rounded-2xl" onClick={onConfirm}>
            {t.yesDelete}
          </Button>
        </div>
      </div>
    </div>
  );
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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop glass-panel w-full max-w-sm rounded-[28px] bg-card p-6 sm:p-7"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-mint/35">
          <Smartphone className="size-7" />
        </div>
        <h2 className="mt-4 text-center font-display text-xl font-extrabold">
          {t.addToHomeScreen}
        </h2>
        <p className="mt-1 text-center font-bold text-ink-soft">{t.followStepsGrownUp}</p>
        <ol className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-sun/40 font-display text-base font-extrabold ring-2 ring-border">
                {index + 1}
              </span>
              <div className="rounded-2xl bg-glass p-3 ring-1 ring-border">
                <p className="flex items-start gap-1.5 text-sm font-bold leading-snug">
                  <span className="mt-0.5 shrink-0 text-ink-soft [&_svg]:size-4">{step.icon}</span>
                  <span>{step.text}</span>
                </p>
                {step.href && (
                  <a
                    href={step.href}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-display text-sm font-extrabold text-primary-foreground"
                  >
                    {t.openInSafari} <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
        <Button variant="adventure" size="lesson" className="mt-6 w-full" onClick={onClose}>
          {t.gotIt}
        </Button>
      </div>
    </div>
  );
}
