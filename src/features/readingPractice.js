import { readingLevels } from "../data/content.js";
import { recordKnownWord, recordReadingSession } from "../services/progressStore.js";
import { celebrate, speak, speakSentence, speakSounds, speakWord } from "./speech.js";

export function renderReadingPractice(root, progress, onProgressChange) {
  const template = document.querySelector("#reading-template");
  const view = template.content.cloneNode(true);
  const state = {
    levelIndex: 0,
    wordIndex: 0
  };
  let currentProgress = progress;

  root.replaceChildren(view);

  const levelSelect = root.querySelector("[data-reading-level]");
  const countLabel = root.querySelector("[data-reading-count]");
  const wordText = root.querySelector("[data-current-word]");
  const wordHint = root.querySelector("[data-current-hint]");
  const phonicsTitle = root.querySelector("[data-phonics-title]");
  const soundChips = root.querySelector("[data-sound-chips]");
  const sentenceText = root.querySelector("[data-current-sentence]");

  readingLevels.forEach((level, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${level.label}: ${level.focus}`;
    levelSelect.append(option);
  });

  function currentLevel() {
    return readingLevels[state.levelIndex];
  }

  function updateView() {
    const level = currentLevel();
    const word = level.words[state.wordIndex];

    countLabel.textContent = `${state.wordIndex + 1} of ${level.words.length}`;
    wordText.textContent = word.text;
    wordHint.textContent = word.hint;
    phonicsTitle.textContent = `${word.phonics.title} into "${word.phonics.word}"`;
    sentenceText.textContent = word.sentence;

    soundChips.replaceChildren(
      ...word.phonics.sounds.map((sound) => {
        const chip = document.createElement("button");
        chip.className = "sound-chip";
        chip.type = "button";
        chip.textContent = sound;
        chip.addEventListener("click", () => speak(sound, { rate: 0.76, pitch: 1.24 }));
        return chip;
      })
    );
  }

  levelSelect.addEventListener("change", (event) => {
    state.levelIndex = Number(event.target.value);
    state.wordIndex = 0;
    updateView();
  });

  root.querySelector("[data-speak-word]").addEventListener("click", () => {
    speakWord(currentLevel().words[state.wordIndex].text);
  });

  root.querySelector("[data-known-word]").addEventListener("click", () => {
    const word = currentLevel().words[state.wordIndex].text;
    currentProgress = recordKnownWord(currentProgress, word);
    onProgressChange(currentProgress, { render: false });
    celebrate(`Nice reading! You knew ${word}.`);
    goToNextWord();
  });

  function goToNextWord() {
    state.wordIndex = (state.wordIndex + 1) % currentLevel().words.length;
    updateView();
  }

  root.querySelector("[data-next-word]").addEventListener("click", () => {
    goToNextWord();
  });

  root.querySelector("[data-speak-sounds]").addEventListener("click", () => {
    const word = currentLevel().words[state.wordIndex];
    speakSounds(word.phonics.sounds, word.phonics.word);
  });

  root.querySelector("[data-speak-sentence]").addEventListener("click", () => {
    speakSentence(currentLevel().words[state.wordIndex].sentence);
  });

  root.querySelector("[data-complete-reading]").addEventListener("click", () => {
    currentProgress = recordReadingSession(currentProgress);
    onProgressChange(currentProgress, { render: false });
    celebrate("Wonderful reading! Let's try the next one.");
    goToNextWord();
  });

  updateView();
}
