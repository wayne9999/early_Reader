import { useState } from "react";
import { createUserProfile } from "../../services/userProfileRepository";
import type { AppUser, UserProfile, UserRole } from "../../types";

type RoleSetupProps = {
  user: AppUser | null;
  onProfileCreated: (profile: UserProfile) => void;
};

export function RoleSetup({ user, onProfileCreated }: RoleSetupProps) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function chooseRole(role: UserRole) {
    if (!user) {
      setError("Sign in before choosing a role.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      onProfileCreated(await createUserProfile(user, role));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="practice-panel role-setup">
      <p className="eyebrow">Choose your role</p>
      <h2>Set up the right workspace</h2>
      <p className="helper-text">
        Student and teacher accounts use different emails and different app areas. This keeps learning
        practice separate from classroom management.
      </p>
      <div className="role-grid">
        <button type="button" disabled={isSaving} onClick={() => void chooseRole("student")}>
          <strong>Student</strong>
          <span>Practice reading, track progress, and request a teacher.</span>
        </button>
        <button type="button" disabled={isSaving} onClick={() => void chooseRole("teacher")}>
          <strong>Teacher</strong>
          <span>Manage assigned students, review history, and plan next steps.</span>
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}
