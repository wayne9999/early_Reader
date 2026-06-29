import { useEffect, useRef, useState } from "react";
import { createUserProfile } from "../../services/userProfileRepository";
import { labelFromSignupPath, roleFromSignupPath } from "../../services/signupIntent";
import type { AppUser, SignupPath, StudentGradeLevel, StudentReadingGoal, UserProfile, UserRole } from "../../types";

type RoleSetupProps = {
  user: AppUser | null;
  preferredSignupPath: SignupPath | null;
  onProfileCreated: (profile: UserProfile) => void;
};

export function RoleSetup({ user, preferredSignupPath, onProfileCreated }: RoleSetupProps) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [parentConsentAccepted, setParentConsentAccepted] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<StudentGradeLevel>("K");
  const [readingGoal, setReadingGoal] = useState<StudentReadingGoal>("confidence");
  const [preferredPracticeMinutes, setPreferredPracticeMinutes] = useState(5);
  const preferredRole = preferredSignupPath ? roleFromSignupPath(preferredSignupPath) : null;
  const autoCreateStarted = useRef(false);

  async function chooseRole(role: UserRole, signupPath?: SignupPath) {
    if (!user) {
      setError("Sign in before choosing a role.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      onProfileCreated(await createUserProfile(user, role, signupPath, {
        parentConsentAccepted: role === "student" ? parentConsentAccepted : undefined,
        gradeLevel: role === "student" ? gradeLevel : undefined,
        readingGoal: role === "student" ? readingGoal : undefined,
        preferredPracticeMinutes: role === "student" ? preferredPracticeMinutes : undefined
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create profile.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!preferredSignupPath || !preferredRole || autoCreateStarted.current) {
      return;
    }

    if (preferredRole === "student") {
      return;
    }

    autoCreateStarted.current = true;
    void chooseRole(preferredRole, preferredSignupPath);
  }, [preferredRole, preferredSignupPath]);

  return (
    <article className="practice-panel role-setup">
      <p className="eyebrow">{preferredSignupPath ? "Finishing setup" : "Choose your role"}</p>
      <h2>
        {preferredSignupPath
          ? `Finish ${labelFromSignupPath(preferredSignupPath)} setup`
          : "Set up the right workspace"}
      </h2>
      <p className="helper-text">
        Parent/child and teacher accounts use different emails and different app areas. This keeps child
        learning data separate from classroom management.
      </p>
      {preferredSignupPath ? (
        <div className="selected-signup-path">
          <strong>{labelFromSignupPath(preferredSignupPath)} path selected</strong>
          <span>
            {preferredRole === "teacher"
              ? "Creating your teacher profile and searchable teacher code."
              : "Creating a child learning profile with student permissions."}
          </span>
        </div>
      ) : null}
      {preferredSignupPath ? (
        <div className="setup-status-card" role="status">
          <strong>
            {preferredRole === "student" && !parentConsentAccepted
              ? "Parent consent needed"
              : isSaving
                ? "Creating profile..."
                : error
                  ? "Setup needs attention"
                  : "Profile ready"}
          </strong>
          <span>
            {error
              ? "Review the message below and try again."
              : preferredRole === "student"
                ? "A parent or caregiver must approve child learning history, teacher requests, and progress tracking before the profile is created."
                : "ReadNest is assigning the role from the path you selected before sign-in."}
          </span>
        </div>
      ) : (
        <div className="role-grid">
          <button
            type="button"
            disabled={isSaving || !parentConsentAccepted}
            onClick={() => void chooseRole("student", "parentChild")}
          >
            <strong>Parent / Child</strong>
            <span>Create a child reader space for practice, progress tracking, and teacher requests.</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void chooseRole("teacher", "teacher")}
          >
            <strong>Teacher</strong>
            <span>Manage assigned students, review history, and plan next steps.</span>
          </button>
        </div>
      )}
      {preferredRole === "student" || !preferredSignupPath ? (
        <div className="personalization-setup-grid" aria-label="Personalized reading setup">
          <label>
            <span>Grade level</span>
            <select value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value as StudentGradeLevel)}>
              <option value="K">Kindergarten</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
            </select>
          </label>
          <label>
            <span>Reading goal</span>
            <select value={readingGoal} onChange={(event) => setReadingGoal(event.target.value as StudentReadingGoal)}>
              <option value="confidence">Build confidence</option>
              <option value="phonics">Sound out words</option>
              <option value="sightWords">Remember sight words</option>
              <option value="fluency">Read smoother sentences</option>
            </select>
          </label>
          <label>
            <span>Practice time</span>
            <select
              value={preferredPracticeMinutes}
              onChange={(event) => setPreferredPracticeMinutes(Number(event.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={7}>7 minutes</option>
              <option value={10}>10 minutes</option>
            </select>
          </label>
        </div>
      ) : null}
      {preferredRole === "student" || !preferredSignupPath ? (
        <label className="consent-check">
          <input
            checked={parentConsentAccepted}
            type="checkbox"
            onChange={(event) => setParentConsentAccepted(event.target.checked)}
          />
          <span>
            I am the parent/caregiver or have permission to create this child learning profile. I agree
            ReadNest can save reading practice, progress, teacher requests, and non-diagnostic learning insights.
          </span>
        </label>
      ) : null}
      {preferredRole === "student" ? (
        <button
          className="primary-button"
          disabled={isSaving || !parentConsentAccepted}
          type="button"
          onClick={() => void chooseRole("student", preferredSignupPath ?? undefined)}
        >
          Create Parent / Child profile
        </button>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}
