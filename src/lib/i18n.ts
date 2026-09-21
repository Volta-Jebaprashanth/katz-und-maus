// Translations for the app's own instructional UI text (menus, buttons,
// exercise prompts). The German lesson content itself (titles like
// "Was ist das?", words like "der Vogel", playful headers like "Los geht's!")
// is intentionally left in German everywhere — it's the language being
// taught, not the UI chrome — so it isn't part of this table.
export type MotherTongue = "english" | "tamil" | "sinhala";

export const MOTHER_TONGUES: { value: MotherTongue; label: string }[] = [
  { value: "english", label: "English" },
  { value: "tamil", label: "தமிழ்" },
  { value: "sinhala", label: "සිංහල" },
];

export interface Strings {
  openProfileMenu: string;
  closeMenu: string;
  previousScreen: string;
  dayStreak: string;
  experiencePoints: string;
  hearts: string;
  addToHomeScreen: string;
  readyForAdventure: string;
  todaysGoal: string;
  startLesson: string;
  lessonComplete: (xp: number) => string;
  wordsStartHere: (count: number) => string;
  wordsLocked: (count: number) => string;
  xpProgress: (done: number, total: number) => string;
  whoAreYouSubtitle: string;
  nameLabel: string;
  ageLabel: string;
  motherTongueLabel: string;
  namePlaceholder: string;
  agePlaceholder: string;
  aboutMe: string;
  save: string;
  clearAllData: string;
  deleteEverythingTitle: string;
  deleteEverythingBody: string;
  cancel: string;
  yesDelete: string;
  followStepsGrownUp: string;
  openInSafariStep: string;
  tapShareStep: string;
  addToHomeScreenStep: string;
  tapAddStep: string;
  findIconStep: string;
  openInSafari: string;
  gotIt: string;
  pictureChallenge: string;
  wordPictureChallenge: string;
  meaningCheck: string;
  translationChallenge: string;
  articleChallenge: string;
  wordBuilder: string;
  missingLetter: string;
  unscramble: string;
  listeningChallenge: string;
  roundUp: string;
  chooseGermanWordForPicture: string;
  chooseGermanPictureForWord: string;
  chooseMeaning: string;
  chooseGermanWord: string;
  chooseCorrectArticle: string;
  tapLettersToSpell: (word: string) => string;
  pickLetterThatCompletes: string;
  arrangeLetters: string;
  listenThenChoose: string;
  listenThenTapPicture: string;
  listenThenSpell: string;
  matchWordsToMeaning: string;
  listenAgain: string;
  check: string;
  tryAgain: string;
  resetLetters: string;
  playGermanWord: string;
  tapToHear: (text: string) => string;
  correctMeaning: (word: string, meaning: string) => string;
  hintBird: string;
  xpStreakContinues: string;
  backToPath: string;
  expandSection: string;
  collapseSection: string;
}

