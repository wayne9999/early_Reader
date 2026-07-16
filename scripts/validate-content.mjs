import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/data/content.ts", import.meta.url), "utf8");
const errors = [];
const wordMatches = [...source.matchAll(/text:\s*"([^"]+)"/g)].map((match) => match[1].trim().toLowerCase());
const duplicateWords = wordMatches.filter((word, index) => wordMatches.indexOf(word) !== index);
const emptyFields = [...source.matchAll(/(prompt|target|correctChoice|successMessage|coachMessage|sentence|hint):\s*""/g)];
const roundsWithoutChoices = [...source.matchAll(/choices:\s*\[\s*\]/g)];
const registeredContentCount = [...source.matchAll(/accessTier:\s*"registered"/g)].length;
const paidContentCount = [...source.matchAll(/accessTier:\s*"paid"/g)].length;

if (duplicateWords.length) {
  errors.push(`Duplicate reading words: ${[...new Set(duplicateWords)].join(", ")}`);
}

if (emptyFields.length) {
  errors.push(`Empty content fields found: ${emptyFields.map((match) => match[1]).join(", ")}`);
}

if (roundsWithoutChoices.length) {
  errors.push("One or more activity rounds has no choices.");
}

if (registeredContentCount < 8) {
  errors.push("Registered content tier needs at least 8 tagged items across word, memory, and activity packs.");
}

if (paidContentCount < 12) {
  errors.push("Paid content tier needs at least 12 tagged items across word, memory, and activity packs.");
}

if (!source.includes("grade") && !source.includes("Kindergarten")) {
  console.warn("Warning: content does not yet expose explicit grade tags; add tags before scaling paid content packs.");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `Content validation passed for ${wordMatches.length} reading word entries, ${registeredContentCount} registered-tier items, and ${paidContentCount} paid-tier items.`
);
