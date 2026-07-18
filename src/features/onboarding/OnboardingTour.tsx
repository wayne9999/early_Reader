import type { AppView, UserProfile } from "../../types";

type OnboardingTourProps = {
  profile: UserProfile;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
};

export function OnboardingTour({ profile, onClose, onNavigate }: OnboardingTourProps) {
  const isTeacher = profile.role === "teacher";

  function goToNextStep() {
    onClose();
    onNavigate(isTeacher ? "teacher" : "findTeacher");
  }

  return (
    <div className="tour-backdrop" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <article className="tour-card">
        <p className="eyebrow">Quick start</p>
        <h2 id="tour-title">{isTeacher ? "Set up your teaching space" : "Start your child's reading path"}</h2>
        <div className="tour-steps">
          <section>
            <span aria-hidden="true">1</span>
            <strong>{isTeacher ? "Complete your profile" : "Choose a teacher guide"}</strong>
            <p>
              {isTeacher
                ? "Add your bio, specialties, and capacity so families know if you are a good fit."
                : "Assigned teachers are the adults who can review practice and suggest what to work on next."}
            </p>
          </section>
          <section>
            <span aria-hidden="true">2</span>
            <strong>Practice in short rounds</strong>
            <p>Use Listen first, let the child try, then tap the green check or next arrow.</p>
          </section>
          <section>
            <span aria-hidden="true">3</span>
            <strong>Follow the next step</strong>
            <p>Badges and the dashboard point to the next activity after each reading set.</p>
          </section>
        </div>
        <div className="tour-actions">
          <button className="primary-button" type="button" onClick={goToNextStep}>
            {isTeacher ? "Open dashboard" : "Choose teacher"}
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Start on my own
          </button>
        </div>
      </article>
    </div>
  );
}
