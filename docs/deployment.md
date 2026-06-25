# Deployment

## Production Hosting

The production target is Firebase Hosting:

```text
https://myreadnest.org/
```

The Firebase workflow supports `target=hosting` and builds with `VITE_BASE_PATH=/` before deploying `dist`.

GitHub Pages remains available as a temporary fallback:

```text
https://wayne9999.github.io/early_Reader/
```

Workflows:

```text
.github/workflows/deploy-firebase.yml
.github/workflows/deploy-pages.yml
```

The branch promotion and approval process is documented in `docs/release-process.md`.

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

## Firebase Backend Deploy

The Firebase backend deploy workflow is:

```text
.github/workflows/deploy-firebase.yml
```

Use `target=rules` for Firestore rules, `target=functions` for callable/webhook workers, `target=hosting` for the production web application, and `target=all` for all three. The `include_scheduler` option is off by default so routine deploys do not fail if the deploy service account is missing Cloud Scheduler permissions.

Enable `include_scheduler=true` only after the deploy service account has permission to update scheduled jobs.

## Cloud Scheduler Permission

The scheduled AI function `enqueueDailyInsightJobs` needs Cloud Scheduler update permission during deployment. If GitHub Actions fails with `cloudscheduler.jobs.update`, grant the deploy service account Cloud Scheduler Admin:

```bash
gcloud projects add-iam-policy-binding readnest-f9c67 \
  --member=serviceAccount:YOUR_DEPLOY_SERVICE_ACCOUNT_EMAIL \
  --role=roles/cloudscheduler.admin
```

To identify the service account used by GitHub Actions, open the failed Firebase deploy run and check the `Authenticate to Google Cloud` credentials, or list service accounts in Cloud Shell:

```bash
gcloud iam service-accounts list \
  --project=readnest-f9c67 \
  --format="table(email,displayName)"
```

After granting the role, rerun the Firebase backend workflow with `target=functions` and `include_scheduler=true`. Confirm the job exists:

```bash
gcloud scheduler jobs describe firebase-schedule-enqueueDailyInsightJobs-us-central1 \
  --location=us-central1 \
  --project=readnest-f9c67
```

## Rollback

1. Identify last known good commit.
2. Revert the bad commit or push a hotfix.
3. Confirm the Firebase Hosting workflow succeeds.
4. Smoke test the live app.
5. If billing or rules are affected, also roll back Firebase Functions/rules from the Firebase console or CLI.

## Custom Domain And Security Headers

Firebase Hosting serves `myreadnest.org`, provisions TLS, applies SPA rewrites, and sends the headers defined in `firebase.json`.

The configured baseline includes:

- Content Security Policy
- HSTS
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- restricted browser permissions
- immutable caching for fingerprinted assets

Review the CSP whenever a new analytics, authentication, media, or payment provider is added.

## Future Rendering

Consider SSR or prerendered application routes when:

- SEO needs unique rendered pages per route.
- marketing pages outgrow the current static SEO pages.
- route-level social previews are required.
