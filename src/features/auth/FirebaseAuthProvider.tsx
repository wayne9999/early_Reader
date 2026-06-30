import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type AuthProvider,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { getFirebaseRuntime } from "../../services/firebase";
import type { AppUser, EmailAuthInput, SocialProvider } from "../../types";

type FirebaseAuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: SocialProvider) => Promise<void>;
  signInWithEmail: (input: EmailAuthInput) => Promise<void>;
  signOut: () => Promise<void>;
  mode: "firebase";
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

function providerLabel(provider: SocialProvider) {
  return provider === "facebook" ? "Facebook" : "Google";
}

function createSocialAuthProvider(provider: SocialProvider): AuthProvider {
  if (provider === "google") {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope("email");
    googleProvider.addScope("profile");
    return googleProvider;
  }

  const facebookProvider = new FacebookAuthProvider();
  facebookProvider.addScope("email");
  facebookProvider.addScope("public_profile");
  facebookProvider.setCustomParameters({ display: "popup" });
  return facebookProvider;
}

function shouldUseRedirectFallback(error: unknown) {
  return (
    error instanceof FirebaseError &&
    ["auth/popup-blocked", "auth/cancelled-popup-request", "auth/web-storage-unsupported"].includes(error.code)
  );
}

function friendlyFirebaseAuthError(error: unknown, provider: SocialProvider) {
  const label = providerLabel(provider);

  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : `${label} sign-in failed.`;
  }

  switch (error.code) {
    case "auth/operation-not-allowed":
      return `${label} sign-in is not enabled in Firebase Auth yet. Enable ${label} under Firebase Authentication > Sign-in method.`;
    case "auth/unauthorized-domain":
      return `This domain is not authorized for Firebase Auth. Add ${window.location.hostname} under Firebase Authentication > Settings > Authorized domains.`;
    case "auth/account-exists-with-different-credential":
      return `An account already exists with this email using another sign-in method. Sign in with that method first, then link ${label} later.`;
    case "auth/invalid-credential":
    case "auth/invalid-oauth-client-id":
      return `${label} sign-in is missing or has incorrect app credentials in Firebase Auth. Check the provider App ID and App secret.`;
    case "auth/popup-closed-by-user":
      return `${label} sign-in was closed before it finished. Try again when you are ready.`;
    case "auth/network-request-failed":
      return `${label} sign-in could not reach Firebase. Check your connection and try again.`;
    default:
      return `${label} sign-in failed (${error.code}). Check Firebase and provider settings, then try again.`;
  }
}

function toAppUser(user: User): AppUser {
  return {
    id: user.uid,
    name: user.displayName ?? user.email ?? "Reader",
    email: user.email ?? undefined,
    picture: user.photoURL ?? undefined,
    provider: user.providerData[0]?.providerId ?? "firebase"
  };
}

export function FirebaseReadNestAuthProvider({ children }: PropsWithChildren) {
  const runtime = getFirebaseRuntime();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(runtime));

  useEffect(() => {
    if (!runtime) {
      setIsLoading(false);
      return undefined;
    }

    return onAuthStateChanged(runtime.auth, (firebaseUser) => {
      setUser(firebaseUser ? toAppUser(firebaseUser) : null);
      setIsLoading(false);
    });
  }, [runtime]);

  const value = useMemo<FirebaseAuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      mode: "firebase",
      async signIn(provider) {
        if (!runtime) {
          return;
        }

        const authProvider = createSocialAuthProvider(provider);

        try {
          await signInWithPopup(runtime.auth, authProvider);
        } catch (error) {
          if (shouldUseRedirectFallback(error)) {
            await signInWithRedirect(runtime.auth, createSocialAuthProvider(provider));
            return;
          }

          throw new Error(friendlyFirebaseAuthError(error, provider));
        }
      },
      async signInWithEmail(input) {
        if (!runtime) {
          return;
        }

        if (input.mode === "signUp") {
          const credential = await createUserWithEmailAndPassword(runtime.auth, input.email, input.password);

          if (input.displayName?.trim()) {
            await updateProfile(credential.user, {
              displayName: input.displayName.trim()
            });
            setUser(toAppUser(credential.user));
          }
          return;
        }

        await signInWithEmailAndPassword(runtime.auth, input.email, input.password);
      },
      async signOut() {
        if (runtime) {
          await firebaseSignOut(runtime.auth);
        }
      }
    }),
    [isLoading, runtime, user]
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);

  if (!context) {
    throw new Error("useFirebaseAuth must be used inside FirebaseReadNestAuthProvider");
  }

  return context;
}
