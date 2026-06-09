import { isFirebaseConfigured } from "../../services/firebase";
import type { SocialProvider } from "../../types";
import { useAuth } from "./AuthProvider";

const providers: Array<{ id: SocialProvider; label: string; className: string }> = [
  { id: "google", label: "Continue with Google", className: "google-button" },
  { id: "facebook", label: "Continue with Facebook", className: "facebook-button" },
  { id: "instagram", label: "Continue with Instagram", className: "instagram-button" }
];

export function SignInPanel() {
  const { isAuthenticated, isLoading, mode, signIn, signOut, user } = useAuth();

  return (
    <div className="auth-grid">
      <article className="practice-panel auth-panel">
        <p className="eyebrow">Family account</p>
        <h2>Save progress across devices</h2>
        <p className="helper-text">
          Sign in lets caregivers keep reading progress, memory board history, and child practice data
          connected to the same account.
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
          <div className="social-buttons">
            {providers.map((provider) => (
              <button
                className={`social-button ${provider.className}`}
                disabled={isLoading}
                key={provider.id}
                type="button"
                onClick={() => void signIn(provider.id)}
              >
                {provider.label}
              </button>
            ))}
          </div>
        )}
      </article>

      <article className="practice-panel setup-panel">
        <p className="eyebrow">Configuration status</p>
        <h3>Auth and database readiness</h3>
        <ul className="next-steps">
          <li>Auth mode: {mode === "auth0" ? "Auth0 configured" : "Demo sign-in until Auth0 env values are set"}</li>
          <li>
            Database:{" "}
            {isFirebaseConfigured()
              ? "Firestore config present; writes require a Firebase-authenticated session"
              : "Local storage fallback until Firebase env values are set"}
          </li>
          <li>Production storage path: users/{`{userId}`}/learning/progress</li>
          <li>Social login connections: Google, Facebook, Instagram through Auth0 connection names.</li>
        </ul>
      </article>
    </div>
  );
}
