import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const firebaseToolsRoot = process.argv[2];

if (!firebaseToolsRoot) {
  throw new Error("Pass the installed firebase-tools directory.");
}

const apiClientPath = resolve(firebaseToolsRoot, "lib", "apiv2.js");
const original = await readFile(apiClientPath, "utf8");
const patched = original
  .replace('Connection: "keep-alive"', 'Connection: "close"')
  .replace("compress: options.compress,", "compress: false,");

if (patched === original) {
  throw new Error(
    "Firebase CLI transport patch did not match the installed version. Review before deploying."
  );
}

if (
  !patched.includes('Connection: "close"') ||
  !patched.includes("compress: false,")
) {
  throw new Error("Firebase CLI transport patch was only partially applied.");
}

await writeFile(apiClientPath, patched, "utf8");
console.log("Patched Firebase CLI transport for reliable Google API responses.");
