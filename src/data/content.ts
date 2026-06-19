import type { LearningActivity, MemoryCardContent, ReadingLevel } from "../types";

export const readingLevels: ReadingLevel[] = [
  {
    id: "starter",
    label: "Starter",
    focus: "Short vowel sounds and common sight words",
    words: [
      {
        text: "cat",
        hint: "Starts with /c/ and rhymes with hat.",
        phonics: { title: "Blend /c/ /a/ /t/", sounds: ["c", "a", "t"], word: "cat" },
        sentence: "The cat can nap."
      },
      {
        text: "sun",
        hint: "A bright word with the short /u/ sound.",
        phonics: { title: "Blend /s/ /u/ /n/", sounds: ["s", "u", "n"], word: "sun" },
        sentence: "I see the sun."
      },
      {
        text: "map",
        hint: "Look for the short /a/ sound in the middle.",
        phonics: { title: "Blend /m/ /a/ /p/", sounds: ["m", "a", "p"], word: "map" },
        sentence: "The map is on the mat."
      },
      {
        text: "run",
        hint: "A movement word with three sounds.",
        phonics: { title: "Blend /r/ /u/ /n/", sounds: ["r", "u", "n"], word: "run" },
        sentence: "We run to the mat."
      }
    ]
  },
  {
    id: "growing",
    label: "Growing",
    focus: "Consonant blends and early fluency",
    words: [
      {
        text: "ship",
        hint: "The letters s and h work together.",
        phonics: { title: "Blend /sh/ /i/ /p/", sounds: ["sh", "i", "p"], word: "ship" },
        sentence: "A ship is on the blue sea."
      },
      {
        text: "frog",
        hint: "Listen for the /fr/ blend at the start.",
        phonics: { title: "Blend /fr/ /o/ /g/", sounds: ["fr", "o", "g"], word: "frog" },
        sentence: "The green frog can jump."
      },
      {
        text: "jump",
        hint: "A strong action word.",
        phonics: { title: "Blend /j/ /u/ /mp/", sounds: ["j", "u", "mp"], word: "jump" },
        sentence: "I jump over the line."
      },
      {
        text: "green",
        hint: "A color word with a long /e/ sound.",
        phonics: { title: "Chunk gr-ee-n", sounds: ["gr", "ee", "n"], word: "green" },
        sentence: "The leaf is green."
      }
    ]
  },
  {
    id: "confident",
    label: "Confident",
    focus: "Longer sentences and useful school vocabulary",
    words: [
      {
        text: "because",
        hint: "A reason word.",
        phonics: { title: "Chunk be-cause", sounds: ["be", "cause"], word: "because" },
        sentence: "I ask because I want to learn."
      },
      {
        text: "before",
        hint: "A time word.",
        phonics: { title: "Chunk be-fore", sounds: ["be", "fore"], word: "before" },
        sentence: "We read before lunch."
      },
      {
        text: "together",
        hint: "A community word.",
        phonics: { title: "Chunk to-geth-er", sounds: ["to", "geth", "er"], word: "together" },
        sentence: "We read together on the rug."
      },
      {
        text: "question",
        hint: "Something you ask.",
        phonics: { title: "Chunk ques-tion", sounds: ["ques", "tion"], word: "question" },
        sentence: "I ask a question in class."
      }
    ]
  }
];

export const memoryCards: MemoryCardContent[] = [
  { id: "brush", label: "Brush teeth", category: "healthy habit" },
  { id: "water", label: "Drink water", category: "healthy habit" },
  { id: "kind", label: "Use kind words", category: "social skill" },
  { id: "listen", label: "Listen first", category: "classroom skill" },
  { id: "count", label: "Count to ten", category: "math memory" },
  { id: "name", label: "Write my name", category: "school skill" }
];

export const progressTips = [
  "Repeat missed sight words for two minutes tomorrow.",
  "Ask the child to point under each word while reading.",
  "Keep memory games short and end after a successful match.",
  "Read one familiar sentence before introducing a new one."
];

export const learningActivities: LearningActivity[] = [
  {
    id: "rhymes",
    title: "Rhyme Rocket",
    shortLabel: "Rhymes",
    routeLabel: "Rhyme Rocket",
    eyebrow: "Listen for ending sounds",
    skill: "phonics",
    intro: "Rhyming helps children hear word parts and notice sound patterns.",
    prompt: "Which word rhymes with cat?",
    target: "cat",
    choices: ["sun", "hat", "fish", "book"],
    correctChoice: "hat",
    successMessage: "Yes. Cat and hat both end with the /at/ sound.",
    coachMessage: "Listen to the ending sound. Cat ends like hat."
  },
  {
    id: "soundSort",
    title: "Sound Sort",
    shortLabel: "Sounds",
    routeLabel: "Sound Sort",
    eyebrow: "Find the first sound",
    skill: "phonics",
    intro: "Beginning sound practice builds decoding confidence before harder words appear.",
    prompt: "Pick the word that starts with /m/.",
    target: "m",
    choices: ["sun", "map", "run", "fish"],
    correctChoice: "map",
    successMessage: "Great listening. Map starts with /m/.",
    coachMessage: "Stretch the first sound. Mmmmap starts with /m/."
  },
  {
    id: "sentenceBuilder",
    title: "Sentence Builder",
    shortLabel: "Sentence",
    routeLabel: "Sentence Builder",
    eyebrow: "Make words make sense",
    skill: "fluency",
    intro: "Sentence order helps children connect words into meaning, not just read one word at a time.",
    prompt: "Which sentence is in the right order?",
    target: "The dog can run.",
    choices: ["Run dog the can.", "The dog can run.", "Can the run dog.", "Dog the can run."],
    correctChoice: "The dog can run.",
    successMessage: "That sentence sounds right and makes sense.",
    coachMessage: "Try the sentence that starts with who it is about."
  },
  {
    id: "storyOrder",
    title: "Story Steps",
    shortLabel: "Story",
    routeLabel: "Story Steps",
    eyebrow: "What happens first?",
    skill: "fluency",
    intro: "Sequencing strengthens comprehension because readers track what happens first, next, and last.",
    prompt: "What should happen first in this school story?",
    target: "First",
    choices: ["Put on a backpack.", "Eat lunch at school.", "Go home after class.", "Read after the bell."],
    correctChoice: "Put on a backpack.",
    successMessage: "Right. Getting the backpack ready comes first.",
    coachMessage: "Think about the beginning of a school day."
  },
  {
    id: "wordMeaning",
    title: "Word Garden",
    shortLabel: "Word Meaning",
    routeLabel: "Word Garden",
    eyebrow: "Sort by meaning",
    skill: "sightWords",
    intro: "Sorting words by meaning grows vocabulary and helps children connect reading to real life.",
    prompt: "Which word belongs with food?",
    target: "food",
    choices: ["apple", "chair", "pencil", "shoe"],
    correctChoice: "apple",
    successMessage: "Yes. Apple is a food word.",
    coachMessage: "Look for the word you could eat."
  }
];
