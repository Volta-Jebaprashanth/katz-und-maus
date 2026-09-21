#!/usr/bin/env node
// Generates German pronunciation audio using Microsoft Edge's free neural
// TTS voices (via `msedge-tts` — the same voices behind Edge's "Read Aloud"
// feature, no API key or account needed).
//
// Usage:
//   bun run generate-audio             generate only missing files
//   bun run generate-audio -- --force  regenerate every file
//
// To add a new word or lesson-screen title: add an entry to WORDS or TITLES
// below, then rerun this script.
// It writes small mp3s under public/audio/ and regenerates the manifests at
// src/data/word-audio.generated.ts and src/data/letter-audio.generated.ts
// that the app imports at runtime.

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const LETTERS_DIR = path.join(AUDIO_DIR, "letters");
const WORD_MANIFEST_PATH = path.join(ROOT, "src", "data", "word-audio.generated.ts");
const LETTER_MANIFEST_PATH = path.join(ROOT, "src", "data", "letter-audio.generated.ts");

const VOICE = "de-DE-KatjaNeural"; // friendly female voice, good for kids

// word: what gets spoken (including the article, since kids need to learn it).
// slug: the mp3 filename, also used as the word's stable id.
const WORDS = [
  { word: "der Hund", slug: "hund" },
  { word: "die Katze", slug: "katze" },
  { word: "der Vogel", slug: "vogel" },
  { word: "das Pferd", slug: "pferd" },
  { word: "der Apfel", slug: "apfel" },
  { word: "die Banane", slug: "banane" },
  { word: "das Buch", slug: "buch" },
  { word: "das Wasser", slug: "wasser" },
  { word: "der", slug: "article-der" },
  { word: "die", slug: "article-die" },
  { word: "das", slug: "article-das" },
];

// Full lesson-screen titles (e.g. "Was ist das?"), spoken when a kid taps the
// title. Same word/slug shape as WORDS — msedge-tts handles full sentences
// just as well as single words, so these render and manifest the same way.
const TITLES = [
  { word: "Was ist das?", slug: "title-was-ist-das" },
  { word: "Welches Bild ist das?", slug: "title-welches-bild-ist-das" },
  { word: "Was bedeutet das?", slug: "title-was-bedeutet-das" },
  { word: "Wie sagt man das auf Deutsch?", slug: "title-wie-sagt-man-das-auf-deutsch" },
  { word: "Welcher Artikel passt?", slug: "title-welcher-artikel-passt" },
  { word: "Baue das Wort", slug: "title-baue-das-wort" },
  { word: "Welcher Buchstabe fehlt?", slug: "title-welcher-buchstabe-fehlt" },
  { word: "Ordne die Buchstaben", slug: "title-ordne-die-buchstaben" },
  { word: "Was hörst du?", slug: "title-was-hoerst-du" },
  { word: "Welches Bild hörst du?", slug: "title-welches-bild-hoerst-du" },
  { word: "Finde die Paare", slug: "title-finde-die-paare" },
];

// The German alphabet, for the word-builder's letter tiles. `name` spells out
// how the letter is actually said in German (e.g. P -> "Peh", not the English
// "pee") as a normal German word/syllable, so the TTS engine's ordinary
// German pronunciation rules produce the right sound instead of relying on
// its (often English-biased) bare-letter reading.
//
// Note on E and I specifically: their letter names are long vowels ("ay",
// "ee"), but the obvious spellings "Eh" and "Ih" are also common German
// interjections ("eh?", "ih!") that real speech-recognition-trained TTS
// lexicons tend to read short/clipped, not as the long recitation vowel we
// want. "Ee"/"Ie" use German's standard long-vowel digraph spelling instead
// (as in "Idee", "wie") and aren't real standalone words, avoiding that
// ambiguity. (This TTS API doesn't support SSML for finer control — plain
// text is all it accepts.)
const LETTERS = [
  { letter: "A", name: "Ah" },
  { letter: "B", name: "Beh" },
  { letter: "C", name: "Zeh" },
  { letter: "D", name: "Deh" },
  { letter: "E", name: "Ee" },
  { letter: "F", name: "Ef" },
  { letter: "G", name: "Geh" },
  { letter: "H", name: "Hah" },
  { letter: "I", name: "Ie" },
  { letter: "J", name: "Jott" },
  { letter: "K", name: "Kah" },
  { letter: "L", name: "El" },
  { letter: "M", name: "Em" },
  { letter: "N", name: "En" },
  { letter: "O", name: "Oh" },
  { letter: "P", name: "Peh" },
  { letter: "Q", name: "Kuh" },
  { letter: "R", name: "Er" },
  { letter: "S", name: "Es" },
  { letter: "T", name: "Teh" },
  { letter: "U", name: "Uh" },
  { letter: "V", name: "Fau" },
  { letter: "W", name: "Weh" },
  { letter: "X", name: "Iks" },
  { letter: "Y", name: "Ypsilon" },
  { letter: "Z", name: "Zett" },
];

const force = process.argv.includes("--force");

async function synthesize(text, rate) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate });
  const chunks = [];
  for await (const chunk of audioStream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function writeIfMissing(filePath, label, text, rate) {
  if (existsSync(filePath) && !force) {
    console.log(`skip   ${label} (already exists, use --force to regenerate)`);
    return;
  }
  const buffer = await synthesize(text, rate);
  await writeFile(filePath, buffer);
  console.log(`wrote  ${label} (${buffer.length} bytes) — "${text}"`);
}

await mkdir(AUDIO_DIR, { recursive: true });
await mkdir(LETTERS_DIR, { recursive: true });

for (const { word, slug } of [...WORDS, ...TITLES]) {
  await writeIfMissing(path.join(AUDIO_DIR, `${slug}.mp3`), `${slug}.mp3`, word, "-15%");
}

for (const { letter, name } of LETTERS) {
  const slug = letter.toLowerCase();
  await writeIfMissing(path.join(LETTERS_DIR, `${slug}.mp3`), `letters/${slug}.mp3`, name, "-10%");
}

const wordManifestBody = [...WORDS, ...TITLES].map(({ word, slug }) => `  ${JSON.stringify(word)}: "/audio/${slug}.mp3",`).join("\n");
await writeFile(
  WORD_MANIFEST_PATH,
  `// AUTO-GENERATED by scripts/generate-audio.mjs — do not edit by hand.
// Maps a full German word (with article) or lesson-screen title to its
// pronunciation audio file.
export const WORD_AUDIO: Record<string, string> = {
${wordManifestBody}
};
`,
);
console.log(`wrote  ${path.relative(ROOT, WORD_MANIFEST_PATH)}`);

const letterManifestBody = LETTERS.map(({ letter }) => `  ${JSON.stringify(letter)}: "/audio/letters/${letter.toLowerCase()}.mp3",`).join("\n");
await writeFile(
  LETTER_MANIFEST_PATH,
  `// AUTO-GENERATED by scripts/generate-audio.mjs — do not edit by hand.
// Maps an uppercase German letter to its pronunciation audio file.
export const LETTER_AUDIO: Record<string, string> = {
${letterManifestBody}
};
`,
);
console.log(`wrote  ${path.relative(ROOT, LETTER_MANIFEST_PATH)}`);
