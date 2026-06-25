# ReadNest Custom Domain

## Target

- App: `https://myreadnest.org/`
- Optional redirect: `https://www.myreadnest.org/` to the apex domain
- Transactional email domain: `mail.myreadnest.org`
- Production sender: `ReadNest Support <support@mail.myreadnest.org>`

The domain currently uses Cloudflare nameservers. Keep the web-hosting records DNS-only while Firebase provisions its certificate.

## Firebase Hosting

1. Deploy the app with the GitHub workflow `Deploy Firebase Backend`, using `target=hosting`.
2. Open the [Firebase Hosting console](https://console.firebase.google.com/project/readnest-f9c67/hosting/sites).
3. Select the ReadNest site and choose **Add custom domain**.
4. Enter `myreadnest.org`.
5. Choose the option to redirect `www.myreadnest.org` to `myreadnest.org`.
6. Copy the exact TXT and A records Firebase provides. Do not guess the verification token.

Firebase requires its ownership TXT record to remain in DNS so it can renew the TLS certificate.

## Cloudflare DNS

Open [Cloudflare DNS](https://dash.cloudflare.com/) and select `myreadnest.org`.

1. Add the Firebase ownership TXT record at `@`.
2. Add the Firebase-provided A records at `@`.
3. Remove conflicting apex A, AAAA, or CNAME records.
4. Set Firebase web records to **DNS only** until Firebase shows **Connected**.
5. Add the Firebase-provided `www` record or redirect configuration.
6. Do not create a wildcard DNS record.

Verify from Windows:

```powershell
Resolve-DnsName myreadnest.org -Type TXT
Resolve-DnsName myreadnest.org -Type A
Resolve-DnsName www.myreadnest.org -Type CNAME
```

## Firebase Authentication

Add both domains under [Firebase Authentication authorized domains](https://console.firebase.google.com/project/readnest-f9c67/authentication/settings):

- `myreadnest.org`
- `www.myreadnest.org`

Keep `wayne9999.github.io` during the migration and while the fallback site remains available.

## Stripe

The backend reads `READNEST_APP_BASE_URL` for Checkout and Customer Portal return URLs. Set the GitHub Actions variable to:

```text
https://myreadnest.org/
```

The Stripe webhook URL remains the Firebase Function URL and does not change with the web domain.

## Resend

1. Add `mail.myreadnest.org` in the [Resend Domains dashboard](https://resend.com/domains).
2. Copy Resend's SPF, DKIM, and verification records into Cloudflare exactly.
3. Keep email records DNS-only.
4. Wait for Resend to show the domain as verified.
5. Set `SUPPORT_FROM_EMAIL` to:

```text
ReadNest Support <support@mail.myreadnest.org>
```

`SUPPORT_NOTIFICATION_EMAIL` can remain a private operations inbox; it does not need to match the public sender.

## Cutover Verification

- `https://myreadnest.org/` returns the ReadNest app over HTTPS.
- `www` redirects to the apex domain.
- signup and Google/Facebook auth return to the production domain.
- Stripe Checkout and Customer Portal return to the production account page.
- support submissions send from the verified Resend domain.
- `robots.txt`, `sitemap.xml`, canonical tags, Open Graph URLs, and the PWA manifest use `myreadnest.org`.
- security headers are present.
- the GitHub Pages fallback still opens during the transition.
