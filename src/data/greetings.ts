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
//   please           https://www.pexels.com/photo/monochrome-photograph-of-a-girl-with-her-hands-together-6311786/
//   thank-you        https://www.pexels.com/photo/a-woman-in-black-shirt-with-her-hand-on-chest-9017012/
//   many-thanks      https://www.pexels.com/photo/man-giving-flowers-to-a-woman-5331258/
//   youre-welcome    https://www.pexels.com/photo/elderly-woman-receiving-a-paper-bag-of-groceries-7345431/
//   excuse-me        https://www.pexels.com/photo/man-raising-hand-at-gathering-17043072/
//   sorry            https://www.pexels.com/photo/black-man-apologizing-while-talking-with-girlfriend-5699848/
//   of-course        https://www.pexels.com/photo/a-person-in-tie-dye-sweater-doing-thumbs-up-7202642/
//   correct          https://www.pexels.com/photo/a-person-marking-a-test-paper-6684373/
//   no-problem       https://www.pexels.com/photo/cheerful-young-man-in-sweater-shrugging-indoors-30672381/
//   everything-okay  https://www.pexels.com/photo/confident-businessman-making-ok-gesture-outdoors-36712859/
//   see-you-later    https://www.pexels.com/photo/happy-woman-waving-goodbye-5537576/
//   see-you-tomorrow https://www.pexels.com/photo/silhouette-of-friends-walking-in-a-park-at-sunset-36763443/
//   good-luck        https://www.pexels.com/photo/person-doing-fingers-crossed-9017426/
//   have-a-good-trip https://www.pexels.com/photo/stylish-happy-traveler-with-suitcase-in-airport-hallway-4173229/
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
  {
    id: "bitte",
    image: "/1.1 greetings/images/please.jpg",
    full: "Bitte",
    english: "Please",
    tamil: "தயவுசெய்து",
    sinhala: "කරුණාකර",
  },
  {
    id: "danke",
    image: "/1.1 greetings/images/thank-you.jpg",
    full: "Danke",
    english: "Thank you",
    tamil: "நன்றி",
    sinhala: "ස්තූතියි",
  },
  {
    id: "vielen-dank",
    image: "/1.1 greetings/images/many-thanks.jpg",
    full: "Vielen Dank",
    english: "Many thanks",
    tamil: "மிக்க நன்றி",
    sinhala: "බොහොම ස්තූතියි",
  },
  {
    id: "gern-geschehen",
    image: "/1.1 greetings/images/youre-welcome.jpg",
    full: "Gern geschehen",
    english: "You're welcome",
    tamil: "மகிழ்ச்சியுடன்",
    sinhala: "සතුටින්",
  },
  {
    id: "entschuldigung",
    image: "/1.1 greetings/images/excuse-me.jpg",
    full: "Entschuldigung",
    english: "Excuse me",
    tamil: "மன்னிக்கவும்",
    sinhala: "සමාවෙන්න",
  },
  {
    id: "sorry",
    image: "/1.1 greetings/images/sorry.jpg",
    full: "Sorry",
    english: "Sorry",
    tamil: "வருந்துகிறேன்",
    sinhala: "කණගාටුයි",
  },
  {
    id: "natuerlich",
    image: "/1.1 greetings/images/of-course.jpg",
    full: "Natürlich",
    english: "Of course",
    tamil: "நிச்சயமாக",
    sinhala: "ඇත්තෙන්ම",
  },
  {
    id: "richtig",
    image: "/1.1 greetings/images/correct.jpg",
    full: "Richtig",
    english: "Correct",
    tamil: "சரி",
    sinhala: "නිවැරදියි",
  },
  {
    id: "kein-problem",
    image: "/1.1 greetings/images/no-problem.jpg",
    full: "Kein Problem",
    english: "No problem",
    tamil: "பிரச்சனை இல்லை",
    sinhala: "ප්‍රශ්නයක් නැහැ",
  },
  {
    id: "alles-klar",
    image: "/1.1 greetings/images/everything-okay.jpg",
    full: "Alles klar",
    english: "Everything okay",
    tamil: "எல்லாம் சரி",
    sinhala: "හැමදේම හරි",
  },
  {
    id: "bis-spaeter",
    image: "/1.1 greetings/images/see-you-later.jpg",
    full: "Bis später",
    english: "See you later",
    tamil: "பிறகு சந்திப்போம்",
    sinhala: "පසුව හමුවෙමු",
  },
  {
    id: "bis-morgen",
    image: "/1.1 greetings/images/see-you-tomorrow.jpg",
    full: "Bis morgen",
    english: "See you tomorrow",
    tamil: "நாளை சந்திப்போம்",
    sinhala: "හෙට හමුවෙමු",
  },
  {
    id: "viel-glueck",
    image: "/1.1 greetings/images/good-luck.jpg",
    full: "Viel Glück",
    english: "Good luck",
    tamil: "நல்ல அதிர்ஷ்டம்",
    sinhala: "ජය වේවා",
  },
  {
    id: "gute-reise",
    image: "/1.1 greetings/images/have-a-good-trip.jpg",
    full: "Gute Reise",
    english: "Have a good trip",
    tamil: "இனிய பயணம்",
    sinhala: "සුභ ගමනක්",
  },
];

export function greetingMeaning(word: GreetingWord, lang: MotherTongue): string {
  return word[lang];
}