export const TRANSLATIONS: Record<MotherTongue, Strings> = {
  english: {
    openProfileMenu: "Open profile menu",
    closeMenu: "Close menu",
    previousScreen: "Previous screen",
    dayStreak: "day streak",
    experiencePoints: "experience points",
    hearts: "hearts",
    addToHomeScreen: "Add to Home Screen",
    readyForAdventure: "Ready for a little German adventure?",
    todaysGoal: "TODAY'S GOAL",
    startLesson: "Start lesson",
    lessonComplete: (xp) => `Complete · ${xp} XP`,
    wordsStartHere: (count) => `${count} words · Start here`,
    wordsLocked: (count) => `${count} words · Locked`,
    xpProgress: (done, total) => `${done} / ${total} XP`,
    whoAreYouSubtitle: "Tell us your name and age to start learning!",
    nameLabel: "Name",
    ageLabel: "Age",
    motherTongueLabel: "Mother tongue",
    namePlaceholder: "e.g. Leni",
    agePlaceholder: "e.g. 7",
    aboutMe: "About me",
    save: "Save",
    clearAllData: "Clear all my data",
    deleteEverythingTitle: "Delete everything?",
    deleteEverythingBody: "This will erase your name, age, and progress. You can't undo this.",
    cancel: "Cancel",
    yesDelete: "Yes, delete",
    followStepsGrownUp: "Follow these steps with a grown-up!",
    openInSafariStep: "Open this page in Safari — tap the button below.",
    tapShareStep: "Tap the Share button (square with an arrow ⬆️) at the bottom of the screen.",
    addToHomeScreenStep: 'Scroll down the menu and tap "Add to Home Screen".',
    tapAddStep: 'Tap "Add" in the top-right corner.',
    findIconStep: "Find the WortWunder icon on your Home Screen and tap it to play!",
    openInSafari: "Open in Safari",
    gotIt: "Got it",
    pictureChallenge: "Picture challenge",
    wordPictureChallenge: "Word to picture",
    meaningCheck: "Meaning check",
    translationChallenge: "Translation",
    articleChallenge: "Der, die, or das?",
    wordBuilder: "Word builder",
    missingLetter: "Missing letter",
    unscramble: "Unscramble",
    listeningChallenge: "Listening challenge",
    roundUp: "Round-up",
    chooseGermanWordForPicture: "Choose the German word for this picture.",
    chooseGermanPictureForWord: "Choose the picture for this German word.",
    chooseMeaning: "Choose the meaning.",
    chooseGermanWord: "Choose the German word.",
    chooseCorrectArticle: "Choose the correct article.",
    tapLettersToSpell: (word) => `Tap the letters to spell ${word}.`,
    pickLetterThatCompletes: "Pick the letter that completes the word.",
    arrangeLetters: "Arrange the letters to spell the word.",
    listenThenChoose: "Listen, then choose the word you hear.",
    listenThenTapPicture: "Listen, then tap the matching picture.",
    listenThenSpell: "Listen, then spell the word you hear.",
    matchWordsToMeaning: "Match each German word to its meaning.",
    listenAgain: "Listen again as many times as you like.",
    check: "Check",
    tryAgain: "Try again",
    resetLetters: "Reset letters",
    playGermanWord: "Play German word",
    tapToHear: (text) => `${text} — tap to hear`,
    correctMeaning: (word, meaning) => `${word} = ${meaning}!`,
    hintBird: "Hint: this animal has feathers and loves to sing.",
    xpStreakContinues: "+25 XP · Your 5 day streak continues!",
    backToPath: "Back to my path",
    expandSection: "Expand",
    collapseSection: "Collapse",
  },
  tamil: {
    openProfileMenu: "சுயவிவரப் பட்டியலைத் திற",
    closeMenu: "பட்டியலை மூடு",
    previousScreen: "முந்தைய திரை",
    dayStreak: "நாள் தொடர்",
    experiencePoints: "அனுபவப் புள்ளிகள்",
    hearts: "இதயங்கள்",
    addToHomeScreen: "முகப்புத் திரையில் சேர்",
    readyForAdventure: "ஜெர்மன் மொழி சாகசத்திற்குத் தயாரா?",
    todaysGoal: "இன்றைய இலக்கு",
    startLesson: "பாடத்தைத் தொடங்கு",
    lessonComplete: (xp) => `முடிந்தது · ${xp} XP`,
    wordsStartHere: (count) => `${count} சொற்கள் · இங்கிருந்து தொடங்கு`,
    wordsLocked: (count) => `${count} சொற்கள் · பூட்டப்பட்டது`,
    xpProgress: (done, total) => `${done} / ${total} XP`,
    whoAreYouSubtitle: "கற்றலைத் தொடங்க உங்கள் பெயரையும் வயதையும் சொல்லுங்கள்!",
    nameLabel: "பெயர்",
    ageLabel: "வயது",
    motherTongueLabel: "தாய்மொழி",
    namePlaceholder: "எ.கா. லெனி",
    agePlaceholder: "எ.கா. 7",
    aboutMe: "என்னைப் பற்றி",
    save: "சேமி",
    clearAllData: "என் தரவு அனைத்தையும் அழி",
    deleteEverythingTitle: "அனைத்தையும் நீக்கவா?",
    deleteEverythingBody: "இது உங்கள் பெயர், வயது மற்றும் முன்னேற்றத்தை அழிக்கும். இதை மீட்க முடியாது.",
    cancel: "ரத்து செய்",
    yesDelete: "ஆம், நீக்கு",
    followStepsGrownUp: "பெரியவர் ஒருவருடன் இந்த வழிமுறைகளைப் பின்பற்றுங்கள்!",
    openInSafariStep: "இந்தப் பக்கத்தை Safari-இல் திற — கீழேயுள்ள பொத்தானைத் தட்டவும்.",
    tapShareStep: "திரையின் கீழே உள்ள Share பொத்தானை (அம்பு உள்ள சதுரம் ⬆️) தட்டவும்.",
    addToHomeScreenStep: 'பட்டியலில் கீழே சென்று "முகப்புத் திரையில் சேர்" என்பதைத் தட்டவும்.',
    tapAddStep: 'மேல்-வலது மூலையில் "சேர்" என்பதைத் தட்டவும்.',
    findIconStep: "உங்கள் முகப்புத் திரையில் WortWunder ஐகானைக் கண்டுபிடித்து விளையாட தட்டவும்!",
    openInSafari: "Safari-இல் திற",
    gotIt: "சரி, புரிந்தது",
    pictureChallenge: "படச் சவால்",
    wordPictureChallenge: "சொல் - படச் சவால்",
    meaningCheck: "பொருள் சோதனை",
    translationChallenge: "மொழிபெயர்ப்பு",
    articleChallenge: "der, die அல்லது das?",
    wordBuilder: "சொல் கட்டமைப்பான்",
    missingLetter: "விடுபட்ட எழுத்து",
    unscramble: "எழுத்துக்களை வரிசைப்படுத்து",
    listeningChallenge: "கேட்டல் சவால்",
    roundUp: "இறுதிச் சுற்று",
    chooseGermanWordForPicture: "இந்தப் படத்திற்கான ஜெர்மன் சொல்லைத் தேர்ந்தெடு.",
    chooseGermanPictureForWord: "இந்த ஜெர்மன் சொல்லுக்கான படத்தைத் தேர்ந்தெடு.",
    chooseMeaning: "பொருளைத் தேர்ந்தெடு.",
    chooseGermanWord: "ஜெர்மன் சொல்லைத் தேர்ந்தெடு.",
    chooseCorrectArticle: "சரியான பண்புச்சொல்லைத் தேர்ந்தெடு.",
    tapLettersToSpell: (word) => `${word} என்று எழுத எழுத்துக்களைத் தட்டவும்.`,
    pickLetterThatCompletes: "சொல்லை நிறைவு செய்யும் எழுத்தைத் தேர்ந்தெடு.",
    arrangeLetters: "சொல்லை உருவாக்க எழுத்துக்களை வரிசைப்படுத்து.",
    listenThenChoose: "கேளுங்கள், பிறகு நீங்கள் கேட்ட சொல்லைத் தேர்ந்தெடுங்கள்.",
    listenThenTapPicture: "கேளுங்கள், பிறகு பொருந்தும் படத்தைத் தட்டவும்.",
    listenThenSpell: "கேளுங்கள், பிறகு நீங்கள் கேட்ட சொல்லை எழுதுங்கள்.",
    matchWordsToMeaning: "ஒவ்வொரு ஜெர்மன் சொல்லையும் அதன் பொருளுடன் இணைக்கவும்.",
    listenAgain: "நீங்கள் விரும்பும் அளவுக்கு மீண்டும் கேளுங்கள்.",
    check: "சரிபார்",
    tryAgain: "மீண்டும் முயற்சி செய்",
    resetLetters: "எழுத்துக்களை மீட்டமை",
    playGermanWord: "ஜெர்மன் சொல்லைக் கேள்",
    tapToHear: (text) => `${text} — கேட்க தட்டவும்`,
    correctMeaning: (word, meaning) => `${word} = ${meaning}!`,
    hintBird: "குறிப்பு: இந்த விலங்கிற்கு இறகுகள் உண்டு, பாட விரும்பும்.",
    xpStreakContinues: "+25 XP · உங்கள் 5 நாள் தொடர் தொடர்கிறது!",
    backToPath: "என் பாதைக்குத் திரும்பு",
    expandSection: "விரிவாக்கு",
    collapseSection: "சுருக்கு",
  },
  sinhala: {
    openProfileMenu: "පැතිකඩ මෙනුව විවෘත කරන්න",
    closeMenu: "මෙනුව වසන්න",
    previousScreen: "පෙර තිරය",
    dayStreak: "දින දාමය",
    experiencePoints: "අත්දැකීම් ලකුණු",
    hearts: "හදවත්",
    addToHomeScreen: "මුල් තිරයට එකතු කරන්න",
    readyForAdventure: "ජර්මානු කුඩා වික්‍රමයකට සූදානම්ද?",
    todaysGoal: "අද දිනයේ ඉලක්කය",
    startLesson: "පාඩම අරඹන්න",
    lessonComplete: (xp) => `සම්පූර්ණයි · ${xp} XP`,
    wordsStartHere: (count) => `වචන ${count} · මෙතනින් පටන් ගන්න`,
    wordsLocked: (count) => `වචන ${count} · අගුලු දමා ඇත`,
    xpProgress: (done, total) => `${done} / ${total} XP`,
    whoAreYouSubtitle: "ඉගෙනීම ආරම්භ කිරීමට ඔබේ නම සහ වයස කියන්න!",
    nameLabel: "නම",
    ageLabel: "වයස",
    motherTongueLabel: "මව් භාෂාව",
    namePlaceholder: "උදා. ලෙනි",
    agePlaceholder: "උදා. 7",
    aboutMe: "මා ගැන",
    save: "සුරකින්න",
    clearAllData: "මගේ දත්ත සියල්ල මකන්න",
    deleteEverythingTitle: "සියල්ල මකන්නද?",
    deleteEverythingBody: "මෙයින් ඔබේ නම, වයස සහ ප්‍රගතිය මකා දමනු ඇත. මෙය අහෝසි කළ නොහැක.",
    cancel: "අවලංගු කරන්න",
    yesDelete: "ඔව්, මකන්න",
    followStepsGrownUp: "වැඩිහිටියෙකු සමඟ මෙම පියවර අනුගමනය කරන්න!",
    openInSafariStep: "මෙම පිටුව Safari හි විවෘත කරන්න — පහත බොත්තම ඔබන්න.",
    tapShareStep: "තිරයේ පහළින් ඇති Share බොත්තම (ඊතලයක් සහිත සතරැස්‍රය ⬆️) ඔබන්න.",
    addToHomeScreenStep: 'මෙනුවේ පහළට ගොස් "මුල් තිරයට එකතු කරන්න" ඔබන්න.',
    tapAddStep: 'ඉහළ-දකුණේ ඇති "එකතු කරන්න" ඔබන්න.',
    findIconStep: "ඔබේ මුල් තිරයේ WortWunder අයිකනය සොයාගෙන එය ඔබා ක්‍රීඩා කරන්න!",
    openInSafari: "Safari හි විවෘත කරන්න",
    gotIt: "තේරුණා",
    pictureChallenge: "පින්තූර අභියෝගය",
    wordPictureChallenge: "වචන-පින්තූර අභියෝගය",
    meaningCheck: "අර්ථය පරීක්ෂාව",
    translationChallenge: "පරිවර්තනය",
    articleChallenge: "der, die නැතහොත් das?",
    wordBuilder: "වචන තැනීම",
    missingLetter: "අස්ථානගත අකුර",
    unscramble: "අකුරු පිළිවෙළට සකසන්න",
    listeningChallenge: "ශ්‍රවණ අභියෝගය",
    roundUp: "අවසාන වටය",
    chooseGermanWordForPicture: "මෙම පින්තූරයට ගැලපෙන ජර්මානු වචනය තෝරන්න.",
    chooseGermanPictureForWord: "මෙම ජර්මානු වචනයට ගැලපෙන පින්තූරය තෝරන්න.",
    chooseMeaning: "අර්ථය තෝරන්න.",
    chooseGermanWord: "ජර්මානු වචනය තෝරන්න.",
    chooseCorrectArticle: "නිවැරදි ලිපිය තෝරන්න.",
    tapLettersToSpell: (word) => `${word} යනුවෙන් ලිවීමට අකුරු ඔබන්න.`,
    pickLetterThatCompletes: "වචනය සම්පූර්ණ කරන අකුර තෝරන්න.",
    arrangeLetters: "වචනය සෑදීමට අකුරු පිළිවෙළට සකසන්න.",
    listenThenChoose: "අහන්න, පසුව ඔබ ඇසූ වචනය තෝරන්න.",
    listenThenTapPicture: "අහන්න, පසුව ගැලපෙන පින්තූරය ඔබන්න.",
    listenThenSpell: "අහන්න, පසුව ඔබ ඇසූ වචනය ලියන්න.",
    matchWordsToMeaning: "සෑම ජර්මානු වචනයක්ම එහි අර්ථයට ගළපන්න.",
    listenAgain: "ඔබට කැමති තරම් නැවත අහන්න.",
    check: "පරීක්ෂා කරන්න",
    tryAgain: "නැවත උත්සාහ කරන්න",
    resetLetters: "අකුරු යළි සකසන්න",
    playGermanWord: "ජර්මානු වචනය ඇසෙන්න",
    tapToHear: (text) => `${text} — ඇසීමට ඔබන්න`,
    correctMeaning: (word, meaning) => `${word} = ${meaning}!`,
    hintBird: "ඉඟිය: මෙම සතාට පිහාටු ඇති අතර ගායනා කිරීමට කැමතියි.",
    xpStreakContinues: "+25 XP · ඔබේ දින 5 දාමය දිගටම පවතී!",
    backToPath: "මගේ මාවතට ආපසු",
    expandSection: "විස්තීරණය කරන්න",
    collapseSection: "හකුළන්න",
  },
};
