import type { LearningActivity, LearningActivityRound, MemoryCardContent, ReadingLevel } from "../types";

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
  },
  {
    id: "echoReader",
    title: "Echo Reader",
    shortLabel: "Echo",
    routeLabel: "Echo Reader",
    eyebrow: "Listen, echo, choose",
    skill: "fluency",
    intro: "Premium voice practice helps children hear smooth expression before choosing the matching sentence.",
    voiceMode: "elevenLabs",
    rounds: [
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "The sun is up.",
        voicePrompt: "The sun is up.",
        choices: ["The sun is up.", "The dog is up.", "The sun is red.", "The cup is up."],
        correctChoice: "The sun is up.",
        successMessage: "Yes. You matched the sentence you heard.",
        coachMessage: "Listen for the exact words from the voice."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "I can hop.",
        voicePrompt: "I can hop.",
        choices: ["I can hop.", "I can help.", "I can nap.", "I see hop."],
        correctChoice: "I can hop.",
        successMessage: "Right. I can hop is the sentence.",
        coachMessage: "Try again and listen for the action word."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "The fish can swim.",
        voicePrompt: "The fish can swim.",
        choices: ["The fish can swim.", "The ship can swim.", "The fish can sit.", "A fish can jump."],
        correctChoice: "The fish can swim.",
        successMessage: "Great listening. Fish and swim belong together.",
        coachMessage: "Listen for who the sentence is about and what it can do."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "We read a book.",
        voicePrompt: "We read a book.",
        choices: ["We read a book.", "We red a book.", "We ride a bike.", "We see a book."],
        correctChoice: "We read a book.",
        successMessage: "Correct. You heard read a book.",
        coachMessage: "Listen for the middle action word."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "My hat is red.",
        voicePrompt: "My hat is red.",
        choices: ["My hat is red.", "My cat is red.", "My hat is big.", "The hat is red."],
        correctChoice: "My hat is red.",
        successMessage: "Yes. My hat is red matches the voice.",
        coachMessage: "Listen for the first word and the color word."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "The frog can jump.",
        voicePrompt: "The frog can jump.",
        choices: ["The frog can jump.", "The dog can jump.", "The frog can run.", "A frog can hop."],
        correctChoice: "The frog can jump.",
        successMessage: "Nice work. Frog can jump is correct.",
        coachMessage: "Listen for the animal and the action."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "Dad has a map.",
        voicePrompt: "Dad has a map.",
        choices: ["Dad has a map.", "Dad has a mop.", "Mom has a map.", "Dad had a map."],
        correctChoice: "Dad has a map.",
        successMessage: "Right. You matched dad has a map.",
        coachMessage: "Listen for who has something and what it is."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "The green leaf fell.",
        voicePrompt: "The green leaf fell.",
        choices: ["The green leaf fell.", "The green leaf is big.", "The leaf is green.", "The green frog fell."],
        correctChoice: "The green leaf fell.",
        successMessage: "Correct. The green leaf fell is the sentence.",
        coachMessage: "Listen for the describing word and what happened."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "I like the story.",
        voicePrompt: "I like the story.",
        choices: ["I like the story.", "I write the story.", "I like the store.", "I see the story."],
        correctChoice: "I like the story.",
        successMessage: "Yes. You heard I like the story.",
        coachMessage: "Listen for the word after I."
      },
      {
        prompt: "Listen to the sentence. Which one did you hear?",
        target: "Can you help me?",
        voicePrompt: "Can you help me?",
        choices: ["Can you help me?", "Can you hear me?", "Can you hop with me?", "Can I help you?"],
        correctChoice: "Can you help me?",
        successMessage: "Excellent. You matched the question.",
        coachMessage: "Listen for the words can you and help me."
      }
    ]
  },
  {
    id: "voiceQuest",
    title: "Voice Quest",
    shortLabel: "Voice",
    routeLabel: "Voice Quest",
    eyebrow: "Hear a clue, pick the answer",
    skill: "sightWords",
    intro: "Premium narrated clues turn vocabulary and comprehension practice into a quick listening quest.",
    voiceMode: "elevenLabs",
    rounds: [
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "Something bright in the sky",
        voicePrompt: "I am bright. I shine in the sky. You can see me in the daytime.",
        choices: ["sun", "map", "fish", "hat"],
        correctChoice: "sun",
        successMessage: "Yes. The sun is bright in the sky.",
        coachMessage: "Think about what shines during the day."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "Something you read",
        voicePrompt: "I have pages. You can read my words and look at my pictures.",
        choices: ["book", "shoe", "cup", "rain"],
        correctChoice: "book",
        successMessage: "Right. A book has pages to read.",
        coachMessage: "Listen for pages, words, and pictures."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "An animal that can bark",
        voicePrompt: "I am an animal. I can bark and wag my tail.",
        choices: ["dog", "leaf", "pen", "cake"],
        correctChoice: "dog",
        successMessage: "Correct. A dog can bark.",
        coachMessage: "Think about the animal that barks."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "Something you use to write",
        voicePrompt: "You hold me in your hand. I help you write letters and words.",
        choices: ["pencil", "apple", "frog", "bed"],
        correctChoice: "pencil",
        successMessage: "Yes. A pencil helps you write.",
        coachMessage: "Listen for the tool used for writing."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "Something you wear on your head",
        voicePrompt: "I can sit on your head. I help keep sun out of your eyes.",
        choices: ["hat", "map", "fish", "desk"],
        correctChoice: "hat",
        successMessage: "Right. A hat goes on your head.",
        coachMessage: "Think about what you wear on your head."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "A place to play outside",
        voicePrompt: "You can swing, run, and play outside here.",
        choices: ["park", "sock", "milk", "chair"],
        correctChoice: "park",
        successMessage: "Correct. A park is a place to play.",
        coachMessage: "Listen for the place where you can play outside."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "Something wet from the sky",
        voicePrompt: "I fall from clouds. I make puddles on the ground.",
        choices: ["rain", "ball", "ship", "green"],
        correctChoice: "rain",
        successMessage: "Yes. Rain falls from clouds.",
        coachMessage: "Think about what falls from clouds."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "A color of grass",
        voicePrompt: "I am a color. Grass and leaves can be this color.",
        choices: ["green", "jump", "book", "hand"],
        correctChoice: "green",
        successMessage: "Right. Grass and leaves can be green.",
        coachMessage: "Listen for the color clue."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "Something you can throw and catch",
        voicePrompt: "You can roll me, throw me, kick me, or catch me.",
        choices: ["ball", "soap", "leaf", "desk"],
        correctChoice: "ball",
        successMessage: "Correct. A ball can be thrown and caught.",
        coachMessage: "Think about the toy you can roll or throw."
      },
      {
        prompt: "Listen to the clue. Which word fits?",
        target: "A part of your body",
        voicePrompt: "I am part of your body. I help you wave, clap, and hold things.",
        choices: ["hand", "cup", "frog", "chair"],
        correctChoice: "hand",
        successMessage: "Excellent. A hand can wave, clap, and hold things.",
        coachMessage: "Listen for the body part that helps you hold things."
      }
    ]
  }
];

