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
// It writes small mp3s under public/audio/ (or, for a word that belongs to
// one specific test, under that test's own `public/<n.n test name>/audio/`
// folder — see the `dir` field below and AGENTS.md's asset-layout
// convention) and regenerates the manifests at
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
// dir: output folder under public/, relative (default "audio"). Words that
// belong to one specific test's own vocabulary (not shared across tests,
// unlike letters/titles/articles) use their test's folder, e.g.
// "1.1 greetings/audio" — see AGENTS.md.
const WORDS = [
  { word: "der Hund", slug: "hund" },
  { word: "die Katze", slug: "katze" },
  { word: "der Vogel", slug: "vogel" },
  { word: "das Pferd", slug: "pferd" },
  { word: "das Buch", slug: "buch" },
  { word: "der", slug: "article-der" },
  { word: "die", slug: "article-die" },
  { word: "das", slug: "article-das" },
  { word: "Hallo", slug: "hallo", dir: "1.1 greetings/audio" },
  { word: "Guten Morgen", slug: "guten-morgen", dir: "1.1 greetings/audio" },
  { word: "Guten Tag", slug: "guten-tag", dir: "1.1 greetings/audio" },
  { word: "Guten Abend", slug: "guten-abend", dir: "1.1 greetings/audio" },
  { word: "Gute Nacht", slug: "gute-nacht", dir: "1.1 greetings/audio" },
  { word: "Tschüss", slug: "tschuess", dir: "1.1 greetings/audio" },
  { word: "Auf Wiedersehen", slug: "auf-wiedersehen", dir: "1.1 greetings/audio" },
  { word: "Bis bald", slug: "bis-bald", dir: "1.1 greetings/audio" },
  { word: "Wie geht's?", slug: "wie-gehts", dir: "1.1 greetings/audio" },
  { word: "Willkommen", slug: "willkommen", dir: "1.1 greetings/audio" },
  { word: "Bitte", slug: "bitte", dir: "1.1 greetings/audio" },
  { word: "Danke", slug: "danke", dir: "1.1 greetings/audio" },
  { word: "Vielen Dank", slug: "vielen-dank", dir: "1.1 greetings/audio" },
  { word: "Gern geschehen", slug: "gern-geschehen", dir: "1.1 greetings/audio" },
  { word: "Entschuldigung", slug: "entschuldigung", dir: "1.1 greetings/audio" },
  { word: "Sorry", slug: "sorry", dir: "1.1 greetings/audio" },
  { word: "Natürlich", slug: "natuerlich", dir: "1.1 greetings/audio" },
  { word: "Richtig", slug: "richtig", dir: "1.1 greetings/audio" },
  { word: "Kein Problem", slug: "kein-problem", dir: "1.1 greetings/audio" },
  { word: "Alles klar", slug: "alles-klar", dir: "1.1 greetings/audio" },
  { word: "Bis später", slug: "bis-spaeter", dir: "1.1 greetings/audio" },
  { word: "Bis morgen", slug: "bis-morgen", dir: "1.1 greetings/audio" },
  { word: "Viel Glück", slug: "viel-glueck", dir: "1.1 greetings/audio" },
  { word: "Gute Reise", slug: "gute-reise", dir: "1.1 greetings/audio" },
  { word: "die Familie", slug: "familie", dir: "1.2 family/audio" },
  { word: "die Eltern", slug: "eltern", dir: "1.2 family/audio" },
  { word: "der Vater", slug: "vater", dir: "1.2 family/audio" },
  { word: "die Mutter", slug: "mutter", dir: "1.2 family/audio" },
  { word: "der Sohn", slug: "sohn", dir: "1.2 family/audio" },
  { word: "die Tochter", slug: "tochter", dir: "1.2 family/audio" },
  { word: "der Bruder", slug: "bruder", dir: "1.2 family/audio" },
  { word: "die Schwester", slug: "schwester", dir: "1.2 family/audio" },
  { word: "der Großvater", slug: "grossvater", dir: "1.2 family/audio" },
  { word: "die Großmutter", slug: "grossmutter", dir: "1.2 family/audio" },
  { word: "die Großeltern", slug: "grosseltern", dir: "1.2 family/audio" },
  { word: "der Onkel", slug: "onkel", dir: "1.2 family/audio" },
  { word: "die Tante", slug: "tante", dir: "1.2 family/audio" },
  { word: "der Cousin", slug: "cousin", dir: "1.2 family/audio" },
  { word: "die Cousine", slug: "cousine", dir: "1.2 family/audio" },
  { word: "der Ehemann", slug: "ehemann", dir: "1.2 family/audio" },
  { word: "die Ehefrau", slug: "ehefrau", dir: "1.2 family/audio" },
  { word: "der Freund", slug: "freund", dir: "1.2 family/audio" },
  { word: "die Freundin", slug: "freundin", dir: "1.2 family/audio" },
  { word: "das Baby", slug: "baby", dir: "1.2 family/audio" },
  { word: "die Kinder", slug: "kinder", dir: "1.2 family/audio" },
  { word: "der Nachbar", slug: "nachbar", dir: "1.2 family/audio" },
  { word: "die Nachbarin", slug: "nachbarin", dir: "1.2 family/audio" },
  { word: "der Mensch", slug: "mensch", dir: "1.2 family/audio" },
  { word: "die Leute", slug: "leute", dir: "1.2 family/audio" },
  { word: "der Erwachsene", slug: "erwachsene", dir: "1.2 family/audio" },
  { word: "der Name", slug: "name", dir: "1.2 family/audio" },
  { word: "alt", slug: "alt", dir: "1.2 family/audio" },
  { word: "jung", slug: "jung", dir: "1.2 family/audio" },
  // Shared by 1.2 family and 1.4 home, so they stay flat under public/audio/.
  { word: "groß", slug: "gross" },
  { word: "klein", slug: "klein" },
  // Shared by 1.3 food / 1.4 home and 1.5 weather, so they stay flat too.
  { word: "schlecht", slug: "schlecht" },
  { word: "heiß", slug: "heiss" },
  { word: "kalt", slug: "kalt" },
  { word: "schön", slug: "schoen" },
  // Shared by 1.3 food and 1.6 hobbies.
  { word: "kochen", slug: "kochen" },
  { word: "nett", slug: "nett", dir: "1.2 family/audio" },
  { word: "freundlich", slug: "freundlich", dir: "1.2 family/audio" },
  { word: "verheiratet", slug: "verheiratet", dir: "1.2 family/audio" },
  { word: "ledig", slug: "ledig", dir: "1.2 family/audio" },
  { word: "zusammen", slug: "zusammen", dir: "1.2 family/audio" },
  { word: "allein", slug: "allein", dir: "1.2 family/audio" },
  { word: "das Essen", slug: "essen", dir: "1.3 food/audio" },
  { word: "das Frühstück", slug: "fruehstueck", dir: "1.3 food/audio" },
  { word: "das Mittagessen", slug: "mittagessen", dir: "1.3 food/audio" },
  { word: "das Abendessen", slug: "abendessen", dir: "1.3 food/audio" },
  { word: "das Brot", slug: "brot", dir: "1.3 food/audio" },
  { word: "das Brötchen", slug: "broetchen", dir: "1.3 food/audio" },
  { word: "der Reis", slug: "reis", dir: "1.3 food/audio" },
  { word: "die Nudeln", slug: "nudeln", dir: "1.3 food/audio" },
  { word: "die Kartoffel", slug: "kartoffel", dir: "1.3 food/audio" },
  { word: "das Fleisch", slug: "fleisch", dir: "1.3 food/audio" },
  { word: "das Hähnchen", slug: "haehnchen", dir: "1.3 food/audio" },
  { word: "der Fisch", slug: "fisch", dir: "1.3 food/audio" },
  { word: "das Ei", slug: "ei", dir: "1.3 food/audio" },
  { word: "die Wurst", slug: "wurst", dir: "1.3 food/audio" },
  { word: "der Käse", slug: "kaese", dir: "1.3 food/audio" },
  { word: "die Suppe", slug: "suppe", dir: "1.3 food/audio" },
  { word: "der Salat", slug: "salat", dir: "1.3 food/audio" },
  { word: "das Gemüse", slug: "gemuese", dir: "1.3 food/audio" },
  { word: "das Obst", slug: "obst", dir: "1.3 food/audio" },
  { word: "der Apfel", slug: "apfel", dir: "1.3 food/audio" },
  { word: "die Banane", slug: "banane", dir: "1.3 food/audio" },
  { word: "die Orange", slug: "orange", dir: "1.3 food/audio" },
  { word: "die Tomate", slug: "tomate", dir: "1.3 food/audio" },
  { word: "die Zwiebel", slug: "zwiebel", dir: "1.3 food/audio" },
  { word: "die Karotte", slug: "karotte", dir: "1.3 food/audio" },
  { word: "die Milch", slug: "milch", dir: "1.3 food/audio" },
  { word: "das Wasser", slug: "wasser", dir: "1.3 food/audio" },
  { word: "der Kaffee", slug: "kaffee", dir: "1.3 food/audio" },
  { word: "der Tee", slug: "tee", dir: "1.3 food/audio" },
  { word: "der Saft", slug: "saft", dir: "1.3 food/audio" },
  { word: "das Bier", slug: "bier", dir: "1.3 food/audio" },
  { word: "der Wein", slug: "wein", dir: "1.3 food/audio" },
  { word: "der Zucker", slug: "zucker", dir: "1.3 food/audio" },
  { word: "das Salz", slug: "salz", dir: "1.3 food/audio" },
  { word: "der Pfeffer", slug: "pfeffer", dir: "1.3 food/audio" },
  { word: "der Kuchen", slug: "kuchen", dir: "1.3 food/audio" },
  { word: "das Eis", slug: "eis", dir: "1.3 food/audio" },
  { word: "die Schokolade", slug: "schokolade", dir: "1.3 food/audio" },
  { word: "das Restaurant", slug: "restaurant", dir: "1.3 food/audio" },
  { word: "das Café", slug: "cafe", dir: "1.3 food/audio" },
  { word: "die Speisekarte", slug: "speisekarte", dir: "1.3 food/audio" },
  { word: "die Rechnung", slug: "rechnung", dir: "1.3 food/audio" },
  { word: "der Hunger", slug: "hunger", dir: "1.3 food/audio" },
  { word: "der Durst", slug: "durst", dir: "1.3 food/audio" },
  { word: "lecker", slug: "lecker", dir: "1.3 food/audio" },
  { word: "gut", slug: "gut", dir: "1.3 food/audio" },
  { word: "essen", slug: "essen-verb", dir: "1.3 food/audio" },
  { word: "trinken", slug: "trinken", dir: "1.3 food/audio" },
  { word: "bestellen", slug: "bestellen", dir: "1.3 food/audio" },
  { word: "bezahlen", slug: "bezahlen", dir: "1.3 food/audio" },
  { word: "schmecken", slug: "schmecken", dir: "1.3 food/audio" },
  { word: "das Haus", slug: "haus", dir: "1.4 home/audio" },
  { word: "die Wohnung", slug: "wohnung", dir: "1.4 home/audio" },
  { word: "das Zimmer", slug: "zimmer", dir: "1.4 home/audio" },
  { word: "das Schlafzimmer", slug: "schlafzimmer", dir: "1.4 home/audio" },
  { word: "das Wohnzimmer", slug: "wohnzimmer", dir: "1.4 home/audio" },
  { word: "das Badezimmer", slug: "badezimmer", dir: "1.4 home/audio" },
  { word: "die Küche", slug: "kueche", dir: "1.4 home/audio" },
  { word: "der Flur", slug: "flur", dir: "1.4 home/audio" },
  { word: "der Balkon", slug: "balkon", dir: "1.4 home/audio" },
  { word: "der Garten", slug: "garten", dir: "1.4 home/audio" },
  { word: "die Tür", slug: "tuer", dir: "1.4 home/audio" },
  { word: "das Fenster", slug: "fenster", dir: "1.4 home/audio" },
  { word: "die Wand", slug: "wand", dir: "1.4 home/audio" },
  { word: "der Boden", slug: "boden", dir: "1.4 home/audio" },
  { word: "die Treppe", slug: "treppe", dir: "1.4 home/audio" },
  { word: "der Tisch", slug: "tisch", dir: "1.4 home/audio" },
  { word: "der Stuhl", slug: "stuhl", dir: "1.4 home/audio" },
  { word: "das Bett", slug: "bett", dir: "1.4 home/audio" },
  { word: "das Sofa", slug: "sofa", dir: "1.4 home/audio" },
  { word: "der Schrank", slug: "schrank", dir: "1.4 home/audio" },
  { word: "das Regal", slug: "regal", dir: "1.4 home/audio" },
  { word: "die Lampe", slug: "lampe", dir: "1.4 home/audio" },
  { word: "der Fernseher", slug: "fernseher", dir: "1.4 home/audio" },
  { word: "der Kühlschrank", slug: "kuehlschrank", dir: "1.4 home/audio" },
  { word: "der Herd", slug: "herd", dir: "1.4 home/audio" },
  { word: "der Ofen", slug: "ofen", dir: "1.4 home/audio" },
  { word: "die Waschmaschine", slug: "waschmaschine", dir: "1.4 home/audio" },
  { word: "die Dusche", slug: "dusche", dir: "1.4 home/audio" },
  { word: "die Badewanne", slug: "badewanne", dir: "1.4 home/audio" },
  { word: "die Toilette", slug: "toilette", dir: "1.4 home/audio" },
  { word: "der Spiegel", slug: "spiegel", dir: "1.4 home/audio" },
  { word: "der Schlüssel", slug: "schluessel", dir: "1.4 home/audio" },
  { word: "die Tasche", slug: "tasche", dir: "1.4 home/audio" },
  { word: "das Handy", slug: "handy", dir: "1.4 home/audio" },
  { word: "der Computer", slug: "computer", dir: "1.4 home/audio" },
  { word: "sauber", slug: "sauber", dir: "1.4 home/audio" },
  { word: "schmutzig", slug: "schmutzig", dir: "1.4 home/audio" },
  { word: "bequem", slug: "bequem", dir: "1.4 home/audio" },
  { word: "wohnen", slug: "wohnen", dir: "1.4 home/audio" },
  { word: "öffnen", slug: "oeffnen", dir: "1.4 home/audio" },
  { word: "schließen", slug: "schliessen", dir: "1.4 home/audio" },
  { word: "putzen", slug: "putzen", dir: "1.4 home/audio" },
  { word: "schlafen", slug: "schlafen", dir: "1.4 home/audio" },
  { word: "das Wetter", slug: "wetter", dir: "1.5 weather/audio" },
  { word: "die Sonne", slug: "sonne", dir: "1.5 weather/audio" },
  { word: "der Regen", slug: "regen", dir: "1.5 weather/audio" },
  { word: "der Schnee", slug: "schnee", dir: "1.5 weather/audio" },
  { word: "der Wind", slug: "wind", dir: "1.5 weather/audio" },
  { word: "die Wolke", slug: "wolke", dir: "1.5 weather/audio" },
  { word: "der Himmel", slug: "himmel", dir: "1.5 weather/audio" },
  { word: "der Nebel", slug: "nebel", dir: "1.5 weather/audio" },
  { word: "das Gewitter", slug: "gewitter", dir: "1.5 weather/audio" },
  { word: "der Sturm", slug: "sturm", dir: "1.5 weather/audio" },
  { word: "die Temperatur", slug: "temperatur", dir: "1.5 weather/audio" },
  { word: "der Grad", slug: "grad", dir: "1.5 weather/audio" },
  { word: "der Sommer", slug: "sommer", dir: "1.5 weather/audio" },
  { word: "der Winter", slug: "winter", dir: "1.5 weather/audio" },
  { word: "der Frühling", slug: "fruehling", dir: "1.5 weather/audio" },
  { word: "der Herbst", slug: "herbst", dir: "1.5 weather/audio" },
  { word: "sonnig", slug: "sonnig", dir: "1.5 weather/audio" },
  { word: "regnerisch", slug: "regnerisch", dir: "1.5 weather/audio" },
  { word: "windig", slug: "windig", dir: "1.5 weather/audio" },
  { word: "bewölkt", slug: "bewoelkt", dir: "1.5 weather/audio" },
  { word: "neblig", slug: "neblig", dir: "1.5 weather/audio" },
  { word: "warm", slug: "warm", dir: "1.5 weather/audio" },
  { word: "kühl", slug: "kuehl", dir: "1.5 weather/audio" },
  { word: "trocken", slug: "trocken", dir: "1.5 weather/audio" },
  { word: "nass", slug: "nass", dir: "1.5 weather/audio" },
  { word: "klar", slug: "klar", dir: "1.5 weather/audio" },
  { word: "regnen", slug: "regnen", dir: "1.5 weather/audio" },
  { word: "schneien", slug: "schneien", dir: "1.5 weather/audio" },
  { word: "frieren", slug: "frieren", dir: "1.5 weather/audio" },
  { word: "scheinen", slug: "scheinen", dir: "1.5 weather/audio" },
  { word: "das Hobby", slug: "hobby", dir: "1.6 hobbies/audio" },
  { word: "die Hobbys", slug: "hobbys", dir: "1.6 hobbies/audio" },
  { word: "der Sport", slug: "sport", dir: "1.6 hobbies/audio" },
  { word: "das Fußballspielen", slug: "fussballspielen", dir: "1.6 hobbies/audio" },
  { word: "das Schwimmen", slug: "schwimmen", dir: "1.6 hobbies/audio" },
  { word: "das Laufen", slug: "laufen", dir: "1.6 hobbies/audio" },
  { word: "das Radfahren", slug: "radfahren", dir: "1.6 hobbies/audio" },
  { word: "das Wandern", slug: "wandern", dir: "1.6 hobbies/audio" },
  { word: "das Tanzen", slug: "tanzen", dir: "1.6 hobbies/audio" },
  { word: "das Singen", slug: "singen", dir: "1.6 hobbies/audio" },
  { word: "das Kochen", slug: "kochen", dir: "1.6 hobbies/audio" },
  { word: "das Backen", slug: "backen", dir: "1.6 hobbies/audio" },
  { word: "das Lesen", slug: "lesen", dir: "1.6 hobbies/audio" },
  { word: "das Schreiben", slug: "schreiben", dir: "1.6 hobbies/audio" },
  { word: "das Zeichnen", slug: "zeichnen", dir: "1.6 hobbies/audio" },
  { word: "das Malen", slug: "malen", dir: "1.6 hobbies/audio" },
  { word: "das Fotografieren", slug: "fotografieren", dir: "1.6 hobbies/audio" },
  { word: "das Reisen", slug: "reisen", dir: "1.6 hobbies/audio" },
  { word: "das Angeln", slug: "angeln", dir: "1.6 hobbies/audio" },
  { word: "das Spielen", slug: "spielen", dir: "1.6 hobbies/audio" },
  { word: "die Musik", slug: "musik", dir: "1.6 hobbies/audio" },
  { word: "der Film", slug: "film", dir: "1.6 hobbies/audio" },
  { word: "das Computerspiel", slug: "computerspiel", dir: "1.6 hobbies/audio" },
  { word: "das Videospiel", slug: "videospiel", dir: "1.6 hobbies/audio" },
  { word: "das Instrument", slug: "instrument", dir: "1.6 hobbies/audio" },
  { word: "die Gitarre", slug: "gitarre", dir: "1.6 hobbies/audio" },
  { word: "das Klavier", slug: "klavier", dir: "1.6 hobbies/audio" },
  { word: "spielen", slug: "spielen-verb", dir: "1.6 hobbies/audio" },
  { word: "lesen", slug: "lesen-verb", dir: "1.6 hobbies/audio" },
  { word: "schreiben", slug: "schreiben-verb", dir: "1.6 hobbies/audio" },
  { word: "schwimmen", slug: "schwimmen-verb", dir: "1.6 hobbies/audio" },
  { word: "laufen", slug: "laufen-verb", dir: "1.6 hobbies/audio" },
  { word: "tanzen", slug: "tanzen-verb", dir: "1.6 hobbies/audio" },
  { word: "singen", slug: "singen-verb", dir: "1.6 hobbies/audio" },
  { word: "backen", slug: "backen-verb", dir: "1.6 hobbies/audio" },
  { word: "reisen", slug: "reisen-verb", dir: "1.6 hobbies/audio" },
  { word: "wandern", slug: "wandern-verb", dir: "1.6 hobbies/audio" },
  { word: "fotografieren", slug: "fotografieren-verb", dir: "1.6 hobbies/audio" },
  { word: "zeichnen", slug: "zeichnen-verb", dir: "1.6 hobbies/audio" },
  { word: "malen", slug: "malen-verb", dir: "1.6 hobbies/audio" },
  { word: "hören", slug: "hoeren", dir: "1.6 hobbies/audio" },
  { word: "sehen", slug: "sehen", dir: "1.6 hobbies/audio" },
  { word: "machen", slug: "machen", dir: "1.6 hobbies/audio" },
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

for (const { word, slug, dir } of [...WORDS, ...TITLES]) {
  const outDir = path.join(ROOT, "public", dir ?? "audio");
  await mkdir(outDir, { recursive: true });
  await writeIfMissing(
    path.join(outDir, `${slug}.mp3`),
    `${dir ?? "audio"}/${slug}.mp3`,
    word,
    "-15%",
  );
}

for (const { letter, name } of LETTERS) {
  const slug = letter.toLowerCase();
  await writeIfMissing(path.join(LETTERS_DIR, `${slug}.mp3`), `letters/${slug}.mp3`, name, "-10%");
}

const wordManifestBody = [...WORDS, ...TITLES]
  .map(({ word, slug, dir }) => `  ${JSON.stringify(word)}: "/${dir ?? "audio"}/${slug}.mp3",`)
  .join("\n");
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

const letterManifestBody = LETTERS.map(
  ({ letter }) => `  ${JSON.stringify(letter)}: "/audio/letters/${letter.toLowerCase()}.mp3",`,
).join("\n");
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
