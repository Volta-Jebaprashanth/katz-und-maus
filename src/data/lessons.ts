import type { MotherTongue } from "@/lib/i18n";
import type { VocabWord } from "@/data/vocabulary";
import { GREETINGS_LESSON_ID, GREETINGS_WORDS } from "@/data/greetings";
import { FAMILY_LESSON_ID, FAMILY_WORDS } from "@/data/family";
import { FOOD_LESSON_ID, FOOD_WORDS } from "@/data/food";
import { HOME_LESSON_ID, HOME_WORDS } from "@/data/home";
import { WEATHER_LESSON_ID, WEATHER_WORDS } from "@/data/weather";
import { HOBBIES_LESSON_ID, HOBBIES_WORDS } from "@/data/hobbies";
import { JOBS_LESSON_ID, JOBS_WORDS } from "@/data/jobs";
import { PERSONAL_LESSON_ID, PERSONAL_WORDS } from "@/data/personal";

// Every vocabulary test holds 10-15 words. A lesson's word list is split
// evenly into as few tests as fit that range (24 -> 12+12, 37 -> 13+12+12),
// numbered under the lesson id: lesson "1.2" -> tests "1.2.1", "1.2.2", ...
// Each test id is also the key its progress is stored under (see
// src/lib/progress-store.ts), so re-splitting a lesson resets its progress.
export const MIN_TEST_WORDS = 10;
export const MAX_TEST_WORDS = 15;

export interface VocabTest {
  testId: string;
  part: number;
  words: VocabWord[];
}

export interface VocabLesson {
  id: string;
  title: string;
  // Emoji fallback, shown if the path picture below fails to load.
  icon: string;
  // The lesson's public/ asset folder, e.g. "1.1 greetings". Its icons/
  // subfolder holds the small round path pictures: lesson.jpg for the lesson
  // node and test-<part>.jpg for each numbered test (see lessonPicture /
  // testPicture).
  assetDir: string;
  meaning: Record<MotherTongue, string>;
  tests: VocabTest[];
}

export function splitIntoTests(lessonId: string, words: VocabWord[]): VocabTest[] {
  const count = Math.max(1, Math.ceil(words.length / MAX_TEST_WORDS));
  const base = Math.floor(words.length / count);
  const extra = words.length % count;
  const tests: VocabTest[] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    tests.push({
      testId: `${lessonId}.${i + 1}`,
      part: i + 1,
      words: words.slice(start, start + size),
    });
    start += size;
  }
  return tests;
}

export const VOCAB_LESSONS: VocabLesson[] = [
  {
    id: GREETINGS_LESSON_ID,
    assetDir: "1.1 greetings",
    title: "Hallo",
    icon: "👋",
    meaning: { english: "Hello", tamil: "வணக்கம்", sinhala: "ආයුබෝවන්" },
    tests: splitIntoTests(GREETINGS_LESSON_ID, GREETINGS_WORDS),
  },
  {
    id: FAMILY_LESSON_ID,
    assetDir: "1.2 family",
    title: "Familie",
    icon: "👨‍👩‍👧",
    meaning: { english: "Family", tamil: "குடும்பம்", sinhala: "පවුල" },
    tests: splitIntoTests(FAMILY_LESSON_ID, FAMILY_WORDS),
  },
  {
    id: FOOD_LESSON_ID,
    assetDir: "1.3 food",
    title: "Essen & Trinken",
    icon: "🍽️",
    meaning: { english: "Food & Drinks", tamil: "உணவு & பானங்கள்", sinhala: "කෑම බීම" },
    tests: splitIntoTests(FOOD_LESSON_ID, FOOD_WORDS),
  },
  {
    id: HOME_LESSON_ID,
    assetDir: "1.4 home",
    title: "Haus & Zimmer",
    icon: "🏠",
    meaning: { english: "Home & Rooms", tamil: "வீடு & அறைகள்", sinhala: "ගෙදර සහ කාමර" },
    tests: splitIntoTests(HOME_LESSON_ID, HOME_WORDS),
  },
  {
    id: WEATHER_LESSON_ID,
    assetDir: "1.5 weather",
    title: "Das Wetter",
    icon: "🌦️",
    meaning: { english: "The Weather", tamil: "வானிலை", sinhala: "කාලගුණය" },
    tests: splitIntoTests(WEATHER_LESSON_ID, WEATHER_WORDS),
  },
  {
    id: HOBBIES_LESSON_ID,
    assetDir: "1.6 hobbies",
    title: "Die Hobbys",
    icon: "⚽",
    meaning: { english: "Hobbies", tamil: "பொழுதுபோக்குகள்", sinhala: "විනෝදාංශ" },
    tests: splitIntoTests(HOBBIES_LESSON_ID, HOBBIES_WORDS),
  },
  {
    id: JOBS_LESSON_ID,
    assetDir: "1.7 jobs",
    title: "Der Beruf",
    icon: "💼",
    meaning: { english: "Jobs", tamil: "தொழில்கள்", sinhala: "රැකියා" },
    tests: splitIntoTests(JOBS_LESSON_ID, JOBS_WORDS),
  },
  {
    id: PERSONAL_LESSON_ID,
    assetDir: "1.8 personal information",
    title: "Angaben zur Person",
    icon: "🪪",
    meaning: {
      english: "Personal information",
      tamil: "தனிப்பட்ட விவரங்கள்",
      sinhala: "පුද්ගලික තොරතුරු",
    },
    tests: splitIntoTests(PERSONAL_LESSON_ID, PERSONAL_WORDS),
  },
];

export function lessonPicture(lesson: VocabLesson): string {
  return `/${lesson.assetDir}/icons/lesson.jpg`;
}

export function testPicture(lesson: VocabLesson, test: VocabTest): string {
  return `/${lesson.assetDir}/icons/test-${test.part}.jpg`;
}

export function findVocabLesson(lessonId: string): VocabLesson {
  const lesson = VOCAB_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`Unknown vocab lesson ${lessonId}`);
  return lesson;
}

export function findVocabTest(testId: string): VocabTest | undefined {
  for (const lesson of VOCAB_LESSONS) {
    const test = lesson.tests.find((t) => t.testId === testId);
    if (test) return test;
  }
  return undefined;
}
