import { useState } from "react";
import { isFirebaseConfigured } from "../../services/firebase";
import { labelFromSignupPath, saveSignupIntent } from "../../services/signupIntent";
import type { SignupPath, SocialProvider } from "../../types";
import { useAuth } from "./AuthProvider";

const providers: Array<{ id: SocialProvider; label: string; className: string }> = [
  { id: "google", label: "Continue with Google", className: "google-button" },
  { id: "facebook", label: "Continue with Facebook", className: "facebook-button" },
  { id: "instagram", label: "Continue with Instagram", className: "instagram-button" }
];

export function SignInPanel() {
  const { isAuthenticated, isLoading, mode, signIn, signOut, user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<SignupPath>("parentChild");

  async function signInForPath(provider: SocialProvider) {
    saveSignupIntent(selectedPath);
    await signIn(provider);
  }

  return (
    <div className="auth-grid">
      <article className="practice-panel auth-panel">
        <p className="eyebrow">Choose account type</p>
        <h2>Sign up for the right workspace</h2>
        <p className="helper-text">
          Parents create a child learning account for practice and progress. Teachers create a classroom
          account for student requests, history, and intervention planning.
        </p>

        {isAuthenticated ? (
          <div className="account-card">
            {user?.picture ? <img src={user.picture} alt="" /> : <span>{user?.name?.[0] ?? "R"}</span>}
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email ?? `${user?.provider ?? "demo"} account`}</small>
            </div>
            <button className="secondary-button" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="signup-choice-grid" role="radiogroup" aria-label="Choose account type">
              <button
                className={`signup-choice${selectedPath === "parentChild" ? " is-selected" : ""}`}
                type="button"
                aria-pressed={selectedPath === "parentChild"}
                onClick={() => setSelectedPath("parentChild")}
              >
                <span>Parent / Child</span>
                <strong>Set up a child reader</strong>
                <small>Practice reading, save progress, and request a teacher later.</small>
              </button>
              <button
                className={`signup-choice teacher-choice${selectedPath === "teacher" ? " is-selected" : ""}`}
                type="button"
                aria-pressed={selectedPath === "teacher"}
                onClick={() => setSelectedPath("teacher")}
              >
                <span>Teacher</span>
                <strong>Set up classroom tools</strong>
                <small>Review assigned students, learning history, and next steps.</small>
              </button>
            </div>

            <div className="selected-signup-path" aria-live="polite">
              <strong>{labelFromSignupPath(selectedPath)} signup selected</strong>
              <span>
                {selectedPath === "teacher"
                  ? "This creates a teacher role after sign-in."
                  : "This creates a student role for the child learning space after sign-in."}
              </span>
            </div>

            <div className="social-buttons">
              {providers.map((provider) => (
                <button
                  className={`social-button ${provider.className}`}
                  disabled={isLoading}
                  key={provider.id}
                  type="button"
                  onClick={() => void signInForPath(provider.id)}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </>
        )}
      </article>

      <article className="practice-panel setup-panel">
        <p className="eyebrow">Configuration status</p>
        <h3>Auth and database readiness</h3>
        <ul className="next-steps">
          <li>
            Auth mode:{" "}
            {mode === "firebase"
              ? "Firebase Auth configured"
              : mode === "auth0"
                ? "Auth0 configured"
                : "Demo sign-in until auth env values are set"}
          </li>
          <li>
            Database:{" "}
            {isFirebaseConfigured()
              ? "Firestore config present; writes require a Firebase-authenticated session"
              : "Local storage fallback until Firebase env values are set"}
          </li>
          <li>Profile path: users/{`{userId}`} stores role and signup path.</li>
          <li>Progress path: users/{`{userId}`}/learning/progress.</li>
          <li>Teacher lookup path: teacherProfiles/{`{teacherId}`}.</li>
        </ul>
      </article>
    </div>
  );
}
