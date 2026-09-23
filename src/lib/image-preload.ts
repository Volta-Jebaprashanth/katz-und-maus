// Same idea as the audio loader in word-audio.ts, for question pictures: a
// quiz says which images the current question and the next few need
// (setImageWindow) and they're fetched a couple at a time, current question
// first. Requests that fell out of the window before starting are dropped, and
// in-flight ones are cancelled. The browser (and the service worker's image
// cache) keeps the downloaded files, so a picture that's on screen later is
// already local.
const MAX_ACTIVE_LOADS = 2;
const MAX_HELD = 40;

const held = new Map<string, HTMLImageElement>();
const inflight = new Map<string, HTMLImageElement>();
let pending: string[] = [];
let active = 0;

function finish(src: string, img: HTMLImageElement, ok: boolean) {
  if (!inflight.delete(src)) return;
  active--;
  if (ok) {
    held.delete(src);
    held.set(src, img);
    for (const key of held.keys()) {
      if (held.size <= MAX_HELD) break;
      held.delete(key);
    }
  }
  pump();
}

function startLoad(src: string) {
  const img = new Image();
  img.decoding = "async";
  inflight.set(src, img);
  active++;
  img.onload = () => finish(src, img, true);
  img.onerror = () => finish(src, img, false);
  img.src = src;
}

function pump() {
  while (active < MAX_ACTIVE_LOADS && pending.length > 0) {
    const src = pending.shift()!;
    if (!held.has(src) && !inflight.has(src)) startLoad(src);
  }
}

export function setImageWindow(current: string[], upcoming: string[][]) {
  const ordered = [...new Set([...current, ...upcoming.flat()])];
  const wanted = new Set(ordered);
  for (const [src, img] of inflight) {
    if (wanted.has(src)) continue;
    img.onload = null;
    img.onerror = null;
    img.src = "";
    inflight.delete(src);
    active--;
  }
  pending = ordered.filter((src) => !held.has(src) && !inflight.has(src));
  pump();
}
