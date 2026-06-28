import { useEffect, useMemo, useState } from "react";
import { learningActivities } from "../../data/content";
import { playActivityVoicePrompt } from "../../services/activityVoiceService";
import { loadLearningEvents, recordLearningEvent } from "../../services/learningEventRepository";
import { buildStudentPersonalizedPlan, personalizeActivityRounds } from "../../services/personalizationService";
import { trackProductEvent } from "../../services/productAnalytics";
import { recordActivityCompletion } from "../../services/progressRepository";
import { celebrate, speak, speakSentence } from "../../shared/speech";
import type { AppUser, LearningActivity, LearningEvent, Progress, UserProfile } from "../../types";

type LearningActivityPageProps = {
  activityId: LearningActivity["id"];
  progress: Progress;
  user: AppUser | null;
  profile?: UserProfile | null;
  onProgressChange: (progress: Progress) => void;
};

export function LearningActivityPage({ activityId, progress, user, profile, onProgressChange }: LearningActivityPageProps) {
  const activity = learningActivities.find((item) => item.id === activityId) ?? learningActivities[0];
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
      activity,
      profile,
      events,
      focusAreas: personalizedPlan.focusAreas
    }),
    [activity, events, personalizedPlan.focusAreas, profile]
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
      focusAreas: personalizedPlan.focusAreas.join(",")
    });
  }, [activity.id, activity.skill, activity.title, personalizedPlan.focusAreas, personalizedRounds.reason, roundCount, roundIndex, user]);

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
      personalizationReason: personalizedRounds.reason
    });

    if (!isCorrect) {
      setFeedback(currentRound.coachMessage);
      speak(currentRound.coachMessage, { rate: 0.9, pitch: 1.14 });
      return;
    }

    const nextCorrectAnswers = correctAnswers + 1;
    setCorrectAnswers(nextCorrectAnswers);
    setAnsweredCorrectly(true);
    setFeedback(currentRound.successMessage);

    if (roundIndex < roundCount - 1) {
      speak(currentRound.successMessage, { rate: 0.92, pitch: 1.16 });
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
      personalizationReason: personalizedRounds.reason
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
      personalizationReason: personalizedRounds.reason
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
      voiceProvider
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
          className="secondary-button"
          type="button"
          onClick={() => void hearPrompt()}
        >
          {activity.voiceMode === "elevenLabs" ? "Hear story voice" : "Hear prompt"}
        </button>
      </div>

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
            <span>{choice}</span>
          </button>
        ))}
      </section>

      <article className="practice-panel activity-coach-panel">
        <p className="eyebrow">{isCompleted ? "Activity complete" : answeredCorrectly ? "Nice work" : "Teacher tip"}</p>
        <h3>{feedback}</h3>
        <p className="helper-text">
          {isCompleted
            ? `Nice work. You completed ${correctAnswers} of ${roundCount} rounds. Choose another activity from the menu when you are ready.`
            : answeredCorrectly
              ? "Move to the next round when you are ready."
              : "Try the answer that matches the sound, meaning, or story clue."}
        </p>
        {!isCompleted && answeredCorrectly ? (
          <button className="primary-button" type="button" onClick={goToNextRound}>
            Next round
          </button>
        ) : null}
        {isCompleted ? (
          <button className="primary-button" type="button" onClick={restartActivity}>
            Play again
          </button>
        ) : null}
      </article>
    </>
  );
}
