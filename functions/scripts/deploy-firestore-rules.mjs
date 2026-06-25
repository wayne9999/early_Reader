import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { GoogleAuth } from "google-auth-library";

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required.");
}

const rulesPath = resolve(process.cwd(), "firestore.rules");
const content = await readFile(rulesPath, "utf8");
const auth = new GoogleAuth({
  scopes: [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/firebase"
  ]
});
const client = await auth.getClient();
const apiRoot = "https://firebaserules.googleapis.com/v1";

const rulesetResponse = await client.request({
  method: "POST",
  url: `${apiRoot}/projects/${projectId}/rulesets`,
  data: {
    source: {
      files: [
        {
          name: "firestore.rules",
          content
        }
      ]
    }
  }
});
const rulesetName = rulesetResponse.data?.name;

if (typeof rulesetName !== "string" || !rulesetName) {
  throw new Error("Firebase Rules API did not return a ruleset name.");
}

const releaseName = `projects/${projectId}/releases/cloud.firestore`;
await client.request({
  method: "PATCH",
  url: `${apiRoot}/${releaseName}`,
  data: {
    release: {
      name: releaseName,
      rulesetName
    },
    updateMask: "rulesetName"
  }
});

console.log(`Deployed ${rulesetName} to ${releaseName}.`);
