// Local-only header counters:
//   - gems  = floor(correct answers / 100) — every correct answer counts,
//             first try or after a retry, in any quiz screen
//   - sparks = floor(active seconds / 1800) — 1 per 30 minutes of total
//             time spent in the app, added up across visits
//   - today = active seconds since local midnight, for the daily goal
//             (DAILY_GOAL_SECONDS) on the home screen
// "Active" means the page is visible AND the kid touched/clicked/typed in
// the last IDLE_LIMIT_MS, so a tab or PWA left open on a sleeping phone
// doesn't farm sparks. Every write goes straight back to localStorage
// (read-modify-write, no in-memory copy), so "Clear all my data" can't be
// undone by a stale cached value being written back.
const STATS_KEY = "wortwunder:stats";
const CORRECT_PER_GEM = 100;
const SECONDS_PER_SPARK = 30 * 60;
const TICK_MS = 10_000;
const IDLE_LIMIT_MS = 60_000;
export const DAILY_GOAL_SECONDS = 90 * 60;

interface Stats {
  correctAnswers: number;
  activeSeconds: number;
  // Local calendar day ("YYYY-MM-DD") that todaySeconds belongs to.
  day: string;
  todaySeconds: number;
}

// Local time, not UTC, so the day rolls over at the kid's own midnight.
function localDay(): string {
  return new Date().toLocaleDateString("en-CA");
}

function readStats(): Stats {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") as Partial<Stats>;
    const today = localDay();
    return {
      correctAnswers: Number(parsed.correctAnswers) || 0,
      activeSeconds: Number(parsed.activeSeconds) || 0,
      day: today,
      todaySeconds: parsed.day === today ? Number(parsed.todaySeconds) || 0 : 0,
    };
  } catch {
    return { correctAnswers: 0, activeSeconds: 0, day: localDay(), todaySeconds: 0 };
  }
}

function update(change: (stats: Stats) => void) {
  const stats = readStats();
  change(stats);
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* localStorage unavailable — counters just won't persist */
  }
  notifyStats();
}

const listeners = new Set<() => void>();

export function subscribeStats(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Also called after something outside this file wipes localStorage.
export function notifyStats() {
  for (const listener of listeners) listener();
}

export function getGems(): number {
  return Math.floor(readStats().correctAnswers / CORRECT_PER_GEM);
}

export function getSparks(): number {
  return Math.floor(readStats().activeSeconds / SECONDS_PER_SPARK);
}

// Whole minutes of active time today.
export function getTodayMinutes(): number {
  return Math.floor(readStats().todaySeconds / 60);
}

export function recordCorrectAnswer() {
  update((stats) => {
    stats.correctAnswers += 1;
  });
}

// Starts counting active time; returns a cleanup that stops it. Time is
// banked on every tick and whenever the page is hidden/closed, so at most a
// few seconds are lost when the app is killed.
export function startActiveTimeTracking(): () => void {
  let lastInteraction = Date.now();
  let lastTick = Date.now();
  // Tracked here rather than read at bank time: by the time the
  // visibilitychange handler runs the state already says "hidden", and the
  // seconds since the last tick were still spent visible.
  let visible = document.visibilityState === "visible";

  const bank = () => {
    const now = Date.now();
    const elapsed = now - lastTick;
    lastTick = now;
    const active = visible && now - lastInteraction <= IDLE_LIMIT_MS;
    // Cap at one tick so a throttled/suspended timer can't bank a huge gap.
    const seconds = Math.min(elapsed, TICK_MS) / 1000;
    if (active && seconds > 0) {
      update((stats) => {
        stats.activeSeconds += seconds;
        stats.todaySeconds += seconds;
      });
    }
  };
  const onInteraction = () => {
    lastInteraction = Date.now();
  };
  const onVisibility = () => {
    bank();
    visible = document.visibilityState === "visible";
  };

  const interactionEvents = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
  for (const event of interactionEvents) {
    window.addEventListener(event, onInteraction, { passive: true });
  }
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", bank);
  const timer = window.setInterval(bank, TICK_MS);

  return () => {
    bank();
    window.clearInterval(timer);
    for (const event of interactionEvents) window.removeEventListener(event, onInteraction);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", bank);
  };
}
