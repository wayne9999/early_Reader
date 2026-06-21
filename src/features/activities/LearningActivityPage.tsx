import { useEffect, useState } from "react";
import { learningActivities } from "../../data/content";
import { recordLearningEvent } from "../../services/learningEventRepository";
import { recordActivityCompletion } from "../../services/progressRepository";
import { celebrate, speak, speakSentence } from "../../shared/speech";
import type { AppUser, LearningActivity, Progress } from "../../types";

type LearningActivityPageProps = {
  activityId: LearningActivity["id"];
  progress: Progress;
  user: AppUser | null;
  onProgressChange: (progress: Progress) => void;
};

export function LearningActivityPage({ activityId, progress, user, onProgressChange }: LearningActivityPageProps) {
  const activity = learningActivities.find((item) => item.id === activityId) ?? learningActivities[0];
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [completedActivities, setCompletedActivities] = useState<Set<LearningActivity["id"]>>(() => new Set());
  const [feedback, setFeedback] = useState("Pick the answer that sounds or makes sense best.");
  const currentRound = activity.rounds[roundIndex] ?? activity.rounds[0];
  const isCompleted = completedActivities.has(activity.id);
  const roundCount = activity.rounds.length;

  useEffect(() => {
    setRoundIndex(0);
    setCorrectAnswers(0);
    setAnsweredCorrectly(false);
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
      correct: isCorrect
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

    setCompletedActivities((current) => new Set(current).add(activity.id));
    onProgressChange(recordActivityCompletion(progress));
    void recordLearningEvent(user, "activity_completed", activity.title, activity.skill, {
      activityId: activity.id,
      rounds: roundCount,
      correctAnswers: nextCorrectAnswers,
      target: currentRound.target,
      correctChoice: currentRound.correctChoice
    });
    celebrate(`You finished ${activity.title}. ${nextCorrectAnswers} of ${roundCount} rounds complete.`);
  }

  function goToNextRound() {
    setRoundIndex((current) => Math.min(current + 1, roundCount - 1));
    setAnsweredCorrectly(false);
    setFeedback("Pick the answer that sounds or makes sense best.");
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{activity.eyebrow}</p>
          <h2>{activity.title}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => speakSentence(currentRound.prompt)}>
          Hear prompt
        </button>
      </div>

      <section className={`activity-hero practice-panel activity-${activity.id}`}>
        <div>
          <p className="eyebrow">Round {roundIndex + 1} of {roundCount}</p>
          <h3>{currentRound.prompt}</h3>
          <p className="helper-text">{activity.intro}</p>
          <div className="activity-round-meter" aria-label={`${roundIndex + 1} of ${roundCount} rounds`}>
            {activity.rounds.map((round, index) => (
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
      </article>
    </>
  );
}
