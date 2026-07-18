import { useEffect, useState } from "react";
import { readingLevels } from "../../data/content";
import { contentAccessTier, contentTierSummary, filterContentForTier } from "../../services/contentAccess";
import { recordKnownWord, recordReadingSession } from "../../services/progressRepository";
import { celebrate, speak, speakSentence, speakSounds, speakWord } from "../../shared/speech";
import type { AppUser, AppView, Progress, SubscriptionRecord, UserProfile } from "../../types";
import { recordLearningEvent } from "../../services/learningEventRepository";

type ReadingPracticeProps = {
  progress: Progress;
  user: AppUser | null;
  profile?: UserProfile | null;
  subscription?: SubscriptionRecord | null;
  onProgressChange: (progress: Progress) => void;
  onNextActivity?: (view: AppView) => void;
};

export function ReadingPractice({ progress, user, profile, subscription, onProgressChange, onNextActivity }: ReadingPracticeProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [reward, setReward] = useState<{ title: string; message: string; nextView: AppView; nextLabel: string } | null>(null);
  const tier = contentAccessTier(user, profile, subscription);
  const tierSummary = contentTierSummary(tier);
  const level = readingLevels[levelIndex];
  const levelWords = filterContentForTier(level.words, tier);
  const word = levelWords[wordIndex] ?? levelWords[0] ?? level.words[0];

  useEffect(() => {
    if (wordIndex >= levelWords.length) {
      setWordIndex(0);
    }
  }, [levelWords.length, wordIndex]);

  useEffect(() => {
    void recordLearningEvent(user, "reading_started", word.text, "sightWords", {
      level: level.id,
      word: word.text,
      sentence: word.sentence,
      wordIndex: wordIndex + 1,
      totalWords: levelWords.length,
      contentTier: tier
    });
  }, [level.id, levelWords.length, tier, user, word.sentence, word.text, wordIndex]);

  function wordMetadata() {
    return {
      level: level.id,
      word: word.text,
      sentence: word.sentence,
      wordIndex: wordIndex + 1,
      totalWords: levelWords.length,
      contentTier: tier
    };
  }

  function advanceWord() {
    setWordIndex((current) => (current + 1) % levelWords.length);
  }

  function showSetReward(source: "word" | "sentence") {
    if (wordIndex !== levelWords.length - 1) {
      setReward(null);
      return;
    }

    setReward({
      title: "Sunny Reader badge earned",
      message:
        source === "word"
          ? "You read the whole word set. Try Memory Match next so the words stick."
          : "You finished the sentence set. Try Memory Match next so the story words stay fresh.",
      nextView: "memory",
      nextLabel: "Play Memory Match"
    });
  }

  function skipWord() {
    void recordLearningEvent(user, "word_skipped", word.text, "sightWords", {
      ...wordMetadata(),
      action: "next_word"
    });
    setReward(null);
    advanceWord();
  }

  function handleKnownWord() {
    onProgressChange(recordKnownWord(progress, word.text));
    void recordLearningEvent(user, "word_known", word.text, "sightWords", {
      ...wordMetadata(),
      correct: true
    });
    const isSetComplete = wordIndex === levelWords.length - 1;
    celebrate(isSetComplete ? "Badge earned! You finished this word set." : `Nice reading! You knew ${word.text}.`);
    showSetReward("word");
    advanceWord();
  }

  function handleCompleteReading() {
    onProgressChange(recordReadingSession(progress));
    void recordLearningEvent(user, "reading_completed", word.sentence, "fluency", {
      ...wordMetadata(),
      correct: true
    });
    const isSetComplete = wordIndex === levelWords.length - 1;
    celebrate(isSetComplete ? "Badge earned! You finished this sentence set." : "Wonderful reading! Let's try the next one.");
    showSetReward("sentence");
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
            const nextLevelWords = filterContentForTier(nextLevel.words, tier);
            const nextWord = nextLevelWords[0] ?? nextLevel.words[0];
            void recordLearningEvent(user, "reading_started", nextWord.text, "sightWords", {
              level: nextLevel.id,
              word: nextWord.text,
              sentence: nextWord.sentence,
              wordIndex: 1,
              totalWords: nextLevelWords.length,
              contentTier: tier,
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

      <article className={`content-tier-banner is-${tier}`}>
        <div>
          <p className="eyebrow">{tierSummary.label}</p>
          <h3>{tierSummary.message}</h3>
        </div>
        <span>{levelWords.length} words in this level</span>
      </article>

      <section className="kid-step-guide" aria-label="Reading practice steps">
        <article>
          <span aria-hidden="true">1</span>
          <strong>Listen</strong>
          <small>Hear the word first.</small>
        </article>
        <article>
          <span aria-hidden="true">2</span>
          <strong>Read</strong>
          <small>Try it out loud.</small>
        </article>
        <article>
          <span aria-hidden="true">3</span>
          <strong>Tap yes</strong>
          <small>Use the green check when it feels good.</small>
        </article>
      </section>

      {reward ? (
        <article className="practice-panel reading-reward-card" role="status" aria-live="polite">
          <span className="reward-medal" aria-hidden="true">
            ★
          </span>
          <div>
            <p className="eyebrow">Level complete</p>
            <h3>{reward.title}</h3>
            <p className="helper-text">{reward.message}</p>
          </div>
          <button
            className="primary-button child-action-button"
            type="button"
            onClick={() => onNextActivity?.(reward.nextView)}
          >
            <span>{reward.nextLabel}</span>
            <span className="button-symbol" aria-hidden="true">
              →
            </span>
          </button>
        </article>
      ) : null}

      <div className="learning-grid">
        <article className="practice-panel word-panel">
          <div className="panel-header">
            <p className="eyebrow">Sight word</p>
            <span>
              {wordIndex + 1} of {levelWords.length}
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
                  speak(sound, { rate: 0.8, pitch: 1.04 });
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
