// Google Search Console automation: sitemap submission and URL inspection
// through the Search Console API, so neither needs Dashboard clicks once a
// service account is authorized.
//
// One-time setup (repo owner):
//   1. Create a Google Cloud service account (any project) and a JSON key.
//   2. In Search Console, add the service account email as a full user (or
//      owner) of the myreadnest.org property.
//   3. Store the JSON key as the GSC_SERVICE_ACCOUNT_JSON secret / env value.
//
// Usage:
//   node scripts/google-search-console.mjs submit-sitemap
//   node scripts/google-search-console.mjs inspect / /reading-practice/ ...
//
// Optional env: GSC_SITE_URL (default sc-domain:myreadnest.org; use
// https://myreadnest.org/ for a URL-prefix property).

import { createSign } from "node:crypto";

const siteBase = "https://myreadnest.org";
const property = process.env.GSC_SITE_URL || "sc-domain:myreadnest.org";
const command = process.argv[2];

if (!process.env.GSC_SERVICE_ACCOUNT_JSON) {
  console.error("GSC_SERVICE_ACCOUNT_JSON is not set. Add the Search Console service-account key first.");
  process.exit(1);
}

if (command !== "submit-sitemap" && command !== "inspect") {
  console.error("Usage: google-search-console.mjs <submit-sitemap|inspect> [paths...]");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");
  const assertion = `${header}.${claims}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${payload.error_description ?? response.status}`);
  }

  return payload.access_token;
}

if (command === "submit-sitemap") {
  const token = await getAccessToken("https://www.googleapis.com/auth/webmasters");
  const sitemapUrl = `${siteBase}/sitemap.xml`;
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    console.error(`Sitemap submission failed (${response.status}): ${await response.text()}`);
    process.exit(1);
  }

  console.log(`Submitted ${sitemapUrl} to Search Console property ${property}.`);
} else {
  const paths = process.argv.slice(3);

  if (paths.length === 0) {
    console.error("Pass at least one path to inspect, e.g. / /reading-practice/");
    process.exit(1);
  }

  const token = await getAccessToken("https://www.googleapis.com/auth/webmasters");
  let hasFailure = false;

  for (const path of paths) {
    const inspectionUrl = new URL(path, `${siteBase}/`).toString();
    const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inspectionUrl, siteUrl: property })
    });
    const payload = await response.json();

    if (!response.ok) {
      console.error(`${inspectionUrl}: inspection failed (${response.status}): ${payload.error?.message ?? ""}`);
      hasFailure = true;
      continue;
    }

    const result = payload.inspectionResult?.indexStatusResult ?? {};
    console.log(
      `${inspectionUrl}\n  verdict: ${result.verdict ?? "UNKNOWN"}\n  coverage: ${result.coverageState ?? "unknown"}\n` +
        `  canonical (Google): ${result.googleCanonical ?? "n/a"}\n  last crawl: ${result.lastCrawlTime ?? "never"}`
    );
  }

  process.exit(hasFailure ? 1 : 0);
}
