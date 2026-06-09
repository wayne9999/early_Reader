export const readingLevels = [
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

export const memoryCards = [
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
