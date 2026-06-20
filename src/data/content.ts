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
    rounds: [
      {
        prompt: "Which word rhymes with cat?",
        target: "cat",
        choices: ["sun", "hat", "fish", "book"],
        correctChoice: "hat",
        successMessage: "Yes. Cat and hat both end with the /at/ sound.",
        coachMessage: "Listen to the ending sound. Cat ends like hat."
      },
      {
        prompt: "Which word rhymes with sun?",
        target: "sun",
        choices: ["run", "map", "bed", "fish"],
        correctChoice: "run",
        successMessage: "Right. Sun and run both end with /un/.",
        coachMessage: "Say sun slowly. The ending sounds like run."
      },
      {
        prompt: "Which word rhymes with hop?",
        target: "hop",
        choices: ["top", "mat", "red", "ship"],
        correctChoice: "top",
        successMessage: "Yes. Hop and top both end with /op/.",
        coachMessage: "Listen for the ending. Hop ends like top."
      },
      {
        prompt: "Which word rhymes with bed?",
        target: "bed",
        choices: ["red", "cup", "map", "go"],
        correctChoice: "red",
        successMessage: "Great. Bed and red both end with /ed/.",
        coachMessage: "Try the word with the same ending sound as bed."
      },
      {
        prompt: "Which word rhymes with cake?",
        target: "cake",
        choices: ["make", "sit", "frog", "sun"],
        correctChoice: "make",
        successMessage: "Correct. Cake and make share the /ake/ sound.",
        coachMessage: "Cake has the long /a/ ending, like make."
      },
      {
        prompt: "Which word rhymes with bug?",
        target: "bug",
        choices: ["rug", "bike", "fan", "pen"],
        correctChoice: "rug",
        successMessage: "Yes. Bug and rug both end with /ug/.",
        coachMessage: "Listen for the ending. Bug ends like rug."
      },
      {
        prompt: "Which word rhymes with light?",
        target: "light",
        choices: ["night", "leaf", "dog", "bell"],
        correctChoice: "night",
        successMessage: "Right. Light and night share the /ight/ sound.",
        coachMessage: "Light ends with /ight/. Which word does too?"
      },
      {
        prompt: "Which word rhymes with fish?",
        target: "fish",
        choices: ["dish", "map", "run", "big"],
        correctChoice: "dish",
        successMessage: "Yes. Fish and dish both end with /ish/.",
        coachMessage: "Say fish, then try the word with the same ending."
      },
      {
        prompt: "Which word rhymes with ball?",
        target: "ball",
        choices: ["wall", "cat", "jump", "ship"],
        correctChoice: "wall",
        successMessage: "Correct. Ball and wall rhyme.",
        coachMessage: "Ball and wall both end with /all/."
      },
      {
        prompt: "Which word rhymes with tree?",
        target: "tree",
        choices: ["bee", "book", "chair", "sock"],
        correctChoice: "bee",
        successMessage: "Nice listening. Tree and bee rhyme.",
        coachMessage: "Tree ends with a long /e/ sound. Bee does too."
      }
    ]
  },
  {
    id: "soundSort",
    title: "Sound Sort",
    shortLabel: "Sounds",
    routeLabel: "Sound Sort",
    eyebrow: "Find the first sound",
    skill: "phonics",
    intro: "Beginning sound practice builds decoding confidence before harder words appear.",
    rounds: [
      {
        prompt: "Pick the word that starts with /m/.",
        target: "m",
        choices: ["sun", "map", "run", "fish"],
        correctChoice: "map",
        successMessage: "Great listening. Map starts with /m/.",
        coachMessage: "Stretch the first sound. Mmmmap starts with /m/."
      },
      {
        prompt: "Pick the word that starts with /s/.",
        target: "s",
        choices: ["bed", "sun", "frog", "cat"],
        correctChoice: "sun",
        successMessage: "Yes. Sun starts with /s/.",
        coachMessage: "Listen for the first sound. Ssssun starts with /s/."
      },
      {
        prompt: "Pick the word that starts with /b/.",
        target: "b",
        choices: ["ball", "top", "fish", "run"],
        correctChoice: "ball",
        successMessage: "Correct. Ball starts with /b/.",
        coachMessage: "Bounce the first sound. B-b-ball starts with /b/."
      },
      {
        prompt: "Pick the word that starts with /f/.",
        target: "f",
        choices: ["cake", "fish", "dog", "mat"],
        correctChoice: "fish",
        successMessage: "Right. Fish starts with /f/.",
        coachMessage: "Fish starts with the soft /f/ sound."
      },
      {
        prompt: "Pick the word that starts with /r/.",
        target: "r",
        choices: ["run", "sun", "cup", "bell"],
        correctChoice: "run",
        successMessage: "Yes. Run starts with /r/.",
        coachMessage: "Stretch the first sound. Rrrrun starts with /r/."
      },
      {
        prompt: "Pick the word that starts with /d/.",
        target: "d",
        choices: ["leaf", "ship", "dog", "pen"],
        correctChoice: "dog",
        successMessage: "Correct. Dog starts with /d/.",
        coachMessage: "Dog starts with the tapping /d/ sound."
      },
      {
        prompt: "Pick the word that starts with /t/.",
        target: "t",
        choices: ["top", "map", "fish", "rug"],
        correctChoice: "top",
        successMessage: "Great. Top starts with /t/.",
        coachMessage: "Top starts with the quick /t/ sound."
      },
      {
        prompt: "Pick the word that starts with /p/.",
        target: "p",
        choices: ["go", "pen", "sun", "chair"],
        correctChoice: "pen",
        successMessage: "Yes. Pen starts with /p/.",
        coachMessage: "Pen starts with the popping /p/ sound."
      },
      {
        prompt: "Pick the word that starts with /l/.",
        target: "l",
        choices: ["leaf", "dog", "cup", "fish"],
        correctChoice: "leaf",
        successMessage: "Right. Leaf starts with /l/.",
        coachMessage: "Leaf starts with the /l/ sound."
      },
      {
        prompt: "Pick the word that starts with /sh/.",
        target: "sh",
        choices: ["ship", "sun", "map", "ball"],
        correctChoice: "ship",
        successMessage: "Correct. Ship starts with /sh/.",
        coachMessage: "The letters s and h work together in ship."
      }
    ]
  },
  {
    id: "sentenceBuilder",
    title: "Sentence Builder",
    shortLabel: "Sentence",
    routeLabel: "Sentence Builder",
    eyebrow: "Make words make sense",
    skill: "fluency",
    intro: "Sentence order helps children connect words into meaning, not just read one word at a time.",
    rounds: [
      {
        prompt: "Which sentence is in the right order?",
        target: "The dog can run.",
        choices: ["Run dog the can.", "The dog can run.", "Can the run dog.", "Dog the can run."],
        correctChoice: "The dog can run.",
        successMessage: "That sentence sounds right and makes sense.",
        coachMessage: "Try the sentence that starts with who it is about."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "I see the sun.",
        choices: ["See I sun the.", "I see the sun.", "The see sun I.", "Sun the I see."],
        correctChoice: "I see the sun.",
        successMessage: "Yes. I see the sun is in order.",
        coachMessage: "Start with who is looking: I."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "The cat can nap.",
        choices: ["The cat can nap.", "Nap can cat the.", "Can the nap cat.", "Cat the nap can."],
        correctChoice: "The cat can nap.",
        successMessage: "Correct. That sentence sounds complete.",
        coachMessage: "Start with the animal, then what it can do."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "We read a book.",
        choices: ["Read we book a.", "We read a book.", "Book a read we.", "A we book read."],
        correctChoice: "We read a book.",
        successMessage: "Right. We read a book makes sense.",
        coachMessage: "Start with who is doing it: we."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "The frog can jump.",
        choices: ["The frog can jump.", "Jump frog the can.", "Can jump the frog.", "Frog the can jump."],
        correctChoice: "The frog can jump.",
        successMessage: "Yes. The frog can jump is in order.",
        coachMessage: "Start with the frog, then the action."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "My red hat fits.",
        choices: ["Fits hat red my.", "My red hat fits.", "Hat my fits red.", "Red fits my hat."],
        correctChoice: "My red hat fits.",
        successMessage: "Correct. My red hat fits sounds right.",
        coachMessage: "Start with whose hat it is: my."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "Dad has a map.",
        choices: ["Map dad has a.", "Dad has a map.", "Has map dad a.", "A dad map has."],
        correctChoice: "Dad has a map.",
        successMessage: "Great. Dad has a map is complete.",
        coachMessage: "Start with who has something: Dad."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "The ship is big.",
        choices: ["The ship is big.", "Big is ship the.", "Is the big ship.", "Ship the big is."],
        correctChoice: "The ship is big.",
        successMessage: "Yes. The ship is big makes sense.",
        coachMessage: "Start with the thing you are describing."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "I like green grapes.",
        choices: ["Green like I grapes.", "I like green grapes.", "Grapes I green like.", "Like grapes green I."],
        correctChoice: "I like green grapes.",
        successMessage: "Right. I like green grapes is in order.",
        coachMessage: "Start with who likes them: I."
      },
      {
        prompt: "Which sentence is in the right order?",
        target: "Mom can help me.",
        choices: ["Help mom me can.", "Mom can help me.", "Can me mom help.", "Me help can mom."],
        correctChoice: "Mom can help me.",
        successMessage: "Correct. Mom can help me is a clear sentence.",
        coachMessage: "Start with who can help: Mom."
      }
    ]
  },
  {
    id: "storyOrder",
    title: "Story Steps",
    shortLabel: "Story",
    routeLabel: "Story Steps",
    eyebrow: "What happens first?",
    skill: "fluency",
    intro: "Sequencing strengthens comprehension because readers track what happens first, next, and last.",
    rounds: [
      {
        prompt: "What should happen first in this school story?",
        target: "First",
        choices: ["Put on a backpack.", "Eat lunch at school.", "Go home after class.", "Read after the bell."],
        correctChoice: "Put on a backpack.",
        successMessage: "Right. Getting the backpack ready comes first.",
        coachMessage: "Think about the beginning of a school day."
      },
      {
        prompt: "What happens after you brush your teeth?",
        target: "Next",
        choices: ["Put the toothbrush away.", "Wake up tomorrow.", "Open a lunchbox.", "Ride a bike."],
        correctChoice: "Put the toothbrush away.",
        successMessage: "Yes. Putting the toothbrush away comes next.",
        coachMessage: "Think about what happens right after brushing."
      },
      {
        prompt: "What happens before you read a book?",
        target: "Before",
        choices: ["Pick a book.", "Close the book.", "Tell the ending.", "Put it on the shelf."],
        correctChoice: "Pick a book.",
        successMessage: "Correct. First you pick a book.",
        coachMessage: "Before reading, you need something to read."
      },
      {
        prompt: "What happens last when you pack lunch?",
        target: "Last",
        choices: ["Zip the lunch bag.", "Find the lunch bag.", "Put food inside.", "Wash an apple."],
        correctChoice: "Zip the lunch bag.",
        successMessage: "Right. Zipping the bag finishes the job.",
        coachMessage: "Think about the step that closes everything up."
      },
      {
        prompt: "What should happen first before painting?",
        target: "First",
        choices: ["Put on a smock.", "Wash the brush.", "Hang the picture.", "Clean the table."],
        correctChoice: "Put on a smock.",
        successMessage: "Yes. A smock helps keep clothes clean first.",
        coachMessage: "Think about getting ready before painting."
      },
      {
        prompt: "What happens after planting a seed?",
        target: "Next",
        choices: ["Water the soil.", "Pick the fruit.", "Draw a rainbow.", "Close a book."],
        correctChoice: "Water the soil.",
        successMessage: "Correct. Seeds need water next.",
        coachMessage: "Think about what helps a seed grow."
      },
      {
        prompt: "What happens first in a bedtime routine?",
        target: "First",
        choices: ["Put on pajamas.", "Sleep all night.", "Wake up.", "Eat lunch."],
        correctChoice: "Put on pajamas.",
        successMessage: "Right. Pajamas come early in bedtime.",
        coachMessage: "Think about getting ready for bed."
      },
      {
        prompt: "What happens last after a soccer game?",
        target: "Last",
        choices: ["Say good game.", "Tie shoes.", "Start warm-ups.", "Find the field."],
        correctChoice: "Say good game.",
        successMessage: "Yes. Saying good game happens at the end.",
        coachMessage: "Think about what happens after playing."
      },
      {
        prompt: "What happens before writing your name?",
        target: "Before",
        choices: ["Pick up a pencil.", "Erase the paper.", "Close the notebook.", "Read the lunch menu."],
        correctChoice: "Pick up a pencil.",
        successMessage: "Correct. You need a pencil before writing.",
        coachMessage: "Think about the tool needed to write."
      },
      {
        prompt: "What happens last when washing hands?",
        target: "Last",
        choices: ["Dry your hands.", "Turn on water.", "Add soap.", "Rub hands together."],
        correctChoice: "Dry your hands.",
        successMessage: "Right. Drying hands is the last step.",
        coachMessage: "Think about what you do after rinsing."
      }
    ]
  },
  {
    id: "wordMeaning",
    title: "Word Garden",
    shortLabel: "Word Meaning",
    routeLabel: "Word Garden",
    eyebrow: "Sort by meaning",
    skill: "sightWords",
    intro: "Sorting words by meaning grows vocabulary and helps children connect reading to real life.",
    rounds: [
      {
        prompt: "Which word belongs with food?",
        target: "food",
        choices: ["apple", "chair", "pencil", "shoe"],
        correctChoice: "apple",
        successMessage: "Yes. Apple is a food word.",
        coachMessage: "Look for the word you could eat."
      },
      {
        prompt: "Which word belongs with school tools?",
        target: "school",
        choices: ["pencil", "banana", "sock", "bed"],
        correctChoice: "pencil",
        successMessage: "Right. A pencil is a school tool.",
        coachMessage: "Look for what you use to write."
      },
      {
        prompt: "Which word belongs with animals?",
        target: "animal",
        choices: ["dog", "table", "book", "shoe"],
        correctChoice: "dog",
        successMessage: "Correct. Dog is an animal.",
        coachMessage: "Look for the living thing."
      },
      {
        prompt: "Which word belongs with colors?",
        target: "color",
        choices: ["green", "jump", "chair", "milk"],
        correctChoice: "green",
        successMessage: "Yes. Green is a color word.",
        coachMessage: "Look for a word that names a color."
      },
      {
        prompt: "Which word belongs with things you wear?",
        target: "clothes",
        choices: ["hat", "map", "apple", "fish"],
        correctChoice: "hat",
        successMessage: "Right. A hat is something you wear.",
        coachMessage: "Look for what can go on your body."
      },
      {
        prompt: "Which word belongs with places?",
        target: "place",
        choices: ["park", "red", "run", "cup"],
        correctChoice: "park",
        successMessage: "Correct. A park is a place.",
        coachMessage: "Look for somewhere you can go."
      },
      {
        prompt: "Which word belongs with actions?",
        target: "action",
        choices: ["jump", "leaf", "desk", "blue"],
        correctChoice: "jump",
        successMessage: "Yes. Jump is something you do.",
        coachMessage: "Look for an action word."
      },
      {
        prompt: "Which word belongs with weather?",
        target: "weather",
        choices: ["rain", "pencil", "shoe", "milk"],
        correctChoice: "rain",
        successMessage: "Right. Rain is a weather word.",
        coachMessage: "Look for what can happen outside in the sky."
      },
      {
        prompt: "Which word belongs with body parts?",
        target: "body",
        choices: ["hand", "book", "chair", "fish"],
        correctChoice: "hand",
        successMessage: "Correct. Hand is a body part.",
        coachMessage: "Look for a part of your body."
      },
      {
        prompt: "Which word belongs with toys?",
        target: "toy",
        choices: ["ball", "soap", "leaf", "desk"],
        correctChoice: "ball",
        successMessage: "Yes. A ball can be a toy.",
        coachMessage: "Look for something kids can play with."
      }
    ]
  }
];
