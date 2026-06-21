# Deployment

## Current Hosting

ReadNest deploys to GitHub Pages from `main`:

```text
https://wayne9999.github.io/early_Reader/
```

Workflow:

```text
.github/workflows/deploy-pages.yml
```

The workflow runs:

- `npm ci`
- `npm run check`
- `npm run test`
- `npm audit --audit-level=moderate`
- `npm run test:coverage`
- Playwright browser install
- `npm run test:e2e`
- `npm run build`
- GitHub Pages deploy

## Release Checklist

1. Confirm `.env.example` includes all public and backend values without secrets.
2. Run the full local quality suite.
3. Push to `main`.
4. Confirm GitHub Actions succeeds.
5. Smoke test:
   - Home/Reading
   - Memory
   - Account signup
   - Protected route redirect
   - Student dashboard
   - Teacher dashboard paywall/active state
   - Support and legal pages
6. Confirm Stripe Checkout and Customer Portal links.
7. Confirm Firestore rules are deployed.

## Rollback

1. Identify last known good commit.
2. Revert the bad commit or push a hotfix.
3. Confirm GitHub Pages workflow succeeds.
4. Smoke test the live app.
5. If billing or rules are affected, also roll back Firebase Functions/rules from the Firebase console or CLI.

## Custom Domain And CSP

GitHub Pages is fine for beta, but a production custom domain should sit behind hosting that supports response headers.

Recommended Content Security Policy starting point:

```text
default-src 'self';
script-src 'self' https://www.gstatic.com https://apis.google.com https://js.stripe.com;
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.stripe.com;
img-src 'self' data: https:;
style-src 'self' 'unsafe-inline';
frame-src https://js.stripe.com https://hooks.stripe.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

Review this after adding Firebase Functions, analytics, or a custom CDN.

## Future Hosting

Consider Firebase Hosting or a SSR/prerender host when:

- SEO needs unique rendered pages per route.
- CSP/security headers become required.
- Backend redirects or authenticated billing endpoints need same-origin routing.
- PWA caching and offline sync are added.
