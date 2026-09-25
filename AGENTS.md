<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## What this is

WortWunder ("Deutsch Kids Fun") — a playful, Duolingo-inspired German vocabulary
app for kids. Per the original brief this is a **UI-only prototype**: static/mock
data, no backend, no database, no auth, no real APIs. It has since grown a
`localStorage`-backed profile and PWA install flow, but still has no server-side
persistence.

## Commands

This project uses **bun** (`bun.lock` is the real lockfile; `package-lock.json`
exists but is gitignored and unused — ignore the `npm i` instructions in
README.md, they're stale Lovable boilerplate).

```sh
bun install       # install deps
bun run dev       # vite dev server
bun run build     # production build (nitro, Cloudflare target by default)
bun run build:dev # build in development mode
bun run preview   # preview a production build
bun run lint      # eslint .
bun run format    # prettier --write .
```

There is no test framework configured — no test script, no vitest/jest dependency.

## Architecture

**Stack**: TanStack Start (SSR) + TanStack Router (file-based routing) + TanStack
Query, React 19, Tailwind CSS v4, shadcn/ui ("new-york" style, Radix primitives),
Vite 8 + Nitro.

- **Routing**: file-based under `src/routes/`, conventions documented in
  `src/routes/README.md` (bare `$id` for dynamic segments, `{-$cat}` for optional,
  `$.tsx` for splats, `_layout.tsx` for layouts). `src/routeTree.gen.ts` is
  auto-generated — never hand-edit it. `src/routes/__root.tsx` is the only app
  shell; it must keep `<Outlet />`.
- **Single-page app today**: despite the routing setup, almost the entire app
  currently lives in one route, `src/routes/index.tsx` (~300+ lines) — a client
  state machine (`Screen = "home" | "picture" | "build" | "listen"`) rather than
  separate route files. Profile (`{ name, age }`) is persisted to `localStorage`
  under the key `wortwunder:profile`.
- **Vite config is mostly pre-baked**: `vite.config.ts` just wraps
  `@lovable.dev/vite-tanstack-config`, which already registers TanStack devtools,
  `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, `nitro` (Cloudflare
  build target by default), `VITE_*` env injection, the `@` alias, React/TanStack
  dedupe, error-logger plugins, and sandbox port/host detection. Do not add any
  of those plugins manually — it duplicates them and breaks the build. Extra
  config goes through `defineConfig({ vite: {...}, tanstackStart: {...} })`.
- **Error handling pipeline** spans several files and is easy to miss piecemeal:
  - `src/lib/error-capture.ts` monkey-patches `console.error` to expand
    `Error`/`cause`-chain objects into readable strings and stashes the most
    recent error for 5s.
  - `src/start.ts` installs server middleware: rethrows errors that already carry
    a `statusCode`, otherwise renders the fallback error page. It also defines
    `createCsrfMiddleware` explicitly — TanStack Start only auto-installs CSRF
    protection for server functions when `src/start.ts` is *absent*, so defining
    this file means CSRF must be re-added by hand (already done here — don't
    drop it).
  - `src/server.ts` is the Cloudflare Worker `fetch` entry. It specifically
    detects when h3 has swallowed a thrown error into a generic
    `{"unhandled":true,"message":"HTTPError"}` JSON 500 (which bypasses normal
    try/catch) and substitutes the rendered error page, pulling the real error
    back out of `error-capture.ts`'s stash for logging.
  - `src/lib/lovable-error-reporting.ts` forwards client-side error-boundary
    catches to Lovable's in-editor telemetry hooks (`window.__lovableEvents`,
    `window.__lovableReportRuntimeError`), which only exist inside the Lovable
    preview iframe.
- **PWA / install prompt**: `src/routes/__root.tsx` injects an inline
  pre-hydration `<script>` that captures the `beforeinstallprompt` event onto
  `window.__bip` before React has loaded, so the prompt isn't lost to a race
  with hydration; `index.tsx` picks it up via a `bip-ready` event. iOS/Safari
  (which never fire `beforeinstallprompt`) fall back to an in-app install-help
  flow, including a `?install=1` redirect param that reopens it after a
  redirect. A service worker is registered at `/sw.js`.
- **Path alias**: `@/*` → `src/*` (see `tsconfig.json` and `components.json`).
  `components.json` also drives `shadcn` CLI codegen for `src/components/ui`
  (New York style, slate base, Lucide icons) — prefer regenerating via the
  shadcn CLI over hand-writing new primitives there.
- **Supply-chain guard**: `bunfig.toml` blocks installing any package version
  published less than 24h ago (`minimumReleaseAge`). Adding a package to
  `minimumReleaseAgeExcludes` bypasses this — confirm with the user first.
- **Word pronunciation audio**: vocabulary audio is pre-generated at dev time,
  not synthesized live in the app. `scripts/generate-audio.mjs` uses
  `msedge-tts` (free neural voices via Microsoft Edge's Read Aloud service, no
  API key) to render each word in `WORDS` to an mp3 under `public/audio/` and
  regenerates the manifest `src/data/word-audio.generated.ts` (auto-generated —
  don't hand-edit it; add new words to the `WORDS` array in the script instead,
  then run `bun run generate-audio`). `src/lib/word-audio.ts`'s `playWord(word)`
  plays the matching file, falling back to `speechSynthesis` for any word that
  doesn't have one yet.
- **Per-lesson asset folders**: each vocabulary lesson gets its own folder
  under `public/`, named `<section>.<lesson> <english-name>` (e.g.
  `public/1.1 greetings/`, `public/1.2 family/`), numbered in build order.
  The lesson's tests (see "Lessons and tests" below) share it. Inside, split assets
  into `audio/` and `images/` subfolders:
  - `audio/` — one mp3 per word, filenames in **German**, matching what's
    spoken (e.g. `hallo.mp3`, `guten-morgen.mp3`). Generated the same way as
    all other pronunciation audio (see "Word pronunciation audio" above):
    add the word to `scripts/generate-audio.mjs`'s `WORDS` array with a
    `dir: "<n.n lesson-name>/audio"` field, then run `bun run generate-audio`
    (skips files that already exist unless `--force` is passed). Audio
    shared across multiple tests (letters, UI titles, der/die/das articles,
    sfx) stays flat under `public/audio/` — only give a `WORDS` entry a
    `dir` when the word is specific to one test's own vocabulary.
  - `images/` — one image per word, filenames in **English** (e.g.
    `hello.jpg`, `good-morning.jpg`), independent of the German word so the
    filename stays stable if the German text ever changes.
    - **Square (1:1) is a hard requirement** — every image must be cropped
      to an exact square (640x640 so far) before it's saved, never just
      "close enough." A transparent background is nice-to-have, not
      required — plenty of good source photos have a real background, and
      that's fine as long as the crop is square.
    - The shared `Picture` and `PictureOptions` components (`pieces.tsx`)
      render the image edge-to-edge in its card — `object-cover`, no
      padding, `overflow-hidden` on the card so the square photo clips to
      the card's rounded corners. No white margin around the image, and
      the photo's own corners getting clipped by the card shape is
      expected, not a bug — don't add padding or switch back to
      `object-contain`.
    - **Blurred loading placeholders**: after adding or replacing any image,
      run `bun run generate-image-placeholders` (Python + Pillow). It
      writes a ThumbHash per image into
      `src/data/image-placeholders.generated.ts` (auto-generated — don't
      hand-edit). `LoadingImage` (`pieces.tsx`, used by `Picture`,
      `PictureOptions` and `MatchPairs`) shows that blur, plus a spinner if
      loading takes more than 250ms, until the real image arrives. An image
      with no hash still works; it just gets the spinner alone. This sits on
      top of `image-preload.ts`, it doesn't replace it.
    - Prefer a **real photo of the actual action/scene** (someone actually
      waving hello, actually stretching awake, actually asleep) over an
      abstract icon or object standing in for it (an alarm clock for
      "morning", a suitcase for "goodbye") — kids read a real scene faster
      than a symbol, and it's what the app has moved to for the greetings
      set. This is a non-profit learning prototype, so don't spend time
      chasing a specific license — [Pexels](https://www.pexels.com) (free
      to use, no attribution required) is the default source and has been
      reliable; note the source photo's page URL per file in `CREDITS.md`
      at the repo root anyway, for traceability.
    - Workflow that's worked: `WebSearch` (domain-restricted to
      `pexels.com`) to find a candidate photo page, `curl` the page and
      pull the `og:image` meta tag for the direct CDN image URL (add a few
      seconds of delay between requests — Pexels 403s if you hit it too
      fast), download it, then crop to a square with Python/Pillow
      (`python3 -c "from PIL import Image; ..."` — Pillow is available in
      this environment) — visually check the crop with the `Read` tool
      before finalizing, since a centered crop can still cut off the
      subject on an off-center photo.
    - **Real photos are often ambiguous on their own** — a hello-wave and a
      bye-wave look the same in a still photo. Don't try to fix this by
      picking a "more distinctive" photo; instead every screen that shows
      one of these images also shows the word as a caption below it (the
      `Picture` component's `caption` prop, or `PictureOptions`' `label` —
      both already wired up in `pieces.tsx`). The caption language is
      whichever language the question ISN'T asking the learner to produce:
      a screen that wants a German answer captions the image in the
      learner's mother tongue, and a screen that wants a mother-tongue
      answer would caption it in German (no test currently goes that
      direction, but the prop supports it). The caption is a label under
      the picture, never text baked into the image file itself.

  - `icons/` — the small round pictures on the learning path: `lesson.jpg`
    for the lesson node and `test-<part>.jpg` for each numbered test
    (`test-1.jpg`, `test-2.jpg`, ...), every one different. Each is a tight
    160x160 close-up crop with a single clear subject (busy scenes are
    unreadable at 44px) that still says the lesson's topic at a glance —
    a waving child or a handshake for Hallo, grandparents for Familie, a
    sofa for Haus. A lesson's own `images/` photo is fine when it fits;
    otherwise source a new Pexels photo just for the icon and list it in
    `CREDITS.md`. Set the lesson's
    `assetDir` in `VOCAB_LESSONS`; a missing icon falls back to the
    lesson's emoji. Re-splitting a lesson into more tests needs new
    `test-<part>.jpg` files.

  `src/data/greetings.ts` and `public/1.1 greetings/` are the reference
  example (lesson 1.1) — follow the same layout for every new lesson.
- **Lessons and tests**: a lesson (e.g. 1.2 Familie) is one word list; it is
  split into tests of **10–15 words each**, as evenly as possible, by
  `splitIntoTests` in `src/data/lessons.ts` — lesson 1.2's 37 words become
  tests 1.2.1 (13), 1.2.2 (12), 1.2.3 (12), shown on the path as "Familie 1",
  "Familie 2", ... under an expandable "Familie" node. The test id is the
  key its progress is stored under, so changing a lesson's word count
  re-splits it and resets that lesson's progress. Tests share one quiz
  screen, `VocabQuiz` (`src/components/quiz/VocabQuiz.tsx`), which takes a
  `testId` and a `VocabWord[]`; a new lesson only needs a data file (see
  `src/data/family.ts`) plus an entry in `VOCAB_LESSONS` in
  `src/data/lessons.ts` — the path nodes and quiz routing in
  `src/routes/index.tsx` are generated from it. Nouns keep their
  der/die/das in `full` (shown and spoken); spelling screens drop it via
  `spellingOf`.
- **Path layout**: 1 Grundlagen (the vocabulary lessons), 2 ÖSD
  (no lessons of its own: `OESD_LESSONS` in `index.tsx` lists
  Grundlagen lessons again, optionally renamed, e.g. 1.2 Familie as "Die
  Familienmitglieder"; they open the same tests and share progress), 3 Testing (the hand-written "Tiere" /
  der Vogel walkthrough screens in `index.tsx`).
