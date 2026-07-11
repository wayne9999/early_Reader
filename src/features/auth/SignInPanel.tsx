import { useEffect, useMemo, useState, type FormEvent } from "react";
import { isFirebaseConfigured } from "../../services/firebase";
import { trackProductEvent } from "../../services/productAnalytics";
import { labelFromSignupPath, saveSignupIntent } from "../../services/signupIntent";
import { subscriptionTiers } from "../../services/billingConfig";
import type { AppView, SignupPath, SocialProvider, SubscriptionTierId } from "../../types";
import { useAuth } from "./AuthProvider";

const providers: Array<{ id: SocialProvider; label: string; className: string; productionReady: boolean }> = [
  { id: "google", label: "Continue with Google", className: "google-button", productionReady: true },
  { id: "facebook", label: "Continue with Facebook", className: "facebook-button", productionReady: true }
];

function providerLabel(provider: SocialProvider) {
  return provider === "facebook" ? "Facebook" : "Google";
}

type SignInPanelProps = {
  preferredSignupPath?: SignupPath | null;
  redirectView?: AppView | null;
  subscriptionIntent?: SubscriptionTierId | null;
};

export function SignInPanel({ preferredSignupPath = null, redirectView = null, subscriptionIntent = null }: SignInPanelProps) {
  const { isAuthenticated, isLoading, mode, signIn, signInWithEmail, signOut, user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<SignupPath>(preferredSignupPath ?? "parentChild");
  const [emailMode, setEmailMode] = useState<"signUp" | "signIn">("signUp");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const intendedTier = useMemo(
    () => subscriptionTiers.find((tier) => tier.id === subscriptionIntent),
    [subscriptionIntent]
  );

  useEffect(() => {
    if (preferredSignupPath) {
      setSelectedPath(preferredSignupPath);
    }
  }, [preferredSignupPath]);

  useEffect(() => {
    // Only emit for unauthenticated visitors; a signed-in user landing on the
    // Account page for billing is not starting signup.
    if (!isAuthenticated) {
      void trackProductEvent(null, "signup_started", {
        signupPath: preferredSignupPath ?? null,
        redirectView: redirectView ?? null,
        subscriptionIntent: subscriptionIntent ?? null
      });
    }
    // Fire once per Sign-in panel render (mount only).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInForPath(provider: SocialProvider) {
    setAuthError("");
    saveSignupIntent(selectedPath);
    try {
      await signIn(provider);
    } catch (caughtError) {
      setAuthError(caughtError instanceof Error ? caughtError.message : `${providerLabel(provider)} sign-in failed.`);
    }
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
        <h2>Choose the right learning workspace</h2>
        <p className="helper-text">
          Parents set up a personalized reading path for a child. Teachers create an insight workspace
          for assigned students, progress signals, and next-step planning.
        </p>

        {redirectView ? (
          <div className="redirect-notice" role="status">
            <strong>Sign in to continue to the page from your link.</strong>
            <span>ReadNest saved that link and will open it after your account is ready.</span>
          </div>
        ) : null}

        {intendedTier ? (
          <div className="redirect-notice" role="status">
            <strong>{intendedTier.name} selected</strong>
            <span>
              Create or sign in to the matching account type first. Then ReadNest will reopen this plan so Stripe can
              connect paid access to the correct account.
            </span>
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
                <strong>Build a child reading path</strong>
                <small>Save goals, personalize practice, and connect with a teacher when ready.</small>
              </button>
              <button
                className={`signup-choice teacher-choice${selectedPath === "teacher" ? " is-selected" : ""}`}
                type="button"
                aria-label="Choose Teacher signup"
                aria-pressed={selectedPath === "teacher"}
                onClick={() => setSelectedPath("teacher")}
              >
                <span>Teacher</span>
                <strong>Set up student insights</strong>
                <small>Review assigned learners, growth patterns, and support plans.</small>
              </button>
            </div>

            <div className="selected-signup-path" aria-live="polite">
              <strong>{labelFromSignupPath(selectedPath)} signup selected</strong>
              <span>
                {selectedPath === "teacher"
                  ? "This creates a teacher role after sign-in."
                  : "This creates a student role for the child personalized learning space after sign-in."}
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
                  <span>Parent, teacher, or learner display name</span>
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
              <button className="primary-button" disabled={isLoading} type="submit">
                {emailMode === "signUp" ? `Create ${labelFromSignupPath(selectedPath)} account` : "Sign in with email"}
              </button>
            </form>
            {authError ? <p className="form-error auth-panel-error">{authError}</p> : null}

            <div className="auth-divider">
              <span>or use a connected provider</span>
            </div>

            <div className="social-buttons">
              {providers.map((provider) => (
                <button
                  className={`social-button ${provider.className}`}
                  disabled={isLoading || (mode === "firebase" && !provider.productionReady)}
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