readingLevels[0].words.push(
  {
    text: "bed",
    hint: "A short /e/ word children meet at home.",
    phonics: { title: "Blend /b/ /e/ /d/", sounds: ["b", "e", "d"], word: "bed" },
    sentence: "The bed is red.",
    accessTier: "registered",
    gradeBand: "K",
    tags: ["CVC", "short-e", "home"]
  },
  {
    text: "dog",
    hint: "A short /o/ animal word.",
    phonics: { title: "Blend /d/ /o/ /g/", sounds: ["d", "o", "g"], word: "dog" },
    sentence: "The dog can dig.",
    accessTier: "registered",
    gradeBand: "K",
    tags: ["CVC", "short-o", "animal"]
  },
  {
    text: "fish",
    hint: "The letters s and h make one sound.",
    phonics: { title: "Blend /f/ /i/ /sh/", sounds: ["f", "i", "sh"], word: "fish" },
    sentence: "The fish is in a dish.",
    accessTier: "paid",
    gradeBand: "1",
    tags: ["digraph", "short-i", "animal"]
  },
  {
    text: "shop",
    hint: "Listen for the /sh/ sound at the start.",
    phonics: { title: "Blend /sh/ /o/ /p/", sounds: ["sh", "o", "p"], word: "shop" },
    sentence: "We shop for a red hat.",
    accessTier: "paid",
    gradeBand: "1",
    tags: ["digraph", "short-o", "community"]
  }
);

readingLevels[1].words.push(
  {
    text: "clap",
    hint: "A blend word that starts with /cl/.",
    phonics: { title: "Blend /cl/ /a/ /p/", sounds: ["cl", "a", "p"], word: "clap" },
    sentence: "We clap for the class.",
    accessTier: "registered",
    gradeBand: "1",
    tags: ["blend", "short-a", "school"]
  },
  {
    text: "flag",
    hint: "The letters f and l slide together.",
    phonics: { title: "Blend /fl/ /a/ /g/", sounds: ["fl", "a", "g"], word: "flag" },
    sentence: "The flag is on the wall.",
    accessTier: "registered",
    gradeBand: "1",
    tags: ["blend", "short-a", "school"]
  },
  {
    text: "chain",
    hint: "The letters c and h work together.",
    phonics: { title: "Chunk ch-ai-n", sounds: ["ch", "ai", "n"], word: "chain" },
    sentence: "The chain is by the gate.",
    accessTier: "paid",
    gradeBand: "2",
    tags: ["digraph", "vowel-team", "stretch"]
  },
  {
    text: "bright",
    hint: "A longer word with the /br/ blend.",
    phonics: { title: "Chunk br-ight", sounds: ["br", "ight"], word: "bright" },
    sentence: "The bright light helps me read.",
    accessTier: "paid",
    gradeBand: "2",
    tags: ["blend", "rime", "fluency"]
  }
);

