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
  const [completedActivities, setCompletedActivities] = useState<Set<LearningActivity["id"]>>(() => new Set());
  const [feedback, setFeedback] = useState("Pick the answer that sounds or makes sense best.");
  const isCompleted = completedActivities.has(activity.id);

  useEffect(() => {
    setFeedback(
      completedActivities.has(activity.id)
        ? activity.successMessage
        : "Pick the answer that sounds or makes sense best."
    );
  }, [activity.id, activity.successMessage, completedActivities]);

  function chooseAnswer(choice: string) {
    if (isCompleted) {
      return;
    }

    const isCorrect = choice === activity.correctChoice;

    if (!isCorrect) {
      setFeedback(activity.coachMessage);
      speak(activity.coachMessage, { rate: 0.9, pitch: 1.14 });
      return;
    }

    setCompletedActivities((current) => new Set(current).add(activity.id));
    setFeedback(activity.successMessage);
    onProgressChange(recordActivityCompletion(progress));
    void recordLearningEvent(user, "activity_completed", activity.title, activity.skill, {
      activityId: activity.id,
      target: activity.target,
      correctChoice: activity.correctChoice
    });
    celebrate(activity.successMessage);
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{activity.eyebrow}</p>
          <h2>{activity.title}</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => speakSentence(activity.prompt)}>
          Hear prompt
        </button>
      </div>

      <section className={`activity-hero practice-panel activity-${activity.id}`}>
        <div>
          <p className="eyebrow">Logged-in activity</p>
          <h3>{activity.prompt}</h3>
          <p className="helper-text">{activity.intro}</p>
        </div>
        <div className="activity-target" aria-label={`Target: ${activity.target}`}>
          {activity.target}
        </div>
      </section>

      <section className="activity-choice-grid" aria-label={`${activity.title} choices`}>
        {activity.choices.map((choice) => (
          <button
            className={`activity-choice${isCompleted && choice === activity.correctChoice ? " is-correct" : ""}`}
            disabled={isCompleted}
            key={choice}
            type="button"
            onClick={() => chooseAnswer(choice)}
          >
            <span>{choice}</span>
          </button>
        ))}
      </section>

      <article className="practice-panel activity-coach-panel">
        <p className="eyebrow">{isCompleted ? "Activity complete" : "Teacher tip"}</p>
        <h3>{feedback}</h3>
        <p className="helper-text">
          {isCompleted
            ? "Nice work. Choose another activity from the menu when you are ready."
            : "Try the answer that matches the sound, meaning, or story clue."}
        </p>
      </article>
    </>
  );
}
