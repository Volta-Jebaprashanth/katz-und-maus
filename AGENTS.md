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
