import { useEffect, useMemo, useState } from "react";
import { learningActivities } from "../../data/content";
import { contentAccessTier, contentTierSummary, filterContentForTier } from "../../services/contentAccess";
import { playActivityVoicePrompt } from "../../services/activityVoiceService";
import { loadLearningEvents, recordLearningEvent } from "../../services/learningEventRepository";
import { buildStudentPersonalizedPlan, personalizeActivityRounds } from "../../services/personalizationService";
import { trackProductEvent } from "../../services/productAnalytics";
import { recordActivityCompletion } from "../../services/progressRepository";
import { celebrate, speak, speakSentence } from "../../shared/speech";
import type { AppUser, LearningActivity, LearningEvent, Progress, SubscriptionRecord, UserProfile } from "../../types";

type LearningActivityPageProps = {
  activityId: LearningActivity["id"];
  progress: Progress;
  user: AppUser | null;
  profile?: UserProfile | null;
  subscription?: SubscriptionRecord | null;
  onProgressChange: (progress: Progress) => void;
};

export function LearningActivityPage({ activityId, progress, user, profile, subscription, onProgressChange }: LearningActivityPageProps) {
  const activity = learningActivities.find((item) => item.id === activityId) ?? learningActivities[0];
  const tier = contentAccessTier(user, profile, subscription);
  const tierSummary = contentTierSummary(tier);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState("Pick the answer that sounds or makes sense best.");
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const personalizedPlan = useMemo(
    () => buildStudentPersonalizedPlan({ profile, progress, events }),
    [events, profile, progress]
  );
  const personalizedRounds = useMemo(
    () => personalizeActivityRounds({
      activity: {
        ...activity,
        rounds: filterContentForTier(activity.rounds, tier)
      },
      profile,
      events,
      focusAreas: personalizedPlan.focusAreas
    }),
    [activity, events, personalizedPlan.focusAreas, profile, tier]
  );
  const currentRound = personalizedRounds.rounds[roundIndex] ?? personalizedRounds.rounds[0];
  const roundCount = personalizedRounds.rounds.length;

  useEffect(() => {
    let isMounted = true;

    loadLearningEvents(user).then((loadedEvents) => {
      if (isMounted) {
        setEvents(loadedEvents);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, progress]);

  useEffect(() => {
    void recordLearningEvent(user, "activity_started", activity.title, activity.skill, {
      activityId: activity.id,
      rounds: roundCount,
      currentRound: roundIndex + 1,
      personalized: true,
      personalizationReason: personalizedRounds.reason,
      focusAreas: personalizedPlan.focusAreas.join(","),
      contentTier: tier
    });
  }, [activity.id, activity.skill, activity.title, personalizedPlan.focusAreas, personalizedRounds.reason, roundCount, roundIndex, tier, user]);

  useEffect(() => {
    setRoundIndex(0);
    setCorrectAnswers(0);
    setAnsweredCorrectly(false);
    setIsCompleted(false);
    setFeedback("Pick the answer that sounds or makes sense best.");
  }, [activity.id]);

  function chooseAnswer(choice: string) {
    if (isCompleted || answeredCorrectly) {
      return;
    }

    const isCorrect = choice === currentRound.correctChoice;

    void recordLearningEvent(user, "activity_answer", `${activity.title}: ${currentRound.target}`, activity.skill, {
      activityId: activity.id,
      round: roundIndex + 1,
      target: currentRound.target,
      selectedChoice: choice,
      correctChoice: currentRound.correctChoice,
      correct: isCorrect,
      personalized: true,
      personalizationReason: personalizedRounds.reason,
      contentTier: tier
    });

    if (!isCorrect) {
      setFeedback(currentRound.coachMessage);
      speak(currentRound.coachMessage, { rate: 0.9, pitch: 1.04 });
      return;
    }

    const nextCorrectAnswers = correctAnswers + 1;
    setCorrectAnswers(nextCorrectAnswers);
    setAnsweredCorrectly(true);
    setFeedback(currentRound.successMessage);

    if (roundIndex < roundCount - 1) {
      speak(currentRound.successMessage, { rate: 0.92, pitch: 1.05 });
      return;
    }

    setIsCompleted(true);
    onProgressChange(recordActivityCompletion(progress));
    void recordLearningEvent(user, "activity_completed", activity.title, activity.skill, {
      activityId: activity.id,
      rounds: roundCount,
      correctAnswers: nextCorrectAnswers,
      target: currentRound.target,
      correctChoice: currentRound.correctChoice,
      personalized: true,
      personalizationReason: personalizedRounds.reason,
      contentTier: tier
    });
    void trackProductEvent(user, "activity_completed", {
      activityId: activity.id,
      rounds: roundCount,
      correctAnswers: nextCorrectAnswers
    });
    celebrate(`You finished ${activity.title}. ${nextCorrectAnswers} of ${roundCount} rounds complete.`);
  }

  function goToNextRound() {
    const nextRound = Math.min(roundIndex + 1, roundCount - 1);
    void recordLearningEvent(user, "activity_round_advanced", `${activity.title}: round ${nextRound + 1}`, activity.skill, {
      activityId: activity.id,
      fromRound: roundIndex + 1,
      toRound: nextRound + 1,
      correctAnswers,
      personalized: true
    });
    setRoundIndex(nextRound);
    setAnsweredCorrectly(false);
    setFeedback("Pick the answer that sounds or makes sense best.");
  }

  function restartActivity() {
    setRoundIndex(0);
    setCorrectAnswers(0);
    setAnsweredCorrectly(false);
    setIsCompleted(false);
    setFeedback("Pick the answer that sounds or makes sense best.");
    void recordLearningEvent(user, "activity_started", activity.title, activity.skill, {
      activityId: activity.id,
      rounds: roundCount,
      currentRound: 1,
      action: "play_again",
      personalized: true,
      personalizationReason: personalizedRounds.reason,
      contentTier: tier
    });
  }

  async function hearPrompt() {
    const promptText = currentRound.voicePrompt ?? currentRound.prompt;
    const voiceProvider = activity.voiceMode === "elevenLabs"
      ? await playActivityVoicePrompt({
          activityId: activity.id,
          roundKey: `${roundIndex + 1}-${currentRound.target}`,
          text: promptText
        })
      : (speakSentence(promptText), "browser");

    void recordLearningEvent(user, "activity_prompt_listened", `${activity.title}: ${currentRound.target}`, activity.skill, {
      activityId: activity.id,
      round: roundIndex + 1,
      target: currentRound.target,
      prompt: promptText,
      personalized: true,
      premiumVoice: activity.voiceMode === "elevenLabs",
      voiceProvider,
      contentTier: tier
    });
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{activity.eyebrow}</p>
          <h2>{activity.title}</h2>
          <p className="helper-text">
            Personalized for {personalizedPlan.learnerName}: {personalizedRounds.reason}.
          </p>
        </div>
        <button
          className="secondary-button child-action-button"
          type="button"
          onClick={() => void hearPrompt()}
        >
          <span className="button-symbol" aria-hidden="true">▶</span>
          <span>{activity.voiceMode === "elevenLabs" ? "Hear story voice" : "Hear prompt"}</span>
        </button>
      </div>

      <article className={`content-tier-banner is-${tier}`}>
        <div>
          <p className="eyebrow">{tierSummary.label}</p>
          <h3>{tierSummary.message}</h3>
        </div>
        <span>{roundCount} rounds in this game</span>
      </article>

      <section className="kid-step-guide activity-step-guide" aria-label={`${activity.title} play steps`}>
        <article>
          <span aria-hidden="true">1</span>
          <strong>Hear it</strong>
          <small>Tap the voice button.</small>
        </article>
        <article>
          <span aria-hidden="true">2</span>
          <strong>Choose</strong>
          <small>Pick the best answer card.</small>
        </article>
        <article>
          <span aria-hidden="true">3</span>
          <strong>Keep going</strong>
          <small>Finish all {roundCount} quick rounds.</small>
        </article>
      </section>

      <section className={`activity-hero practice-panel activity-${activity.id}`}>
        <div>
          <p className="eyebrow">Round {roundIndex + 1} of {roundCount}</p>
          <h3>{currentRound.prompt}</h3>
          <p className="helper-text">{activity.intro}</p>
          <div className="activity-round-meter" aria-label={`${roundIndex + 1} of ${roundCount} rounds`}>
            {personalizedRounds.rounds.map((round, index) => (
              <span
                className={index < roundIndex || (index === roundIndex && answeredCorrectly) ? "is-done" : ""}
                key={`${round.prompt}-${index}`}
              />
            ))}
          </div>
        </div>
        <div className="activity-target" aria-label={`Target: ${currentRound.target}`}>
          {currentRound.target}
        </div>
      </section>

      <section className="activity-choice-grid" aria-label={`${activity.title} choices`}>
        {currentRound.choices.map((choice) => (
          <button
            className={`activity-choice${answeredCorrectly && choice === currentRound.correctChoice ? " is-correct" : ""}`}
            disabled={isCompleted || answeredCorrectly}
            key={choice}
            type="button"
            onClick={() => chooseAnswer(choice)}
          >
            <span className="choice-mark" aria-hidden="true">{answeredCorrectly && choice === currentRound.correctChoice ? "✓" : "Tap"}</span>
            <span>{choice}</span>
          </button>
        ))}
      </section>

      <article className={`practice-panel activity-coach-panel${isCompleted ? " is-complete" : ""}`}>
        <p className="eyebrow">{isCompleted ? "Activity complete" : answeredCorrectly ? "Nice work" : "Teacher tip"}</p>
        {isCompleted ? <span className="reward-medal" aria-hidden="true">★</span> : null}
        <h3>{isCompleted ? `${activity.shortLabel} badge earned` : feedback}</h3>
        <p className="helper-text">
          {isCompleted
            ? `Nice work. You completed ${correctAnswers} of ${roundCount} rounds. Play again to beat your score or open the menu for the next challenge.`
            : answeredCorrectly
              ? "Move to the next round when you are ready."
              : "Try the answer that matches the sound, meaning, or story clue."}
        </p>
        {!isCompleted && answeredCorrectly ? (
          <button className="primary-button child-action-button next-action" type="button" onClick={goToNextRound}>
            <span>Next round</span>
            <span className="button-symbol" aria-hidden="true">→</span>
          </button>
        ) : null}
        {isCompleted ? (
          <button className="primary-button child-action-button" type="button" onClick={restartActivity}>
            <span className="button-symbol" aria-hidden="true">↻</span>
            <span>Play again</span>
          </button>
        ) : null}
      </article>
    </>
  );
}