readingLevels[2].words.push(
  {
    text: "answer",
    hint: "A school word used when someone asks a question.",
    phonics: { title: "Chunk an-swer", sounds: ["an", "swer"], word: "answer" },
    sentence: "I can answer with a full sentence.",
    accessTier: "registered",
    gradeBand: "2",
    tags: ["vocabulary", "school", "fluency"]
  },
  {
    text: "picture",
    hint: "Here, picture means an image that helps you understand a story.",
    phonics: { title: "Chunk pic-ture", sounds: ["pic", "ture"], word: "picture" },
    sentence: "The picture helps me understand the story.",
    accessTier: "registered",
    gradeBand: "2",
    tags: ["vocabulary", "comprehension", "fluency"]
  },
  {
    text: "explain",
    hint: "A thinking word for telling why.",
    phonics: { title: "Chunk ex-plain", sounds: ["ex", "plain"], word: "explain" },
    sentence: "I explain how I found the answer.",
    accessTier: "paid",
    gradeBand: "2",
    tags: ["academic", "vowel-team", "comprehension"]
  },
  {
    text: "carefully",
    hint: "A longer word that reminds readers to slow down.",
    phonics: { title: "Chunk care-ful-ly", sounds: ["care", "ful", "ly"], word: "carefully" },
    sentence: "I read carefully and check the ending.",
    accessTier: "paid",
    gradeBand: "2",
    tags: ["multisyllable", "fluency", "self-monitoring"]
  }
);

memoryCards.push(
  { id: "raise-hand", label: "Raise hand", category: "classroom skill", accessTier: "registered", gradeBand: "K" },
  { id: "take-turns", label: "Take turns", category: "social skill", accessTier: "registered", gradeBand: "K" },
  { id: "pack-bag", label: "Pack backpack", category: "routine", accessTier: "registered", gradeBand: "1" },
  { id: "line-up", label: "Line up calmly", category: "classroom skill", accessTier: "registered", gradeBand: "1" },
  { id: "check-work", label: "Check my work", category: "learning habit", accessTier: "paid", gradeBand: "2" },
  { id: "ask-why", label: "Ask why", category: "thinking skill", accessTier: "paid", gradeBand: "2" },
  { id: "reread", label: "Reread a sentence", category: "reading strategy", accessTier: "paid", gradeBand: "2" },
  { id: "find-clue", label: "Find a clue", category: "comprehension", accessTier: "paid", gradeBand: "2" }
);

