import type { MotherTongue } from "@/lib/i18n";

// Vocabulary for the "Hallo!" (greetings) lesson, test 1.1. Unlike
// TIERE_WORDS these are phrases, not nouns, so they have no der/die/das
// article.
//
// Per-test asset layout (see AGENTS.md for the full convention): this
// test's own audio/images live under `public/1.1 greetings/`, split into
// `audio/` (German filenames, matching the spoken word) and `images/`
// (English filenames, independent of the German word).
//
// `image` files under public/1.1 greetings/images/ are real photos of the
// actual action/scene (someone waving hello, stretching awake, sleeping,
// etc.) rather than abstract icon cutouts, cropped/resized to a square
// 640x640 so a 1:1 display never has to cut off the subject. Photos alone
// can't disambiguate near-identical gestures (a hello-wave and a bye-wave
// look the same), so every screen that shows one of these images also
// shows the word as a caption below it — see GreetingsQuiz.tsx. Sourced
// from Pexels (free to use, no attribution required); photo pages (id ->
// source):
//   hello            https://www.pexels.com/photo/man-with-eyeglasses-smiling-while-waving-a-hand-6937809/
//   good-morning     https://www.pexels.com/photo/man-sitting-on-bed-stretching-his-arms-7445329/
//   good-day         https://www.pexels.com/photo/positive-young-multiethnic-friends-greeting-each-other-on-street-6140414/
//   good-evening     https://www.pexels.com/photo/silhouette-of-man-standing-on-beach-during-sunset-3956523/
//   good-night       https://www.pexels.com/photo/child-sleeping-in-bed-10608041/
//   bye              https://www.pexels.com/photo/woman-and-a-child-waving-6912576/
//   goodbye          https://www.pexels.com/photo/senior-man-waving-goodbye-and-walking-in-airport-corridor-4173238/
//   see-you-soon     https://www.pexels.com/photo/person-waving-hand-at-window-of-old-train-7720563/
//   how-are-you      https://www.pexels.com/photo/two-women-talking-and-smiling-5542877/
//   welcome          https://www.pexels.com/photo/smiling-woman-standing-in-doorway-11483619/
// See CREDITS.md at the repo root for the full source list.
// Matches the public/1.1 greetings/ asset folder and is the stable id this
// test's progress is stored under (see src/lib/progress-store.ts).
export const GREETINGS_TEST_ID = "1.1";

export interface GreetingWord {
  id: string;
  image: string;
  full: string;
  english: string;
  tamil: string;
  sinhala: string;
}

export const GREETINGS_WORDS: GreetingWord[] = [
  {
    id: "hallo",
    image: "/1.1 greetings/images/hello.jpg",
    full: "Hallo",
    english: "Hello",
    tamil: "வணக்கம்",
    sinhala: "ආයුබෝවන්",
  },
  {
    id: "guten-morgen",
    image: "/1.1 greetings/images/good-morning.jpg",
    full: "Guten Morgen",
    english: "Good morning",
    tamil: "காலை வணக்கம்",
    sinhala: "සුභ උදෑසනක්",
  },
  {
    id: "guten-tag",
    image: "/1.1 greetings/images/good-day.jpg",
    full: "Guten Tag",
    english: "Good day",
    tamil: "நல்ல பகல் வணக்கம்",
    sinhala: "සුභ දවසක්",
  },
  {
    id: "guten-abend",
    image: "/1.1 greetings/images/good-evening.jpg",
    full: "Guten Abend",
    english: "Good evening",
    tamil: "மாலை வணக்கம்",
    sinhala: "සුභ සන්ධ්‍යාවක්",
  },
  {
    id: "gute-nacht",
    image: "/1.1 greetings/images/good-night.jpg",
    full: "Gute Nacht",
    english: "Good night",
    tamil: "இனிய இரவு",
    sinhala: "සුභ රාත්‍රියක්",
  },
  {
    id: "tschuess",
    image: "/1.1 greetings/images/bye.jpg",
    full: "Tschüss",
    english: "Bye",
    tamil: "பை பை",
    sinhala: "බායි",
  },
  {
    id: "auf-wiedersehen",
    image: "/1.1 greetings/images/goodbye.jpg",
    full: "Auf Wiedersehen",
    english: "Goodbye",
    tamil: "மீண்டும் சந்திப்போம்",
    sinhala: "නැවත හමුවෙමු",
  },
  {
    id: "bis-bald",
    image: "/1.1 greetings/images/see-you-soon.jpg",
    full: "Bis bald",
    english: "See you soon",
    tamil: "விரைவில் சந்திப்போம்",
    sinhala: "ඉක්මනින් හමුවෙමු",
  },
  {
    id: "wie-gehts",
    image: "/1.1 greetings/images/how-are-you.jpg",
    full: "Wie geht's?",
    english: "How are you?",
    tamil: "எப்படி இருக்கிறீர்கள்?",
    sinhala: "කොහොමද?",
  },
  {
    id: "willkommen",
    image: "/1.1 greetings/images/welcome.jpg",
    full: "Willkommen",
    english: "Welcome",
    tamil: "வரவேற்பு",
    sinhala: "සාදරයෙන් පිළිගනිමු",
  },
];

export function greetingMeaning(word: GreetingWord, lang: MotherTongue): string {
  return word[lang];
}
