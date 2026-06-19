import { useState, type FormEvent } from "react";
import { isFirebaseConfigured } from "../../services/firebase";
import { labelFromSignupPath, saveSignupIntent } from "../../services/signupIntent";
import type { AppView, SignupPath, SocialProvider } from "../../types";
import { useAuth } from "./AuthProvider";

const providers: Array<{ id: SocialProvider; label: string; className: string }> = [
  { id: "google", label: "Continue with Google", className: "google-button" },
  { id: "facebook", label: "Continue with Facebook", className: "facebook-button" },
  { id: "instagram", label: "Continue with Instagram", className: "instagram-button" }
];

type SignInPanelProps = {
  redirectView?: AppView | null;
};

export function SignInPanel({ redirectView = null }: SignInPanelProps) {
  const { isAuthenticated, isLoading, mode, signIn, signInWithEmail, signOut, user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<SignupPath>("parentChild");
  const [emailMode, setEmailMode] = useState<"signUp" | "signIn">("signUp");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  async function signInForPath(provider: SocialProvider) {
    saveSignupIntent(selectedPath);
    await signIn(provider);
  }

  async function submitEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");

    if (emailMode === "signUp") {
      saveSignupIntent(selectedPath);
    }

    try {
      await signInWithEmail({
        email,
        password,
        displayName,
        mode: emailMode
      });
    } catch (caughtError) {
      setAuthError(caughtError instanceof Error ? caughtError.message : "Email sign-in failed.");
    }
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

        {redirectView ? (
          <div className="redirect-notice" role="status">
            <strong>Sign in to continue to the page from your link.</strong>
            <span>ReadNest saved that link and will open it after your account is ready.</span>
          </div>
        ) : null}

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
                aria-label="Choose Parent / Child signup"
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
                aria-label="Choose Teacher signup"
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

            <form className="email-auth-form" onSubmit={(event) => void submitEmailAuth(event)}>
              <div className="email-mode-toggle" role="group" aria-label="Email account action">
                <button
                  className={emailMode === "signUp" ? "is-selected" : ""}
                  type="button"
                  onClick={() => setEmailMode("signUp")}
                >
                  Create account
                </button>
                <button
                  className={emailMode === "signIn" ? "is-selected" : ""}
                  type="button"
                  onClick={() => setEmailMode("signIn")}
                >
                  Sign in
                </button>
              </div>
              {emailMode === "signUp" ? (
                <label>
                  <span>Parent, teacher, or child display name</span>
                  <input
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Example: Mrs. Baker or Jayden"
                  />
                </label>
              ) : null}
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  autoComplete={emailMode === "signUp" ? "new-password" : "current-password"}
                  minLength={6}
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>
              {authError ? <p className="form-error">{authError}</p> : null}
              <button className="primary-button" disabled={isLoading} type="submit">
                {emailMode === "signUp" ? `Create ${labelFromSignupPath(selectedPath)} account` : "Sign in with email"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or use a connected provider</span>
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
