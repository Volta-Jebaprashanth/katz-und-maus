import { WORD_AUDIO } from "@/data/word-audio.generated";
import { LETTER_AUDIO } from "@/data/letter-audio.generated";

// Playback goes through the Web Audio API rather than <audio> elements: clips
// are fetched and decoded into memory ahead of time, so a tap starts the sound
// with no network, element or decoding work, and the silence the TTS renders
// at the start of every mp3 is skipped. A clip that isn't decoded yet falls
// back to a plain <audio> element so a very early tap still plays.
//
// Nothing here loads a whole lesson. A quiz tells the loader which clips the
// current question and the next few need (setAudioWindow); the loader fetches
// those a few at a time, current question first, drops requests that fell out
// of the window, and keeps decoded word clips in a small LRU so memory stays
// flat however many words a test has. Letters and screen titles are shared by
// every lesson, so they're kept once loaded.
interface Clip {
  buffer: AudioBuffer;
  offset: number;
}
export interface AudioNeeds {
  words: string[];
  letters: string[];
}

const LOOKAHEAD_QUESTIONS = 3;
const MAX_ACTIVE_LOADS = 3;
const MAX_LOOSE_CLIPS = 60;
const SILENCE_THRESHOLD = 0.02;
const LEAD_IN_SECONDS = 0.01;
const TITLE_SRCS = Object.values(WORD_AUDIO).filter((src) => src.startsWith("/audio/title-"));

const clips = new Map<string, Clip>();
const inflight = new Map<string, AbortController>();
const listeners = new Set<() => void>();
let pending: string[] = [];
let active = 0;
let windowSrcs = new Set<string>();
let audioCtx: AudioContext | null = null;

// Only one clip plays at a time — otherwise rapid taps (e.g. spelling a word
// letter by letter) pile up overlapping audio.
let activeSource: AudioBufferSourceNode | null = null;
let activeElement: HTMLAudioElement | null = null;

export function constrainedNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  return Boolean(
    connection &&
    (connection.saveData ||
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"),
  );
}

// How many upcoming questions to fetch ahead: none on data-saver / 2G, so the
// current question gets the whole connection.
export function lookaheadQuestions(): number {
  return constrainedNetwork() ? 0 : LOOKAHEAD_QUESTIONS;
}

function isPinned(src: string): boolean {
  return src.startsWith("/audio/letters/") || src.startsWith("/audio/title-");
}

function firstAudibleOffset(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]!) > SILENCE_THRESHOLD)
      return Math.max(0, i / buffer.sampleRate - LEAD_IN_SECONDS);
  }
  return 0;
}

function notify() {
  for (const listener of listeners) listener();
}

function evict() {
  let loose = 0;
  for (const src of clips.keys()) if (!isPinned(src)) loose++;
  for (const src of clips.keys()) {
    if (loose <= MAX_LOOSE_CLIPS) break;
    if (isPinned(src) || windowSrcs.has(src)) continue;
    clips.delete(src);
    loose--;
  }
}

function store(src: string, clip: Clip) {
  clips.delete(src);
  clips.set(src, clip);
  evict();
  notify();
}

function startLoad(src: string) {
  const controller = new AbortController();
  inflight.set(src, controller);
  active++;
  void (async () => {
    try {
      if (typeof OfflineAudioContext === "undefined") return;
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok) return;
      const bytes = await response.arrayBuffer();
      const buffer = await new OfflineAudioContext(1, 1, 24000).decodeAudioData(bytes);
      store(src, { buffer, offset: firstAudibleOffset(buffer) });
    } catch {
      /* aborted or failed — it's requested again the next time it's needed */
    } finally {
      inflight.delete(src);
      active--;
      pump();
    }
  })();
}

function pump() {
  const limit = constrainedNetwork() ? 1 : MAX_ACTIVE_LOADS;
  while (active < limit && pending.length > 0) {
    const src = pending.shift()!;
    if (!clips.has(src) && !inflight.has(src)) startLoad(src);
  }
}

function enqueue(srcs: string[], front = false) {
  const fresh = srcs.filter((src) => !clips.has(src) && !inflight.has(src));
  const rest = pending.filter((src) => !fresh.includes(src));
  pending = front ? [...fresh, ...rest] : [...rest, ...fresh];
  pump();
}

function srcsOf({ words, letters }: AudioNeeds): string[] {
  const srcs: string[] = [];
  for (const word of words) {
    const src = WORD_AUDIO[word];
    if (src) srcs.push(src);
  }
  for (const letter of letters) {
    const src = LETTER_AUDIO[letter.toUpperCase()];
    if (src) srcs.push(src);
  }
  return srcs;
}

// Tells the loader what the quiz needs now: the clips for the current
// question (fetched first), then those for the next few, then the shared
// screen titles. Anything requested earlier that hasn't started and isn't in
// this window is dropped, and in-flight requests that fell out of it are
// aborted.
export function setAudioWindow(current: AudioNeeds, upcoming: AudioNeeds[]) {
  const ordered = [...new Set([...srcsOf(current), ...upcoming.flatMap(srcsOf)])];
  windowSrcs = new Set(ordered);
  const wanted = new Set([...ordered, ...TITLE_SRCS]);
  for (const [src, controller] of inflight) if (!wanted.has(src)) controller.abort();
  pending = [];
  enqueue([...ordered, ...TITLE_SRCS]);
}

// For screens outside the quiz's window (the hand-written Vogel lesson):
// fetch these clips ahead of anything already queued.
export function preloadWords(words: string[]) {
  enqueue(srcsOf({ words, letters: [] }), true);
}

export function preloadLetters(letters: string[]) {
  enqueue(srcsOf({ words: [], letters }), true);
}

export function isWordReady(word: string): boolean {
  const src = WORD_AUDIO[word];
  return !src || clips.has(src);
}

export function subscribeAudio(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function stopActive() {
  activeElement?.pause();
  try {
    activeSource?.stop();
  } catch {
    /* already ended */
  }
  activeSource = null;
}

function playClip(src: string) {
  stopActive();
  const ready = clips.get(src);
  if (ready) {
    clips.delete(src);
    clips.set(src, ready);
    audioCtx ??= new AudioContext();
    if (audioCtx.state !== "running") void audioCtx.resume();
    const source = audioCtx.createBufferSource();
    source.buffer = ready.buffer;
    source.connect(audioCtx.destination);
    source.start(0, ready.offset);
    activeSource = source;
    return;
  }
  enqueue([src], true);
  const audio = new Audio(src);
  activeElement = audio;
  audio.play().catch(() => {
    /* autoplay/decoding blocked — user can just tap again */
  });
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

// Plays a recorded pronunciation for `word` if one has been generated
// (see scripts/generate-audio.mjs). Falls back to the device's speech
// synthesis for words that don't have an audio file yet, so new vocabulary
// still speaks something before its audio is recorded.
export function playWord(word: string) {
  const src = WORD_AUDIO[word];
  if (src) playClip(src);
  else speak(word);
}

// Plays the German name of a single letter (e.g. "P" -> "peh"), for the
// word-builder's letter tiles.
export function playLetter(letter: string) {
  const src = LETTER_AUDIO[letter.toUpperCase()];
  if (src) playClip(src);
  else speak(letter);
}
