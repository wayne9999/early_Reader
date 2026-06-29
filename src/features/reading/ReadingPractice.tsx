import { useEffect, useState } from "react";
import { readingLevels } from "../../data/content";
import { recordKnownWord, recordReadingSession } from "../../services/progressRepository";
import { celebrate, speak, speakSentence, speakSounds, speakWord } from "../../shared/speech";
import type { AppUser, Progress } from "../../types";
import { recordLearningEvent } from "../../services/learningEventRepository";

type ReadingPracticeProps = {
  progress: Progress;
  user: AppUser | null;
  onProgressChange: (progress: Progress) => void;
};

export function ReadingPractice({ progress, user, onProgressChange }: ReadingPracticeProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const level = readingLevels[levelIndex];
  const word = level.words[wordIndex];

  useEffect(() => {
    void recordLearningEvent(user, "reading_started", word.text, "sightWords", {
      level: level.id,
      word: word.text,
      sentence: word.sentence,
      wordIndex: wordIndex + 1,
      totalWords: level.words.length
    });
  }, [level.id, level.words.length, user, word.sentence, word.text, wordIndex]);

  function wordMetadata() {
    return {
      level: level.id,
      word: word.text,
      sentence: word.sentence,
      wordIndex: wordIndex + 1,
      totalWords: level.words.length
    };
  }

  function advanceWord() {
    setWordIndex((current) => (current + 1) % level.words.length);
  }

  function skipWord() {
    void recordLearningEvent(user, "word_skipped", word.text, "sightWords", {
      ...wordMetadata(),
      action: "next_word"
    });
    advanceWord();
  }

  function handleKnownWord() {
    onProgressChange(recordKnownWord(progress, word.text));
    void recordLearningEvent(user, "word_known", word.text, "sightWords", {
      ...wordMetadata(),
      correct: true
    });
    celebrate(`Nice reading! You knew ${word.text}.`);
    advanceWord();
  }

  function handleCompleteReading() {
    onProgressChange(recordReadingSession(progress));
    void recordLearningEvent(user, "reading_completed", word.sentence, "fluency", {
      ...wordMetadata(),
      correct: true
    });
    celebrate("Wonderful reading! Let's try the next one.");
    advanceWord();
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
            const nextLevelIndex = Number(event.target.value);
            const nextLevel = readingLevels[nextLevelIndex];
            void recordLearningEvent(user, "reading_started", nextLevel.words[0].text, "sightWords", {
              level: nextLevel.id,
              word: nextLevel.words[0].text,
              sentence: nextLevel.words[0].sentence,
              wordIndex: 1,
              totalWords: nextLevel.words.length,
              action: "level_changed"
            });
            setLevelIndex(nextLevelIndex);
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
          <button
            className="sound-button"
            type="button"
            aria-label="Read the word aloud"
            onClick={() => {
              speakWord(word.text);
              void recordLearningEvent(user, "word_listened", word.text, "sightWords", wordMetadata());
            }}
          >
            <span className="button-symbol" aria-hidden="true">▶</span>
            <span>Listen</span>
          </button>
          <p className="big-word">{word.text}</p>
          <p className="helper-text">{word.hint}</p>
          <div className="button-row">
            <button className="primary-button child-action-button success-action" type="button" onClick={handleKnownWord}>
              <span className="button-symbol" aria-hidden="true">✓</span>
              <span>I know it</span>
            </button>
            <button className="secondary-button child-action-button next-action" type="button" onClick={skipWord}>
              <span>Next word</span>
              <span className="button-symbol" aria-hidden="true">→</span>
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
                onClick={() => {
                  speak(sound, { rate: 0.76, pitch: 1.24 });
                  void recordLearningEvent(user, "sound_listened", sound, "phonics", {
                    ...wordMetadata(),
                    sound,
                    phonicsWord: word.phonics.word
                  });
                }}
              >
                {sound}
              </button>
            ))}
          </div>
          <button
            className="secondary-button child-action-button"
            type="button"
            onClick={() => {
              speakSounds(word.phonics.sounds, word.phonics.word);
              void recordLearningEvent(user, "sound_listened", word.phonics.word, "phonics", {
                ...wordMetadata(),
                sounds: word.phonics.sounds.join(" "),
                phonicsWord: word.phonics.word
              });
            }}
          >
            <span className="button-symbol" aria-hidden="true">▶</span>
            <span>Hear sounds</span>
          </button>
        </article>

        <article className="practice-panel sentence-panel">
          <p className="eyebrow">Read a sentence</p>
          <p className="sentence">{word.sentence}</p>
          <div className="button-row">
            <button
              className="secondary-button child-action-button"
              type="button"
              onClick={() => {
                speakSentence(word.sentence);
                void recordLearningEvent(user, "sentence_listened", word.sentence, "fluency", {
                  ...wordMetadata()
                });
              }}
            >
              <span className="button-symbol" aria-hidden="true">▶</span>
              <span>Listen</span>
            </button>
            <button className="primary-button child-action-button success-action" type="button" onClick={handleCompleteReading}>
              <span className="button-symbol" aria-hidden="true">✓</span>
              <span>Complete reading</span>
            </button>
          </div>
        </article>
      </div>
    </>
  );
}
