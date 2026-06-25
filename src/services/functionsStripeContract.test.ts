import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const functionsSource = readFileSync("functions/src/index.ts", "utf8");

describe("Firebase Stripe subscription contract", () => {
  it("reads the billing period end from the Stripe subscription item", () => {
    expect(functionsSource).toContain("firstItem?.current_period_end");
    expect(functionsSource).toContain("firstItem.current_period_end * 1000");
  });
});
