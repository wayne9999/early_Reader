const appEnvironment = process.env.VITE_APP_ENVIRONMENT;
const stripeMode = process.env.VITE_STRIPE_MODE;
const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
const expectedFirebaseProjectId = process.env.VITE_EXPECTED_FIREBASE_PROJECT_ID;
const forbiddenFirebaseProjectId = process.env.VITE_FORBIDDEN_FIREBASE_PROJECT_ID;
const donationLink = process.env.VITE_STRIPE_DONATION_LINK ?? "";
const familyPlusLink = process.env.VITE_STRIPE_FAMILY_PLUS_LINK ?? "";
const teacherProLink = process.env.VITE_STRIPE_TEACHER_PRO_LINK ?? "";
const customerPortalLink = process.env.VITE_STRIPE_CUSTOMER_PORTAL_LINK ?? "";

const errors = [];

if (!["development", "production"].includes(appEnvironment)) {
  errors.push("VITE_APP_ENVIRONMENT must be development or production.");
}

if (!["test", "live"].includes(stripeMode)) {
  errors.push("VITE_STRIPE_MODE must be test or live.");
}

if (!firebaseProjectId) {
  errors.push("VITE_FIREBASE_PROJECT_ID is required.");
}

if (expectedFirebaseProjectId && firebaseProjectId !== expectedFirebaseProjectId) {
  errors.push(
    `Firebase project mismatch: expected ${expectedFirebaseProjectId}, received ${firebaseProjectId || "empty"}.`
  );
}

if (forbiddenFirebaseProjectId && firebaseProjectId === forbiddenFirebaseProjectId) {
  errors.push(
    `Firebase project ${firebaseProjectId} belongs to the opposite environment.`
  );
}

if (
  expectedFirebaseProjectId &&
  forbiddenFirebaseProjectId &&
  expectedFirebaseProjectId === forbiddenFirebaseProjectId
) {
  errors.push("Expected and forbidden Firebase project IDs must be different.");
}

if (appEnvironment === "production" && stripeMode !== "live") {
  errors.push("Production builds must use VITE_STRIPE_MODE=live.");
}

if (appEnvironment === "development" && stripeMode !== "test") {
  errors.push("Development builds must use VITE_STRIPE_MODE=test.");
}

const stripeLinks = [
  ["donation", donationLink],
  ["Family Plus", familyPlusLink],
  ["Teacher Pro", teacherProLink],
  ["customer portal", customerPortalLink]
].filter(([, link]) => Boolean(link));

for (const [name, link] of stripeLinks) {
  if (stripeMode === "live" && link.includes("/test_")) {
    errors.push(`Production ${name} link points to a Stripe test URL.`);
  }

  if (stripeMode === "test" && !link.includes("/test_")) {
    errors.push(`Development ${name} link must point to a Stripe test URL.`);
  }
}

if (errors.length) {
  console.error(`Deployment environment validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Validated ${appEnvironment} build with Stripe ${stripeMode} mode and Firebase project ${firebaseProjectId}.`
);