const extraRounds: Partial<Record<LearningActivity["id"], LearningActivityRound[]>> = {
  rhymes: [
    {
      prompt: "Which word rhymes with pin?",
      target: "pin",
      choices: ["win", "cake", "dog", "leaf"],
      correctChoice: "win",
      successMessage: "Yes. Pin and win share the /in/ sound.",
      coachMessage: "Listen to the ending sound. Pin ends like win.",
      accessTier: "registered",
      gradeBand: "K",
      tags: ["rhyme", "short-i"]
    },
    {
      prompt: "Which word rhymes with coat?",
      target: "coat",
      choices: ["boat", "bed", "sun", "fish"],
      correctChoice: "boat",
      successMessage: "Correct. Coat and boat rhyme.",
      coachMessage: "Coat has the long /o/ ending, like boat.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["rhyme", "vowel-team"]
    }
  ],
  soundSort: [
    {
      prompt: "Pick the word that starts with /ch/.",
      target: "ch",
      choices: ["chair", "sun", "map", "dog"],
      correctChoice: "chair",
      successMessage: "Correct. Chair starts with /ch/.",
      coachMessage: "The letters c and h work together in chair.",
      accessTier: "registered",
      gradeBand: "1",
      tags: ["digraph", "beginning-sound"]
    },
    {
      prompt: "Pick the word that starts with /br/.",
      target: "br",
      choices: ["bright", "fish", "cup", "tree"],
      correctChoice: "bright",
      successMessage: "Yes. Bright starts with the /br/ blend.",
      coachMessage: "Listen for two sounds close together at the start.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["blend", "beginning-sound"]
    }
  ],
  sentenceBuilder: [
    {
      prompt: "Which sentence tells a complete idea?",
      target: "The class reads together.",
      choices: ["Reads together class the.", "The class reads together.", "Together the reads class.", "Class the together reads."],
      correctChoice: "The class reads together.",
      successMessage: "Yes. That sentence is complete and in order.",
      coachMessage: "Start with who the sentence is about.",
      accessTier: "paid",
      gradeBand: "1",
      tags: ["syntax", "fluency"]
    },
    {
      prompt: "Which sentence uses because correctly?",
      target: "I reread because I missed a word.",
      choices: ["Because missed I reread word.", "I reread because I missed a word.", "Missed because word I reread.", "A word because reread I missed."],
      correctChoice: "I reread because I missed a word.",
      successMessage: "Correct. Because tells the reason.",
      coachMessage: "Look for the sentence that gives a reason.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["syntax", "because", "comprehension"]
    }
  ],
  storyOrder: [
    {
      prompt: "What happens first when you borrow a library book?",
      target: "First",
      choices: ["Choose a book.", "Return the book.", "Write a report.", "Close the backpack."],
      correctChoice: "Choose a book.",
      successMessage: "Right. You choose a book before borrowing it.",
      coachMessage: "Think about the first step at the library.",
      accessTier: "paid",
      gradeBand: "1",
      tags: ["sequencing", "school"]
    },
    {
      prompt: "What should happen after you make a reading mistake?",
      target: "Next",
      choices: ["Reread the sentence.", "Skip every page.", "Close your eyes.", "Erase the book."],
      correctChoice: "Reread the sentence.",
      successMessage: "Yes. Good readers reread to check meaning.",
      coachMessage: "Think about what helps the sentence make sense.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["sequencing", "self-monitoring"]
    }
  ],
  wordMeaning: [
    {
      prompt: "Which word belongs with reading strategies?",
      target: "strategy",
      choices: ["reread", "banana", "shoe", "chair"],
      correctChoice: "reread",
      successMessage: "Correct. Reread is a reading strategy.",
      coachMessage: "Look for something a reader can do.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["vocabulary", "strategy"]
    },
    {
      prompt: "Which word belongs with feelings?",
      target: "feeling",
      choices: ["proud", "pencil", "rain", "desk"],
      correctChoice: "proud",
      successMessage: "Yes. Proud is a feeling word.",
      coachMessage: "Look for a word that names how someone feels.",
      accessTier: "paid",
      gradeBand: "1",
      tags: ["vocabulary", "emotion"]
    }
  ],
  echoReader: [
    {
      prompt: "Listen to the sentence. Which one did you hear?",
      target: "I can read it again.",
      voicePrompt: "I can read it again.",
      choices: ["I can read it again.", "I can ride it again.", "I can read a game.", "I read it can again."],
      correctChoice: "I can read it again.",
      successMessage: "Yes. You matched the sentence exactly.",
      coachMessage: "Listen for read and again.",
      accessTier: "paid",
      gradeBand: "1",
      tags: ["listening", "fluency"]
    },
    {
      prompt: "Listen to the sentence. Which one did you hear?",
      target: "She found the clue in the picture.",
      voicePrompt: "She found the clue in the picture.",
      choices: ["She found the clue in the picture.", "She found the blue picture.", "She found a shoe in the picture.", "The clue found she picture."],
      correctChoice: "She found the clue in the picture.",
      successMessage: "Correct. You listened for the full idea.",
      coachMessage: "Listen for clue and picture.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["listening", "comprehension"]
    }
  ],
  voiceQuest: [
    {
      prompt: "Listen to the clue. Which word fits?",
      target: "A tool for checking meaning",
      voicePrompt: "When a sentence does not make sense, I help you try it again.",
      choices: ["reread", "jump", "milk", "sock"],
      correctChoice: "reread",
      successMessage: "Right. Rereading helps the sentence make sense.",
      coachMessage: "Think about what readers do after a tricky sentence.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["strategy", "comprehension"]
    },
    {
      prompt: "Listen to the clue. Which word fits?",
      target: "A reason word",
      voicePrompt: "I help you tell why something happened.",
      choices: ["because", "green", "chair", "ship"],
      correctChoice: "because",
      successMessage: "Correct. Because tells why.",
      coachMessage: "Listen for the word that gives a reason.",
      accessTier: "paid",
      gradeBand: "2",
      tags: ["academic", "meaning"]
    }
  ]
};

learningActivities.forEach((activity) => {
  activity.rounds.push(...(extraRounds[activity.id] ?? []));
});
