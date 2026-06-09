export const authConfig = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
  connections: {
    google: import.meta.env.VITE_AUTH0_GOOGLE_CONNECTION || "google-oauth2",
    facebook: import.meta.env.VITE_AUTH0_FACEBOOK_CONNECTION || "facebook",
    instagram: import.meta.env.VITE_AUTH0_INSTAGRAM_CONNECTION || "instagram"
  }
};

export function isAuth0Configured() {
  return Boolean(authConfig.domain && authConfig.clientId);
}
