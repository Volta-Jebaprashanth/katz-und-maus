import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { TIER_ORDER, type Tier } from "@/lib/quiz-engine";

// A 4-step "you are here" track, one dot per tier in tier order, joined by
// short lines: cleared tiers are solid dots in their color, the tier being
// worked on is a bigger pulsing dot, the rest are grey outlines. Reads as
// "how far along", not as "how hard this exercise is" — a plain "Basic"
// label looked like the exercise itself was easy. Shown on the learning
// path (routes/index.tsx) and next to each question's test name
// (LessonFrame).
const TIER_STEP_COLORS: Record<Tier, { bg: string; border: string; ring: string }> = {
  basic: { bg: "bg-sky-500", border: "border-sky-500", ring: "ring-sky-500/30" },
  easy: { bg: "bg-success", border: "border-success", ring: "ring-success/30" },
  medium: { bg: "bg-amber-400", border: "border-amber-400", ring: "ring-amber-400/30" },
  hard: { bg: "bg-berry", border: "border-berry", ring: "ring-berry/30" },
};

export function TierSteps({ tier }: { tier: Tier }) {
  const current = TIER_ORDER.indexOf(tier);
  return (
    <span
      className="flex shrink-0 items-center"
      role="img"
      aria-label={`Level ${current + 1} of ${TIER_ORDER.length}`}
    >
      {TIER_ORDER.map((t, i) => (
        <Fragment key={t}>
          {i > 0 && (
            <span
              className={cn("h-0.5 w-3", i <= current ? TIER_STEP_COLORS[t].bg : "bg-ink-soft/25")}
            />
          )}
          <span
            className={cn(
              "rounded-full border-2",
              i === current ? "size-3.5 animate-pulse" : "size-2.5",
              i <= current
                ? cn(TIER_STEP_COLORS[t].bg, TIER_STEP_COLORS[t].border)
                : "border-ink-soft/30",
              i === current && cn("ring-2", TIER_STEP_COLORS[t].ring),
            )}
          />
        </Fragment>
      ))}
    </span>
  );
}
