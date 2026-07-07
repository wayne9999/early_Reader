// Submits every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver share
// the endpoint), replacing the deprecated anonymous sitemap-ping endpoints.
// The key file public/<key>.txt must be deployed and reachable on the site
// before submission counts; run this after a production deploy.
// Run: node scripts/submit-indexnow.mjs

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");
const host = "myreadnest.org";

const keyFile = (await readdir(publicDir)).find((name) => /^[0-9a-f]{32}\.txt$/.test(name));

if (!keyFile) {
  console.error("No IndexNow key file (public/<32-hex>.txt) found.");
  process.exit(1);
}

const key = keyFile.replace(".txt", "");
const sitemap = await readFile(join(publicDir, "sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (urlList.length === 0) {
  console.error("sitemap.xml contains no URLs.");
  process.exit(1);
}

const keyLocation = `https://${host}/${keyFile}`;
const keyCheck = await fetch(keyLocation).catch(() => null);

if (!keyCheck?.ok) {
  console.error(
    `IndexNow key file is not live at ${keyLocation} (status ${keyCheck?.status ?? "unreachable"}). ` +
      "Deploy to production first, then re-run."
  );
  process.exit(1);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList })
});

// IndexNow returns 200 (ok) or 202 (accepted, key validation pending).
if (response.status === 200 || response.status === 202) {
  console.log(`IndexNow accepted ${urlList.length} URLs with status ${response.status}.`);
} else {
  console.error(`IndexNow submission failed with status ${response.status}: ${await response.text()}`);
  process.exit(1);
}
