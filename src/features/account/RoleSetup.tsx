import { useState } from "react";
import { createUserProfile } from "../../services/userProfileRepository";
import { labelFromSignupPath, roleFromSignupPath } from "../../services/signupIntent";
import type { AppUser, SignupPath, UserProfile, UserRole } from "../../types";

type RoleSetupProps = {
  user: AppUser | null;
  preferredSignupPath: SignupPath | null;
  onProfileCreated: (profile: UserProfile) => void;
};

export function RoleSetup({ user, preferredSignupPath, onProfileCreated }: RoleSetupProps) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const preferredRole = preferredSignupPath ? roleFromSignupPath(preferredSignupPath) : null;

  async function chooseRole(role: UserRole, signupPath?: SignupPath) {
    if (!user) {
      setError("Sign in before choosing a role.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      onProfileCreated(await createUserProfile(user, role, signupPath));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="practice-panel role-setup">
      <p className="eyebrow">Choose your role</p>
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
              ? "This will create a teacher profile and searchable teacher code."
              : "This will create a child learning profile with student permissions."}
          </span>
        </div>
      ) : null}
      <div className="role-grid">
        <button
          className={preferredRole === "student" ? "is-recommended" : ""}
          type="button"
          disabled={isSaving}
          onClick={() => void chooseRole("student", "parentChild")}
        >
          <strong>Parent / Child</strong>
          <span>Create a child reader space for practice, progress tracking, and teacher requests.</span>
        </button>
        <button
          className={preferredRole === "teacher" ? "is-recommended" : ""}
          type="button"
          disabled={isSaving}
          onClick={() => void chooseRole("teacher", "teacher")}
        >
          <strong>Teacher</strong>
          <span>Manage assigned students, review history, and plan next steps.</span>
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}
