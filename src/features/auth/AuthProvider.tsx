import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { AppUser, SocialProvider } from "../../types";
import { authConfig, isAuth0Configured } from "./authConfig";

type AuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: SocialProvider) => Promise<void>;
  signOut: () => Promise<void>;
  mode: "auth0" | "demo";
};

const AuthContext = createContext<AuthContextValue | null>(null);

function DemoAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      mode: "demo",
      async signIn(provider) {
        setUser({
          id: `demo-${provider}`,
          name: `Demo ${provider[0].toUpperCase()}${provider.slice(1)} User`,
          provider
        });
      },
      async signOut() {
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function Auth0ContextBridge({ children }: PropsWithChildren) {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  const value = useMemo<AuthContextValue>(
    () => ({
      user:
        user && isAuthenticated
          ? {
              id: user.sub ?? user.email ?? "unknown-user",
              name: user.name ?? user.nickname ?? user.email ?? "Reader",
              email: user.email,
              picture: user.picture,
              provider: user.sub?.split("|")[0]
            }
          : null,
      isAuthenticated,
      isLoading,
      mode: "auth0",
      async signIn(provider) {
        await loginWithRedirect({
          authorizationParams: {
            connection: authConfig.connections[provider],
            redirect_uri: authConfig.redirectUri,
            audience: authConfig.audience || undefined
          }
        });
      },
      async signOut() {
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      }
    }),
    [isAuthenticated, isLoading, loginWithRedirect, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function ReadNestAuthProvider({ children }: PropsWithChildren) {
  if (!isAuth0Configured()) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

  return (
    <Auth0Provider
      domain={authConfig.domain}
      clientId={authConfig.clientId}
      authorizationParams={{
        redirect_uri: authConfig.redirectUri,
        audience: authConfig.audience || undefined
      }}
    >
      <Auth0ContextBridge>{children}</Auth0ContextBridge>
    </Auth0Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside ReadNestAuthProvider");
  }

  return context;
}
