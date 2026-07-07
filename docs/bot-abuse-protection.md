# Bot and Abuse Protection

## Implemented

- Firebase Authentication remains the identity authority and applies its own account-creation quotas.
- Firebase App Check client support uses an invisible reCAPTCHA v3 provider when the frontend site key is configured.
- Costly callable functions support App Check enforcement through `READNEST_ENFORCE_APP_CHECK`.
- Support requests are submitted through a backend callable instead of direct Firestore writes.
- Support requests use a hidden honeypot plus a limit of 3 submissions per signed-in user per hour.
- AI requests, checkout creation, billing portal creation, and student claiming have server-side per-user limits.
- Firestore denies client access to `abuseRateLimits/**`.
- Learning and analytics event writes have allowlisted event types, fixed document shapes, and bounded metadata.
- Stripe webhooks require Stripe signatures and do not use browser-controlled entitlement state.

## Recommended Free-First Service

Use Firebase App Check with standard reCAPTCHA v3. It runs invisibly, so children do not have to solve image puzzles during activities. The app also keeps server-side rate limiting and strict Firestore rules in place instead of depending on reCAPTCHA alone.

Do not add a visible CAPTCHA to every activity. It creates accessibility and usability problems while protecting the least expensive part of the application. Add an interactive challenge only if monitoring later shows concentrated signup abuse that Firebase Auth and App Check do not stop.

## Activate App Check

1. Open [Firebase App Check](https://console.firebase.google.com/project/readnest-f9c67/appcheck).
2. Select the ReadNest web app and register the **reCAPTCHA v3** provider.
3. Add these allowed web domains:
   - `wayne9999.github.io`
   - `myreadnest.org`
   - `readnest-f9c67.web.app`
   - `localhost` only for development
4. Copy the public site key.
5. Set the GitHub Actions variable:

   ```text
   VITE_FIREBASE_APP_CHECK_SITE_KEY=<public site key>
   ```

6. Deploy GitHub Pages and use the app normally.
7. In App Check metrics, confirm ReadNest requests are reported as valid.
8. Enable Firestore enforcement from the App Check console.
9. Set this GitHub Actions variable and redeploy Functions:

   ```text
   READNEST_ENFORCE_APP_CHECK=true
   ```

Roll out enforcement only after valid traffic appears. Enabling it before the site key reaches the deployed frontend will block legitimate users.

## App Check 403 Verification

If automated QA or live browsers show `AppCheck: 403` in the console, verify configuration before changing application code:

1. Firebase Console > App Check > Apps > ReadNest web app.
2. Confirm the provider is reCAPTCHA v3 and the site key matches `PROD_VITE_FIREBASE_APP_CHECK_SITE_KEY`.
3. Google reCAPTCHA Admin Console > the same v3 key > Domains.
4. Confirm `myreadnest.org`, `readnest-f9c67.web.app`, and `wayne9999.github.io` are allowed where needed.
5. If enforcement is enabled for Firestore or Functions, test a signed-in learning event and support case after any key/domain change.

Do not disable App Check as the first response. A 403 in headless browser QA can also appear when reCAPTCHA refuses automated clients, while real browsers may still work.

## Authentication Console Hardening

In [Firebase Authentication settings](https://console.firebase.google.com/project/readnest-f9c67/authentication/settings):

- Keep only the required authorized domains.
- Enable a strong password policy.
- Enable email enumeration protection.
- Require email verification before sensitive account changes when the product flow is ready.
- Review sign-in and account-creation spikes. Firebase documents a default limit of 100 new accounts per hour per IP address.

## Monitoring

Review:

- [App Check metrics](https://console.firebase.google.com/project/readnest-f9c67/appcheck)
- [Firebase Authentication usage](https://console.firebase.google.com/project/readnest-f9c67/authentication/usage)
- [Firestore usage](https://console.firebase.google.com/project/readnest-f9c67/firestore/usage)
- [Cloud Logging](https://console.cloud.google.com/logs/query?project=readnest-f9c67)

Useful Cloud Logging filters:

```text
resource.type="cloud_run_revision"
jsonPayload.eventName="support_case_processing_failed"
```

```text
resource.type="cloud_run_revision"
severity>=WARNING
```

Create budget alerts in Google Cloud. Rate limiting reduces abuse but does not replace billing alerts and usage monitoring.

## Remaining Infrastructure Upgrade

When ReadNest moves to a custom domain, put the site behind Cloudflare's free proxy for CDN caching, basic DDoS absorption, managed bot signals, and rate-limiting options. GitHub Pages cannot expose the same origin controls, so App Check and Firebase backend controls are the immediate protection layer.
