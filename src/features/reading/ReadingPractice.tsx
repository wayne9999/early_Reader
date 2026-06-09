import { useState } from "react";
import { readingLevels } from "../../data/content";
import { recordKnownWord, recordReadingSession } from "../../services/progressRepository";
import { celebrate, speak, speakSentence, speakSounds, speakWord } from "../../shared/speech";
import type { Progress } from "../../types";

type ReadingPracticeProps = {
  progress: Progress;
  onProgressChange: (progress: Progress) => void;
};

export function ReadingPractice({ progress, onProgressChange }: ReadingPracticeProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const level = readingLevels[levelIndex];
  const word = level.words[wordIndex];

  function goToNextWord() {
    setWordIndex((current) => (current + 1) % level.words.length);
  }

  function handleKnownWord() {
    onProgressChange(recordKnownWord(progress, word.text));
    celebrate(`Nice reading! You knew ${word.text}.`);
    goToNextWord();
  }

  function handleCompleteReading() {
    onProgressChange(recordReadingSession(progress));
    celebrate("Wonderful reading! Let's try the next one.");
    goToNextWord();
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step-by-step reading</p>
          <h2>Practice short sounds, words, and sentences</h2>
        </div>
        <select
          className="level-select"
          aria-label="Choose reading level"
          value={levelIndex}
          onChange={(event) => {
            setLevelIndex(Number(event.target.value));
            setWordIndex(0);
          }}
        >
          {readingLevels.map((readingLevel, index) => (
            <option key={readingLevel.id} value={index}>
              {readingLevel.label}: {readingLevel.focus}
            </option>
          ))}
        </select>
      </div>

      <div className="learning-grid">
        <article className="practice-panel word-panel">
          <div className="panel-header">
            <p className="eyebrow">Sight word</p>
            <span>
              {wordIndex + 1} of {level.words.length}
            </span>
          </div>
          <button className="sound-button" type="button" aria-label="Read the word aloud" onClick={() => speakWord(word.text)}>
            Listen
          </button>
          <p className="big-word">{word.text}</p>
          <p className="helper-text">{word.hint}</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={handleKnownWord}>
              I know it
            </button>
            <button className="secondary-button" type="button" onClick={goToNextWord}>
              Next word
            </button>
          </div>
        </article>

        <article className="practice-panel">
          <p className="eyebrow">Blend sounds</p>
          <h3>
            {word.phonics.title} into "{word.phonics.word}"
          </h3>
          <div className="sound-chips">
            {word.phonics.sounds.map((sound) => (
              <button
                className="sound-chip"
                key={sound}
                type="button"
                onClick={() => speak(sound, { rate: 0.76, pitch: 1.24 })}
              >
                {sound}
              </button>
            ))}
          </div>
          <button className="secondary-button" type="button" onClick={() => speakSounds(word.phonics.sounds, word.phonics.word)}>
            Hear sounds
          </button>
        </article>

        <article className="practice-panel sentence-panel">
          <p className="eyebrow">Read a sentence</p>
          <p className="sentence">{word.sentence}</p>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => speakSentence(word.sentence)}>
              Listen
            </button>
            <button className="primary-button" type="button" onClick={handleCompleteReading}>
              Complete reading
            </button>
          </div>
        </article>
      </div>
    </>
  );
}
