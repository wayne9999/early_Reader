// Registers (or rotates) the Stripe webhook endpoint for a ReadNest
// environment through the Stripe API, so webhook setup never depends on
// manual Stripe Dashboard clicks.
//
// Required environment values:
//   STRIPE_API_KEY      sk_test_... for mode=test, sk_live_... for mode=live
//   STRIPE_WEBHOOK_MODE test | live
// Optional:
//   ROTATE_WEBHOOK      "true" recreates the endpoint to mint a new signing
//                       secret even when the endpoint already exists.
//
// Output (also written to GITHUB_OUTPUT when available):
//   endpoint_id, endpoint_created (true/false), webhook_secret (only when a
//   new endpoint was created; Stripe never re-reveals existing secrets).

import { appendFileSync } from "node:fs";

const REQUIRED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created"
];

const WEBHOOK_URLS = {
  test: "https://us-central1-readnest-dev-f9c67.cloudfunctions.net/stripeWebhookTest",
  live: "https://us-central1-readnest-f9c67.cloudfunctions.net/stripeWebhook"
};

const mode = process.env.STRIPE_WEBHOOK_MODE;
const apiKey = process.env.STRIPE_API_KEY;
const rotate = process.env.ROTATE_WEBHOOK === "true";

if (mode !== "test" && mode !== "live") {
  fail("Set STRIPE_WEBHOOK_MODE to test or live.");
}

const expectedKeyPrefix = mode === "live" ? "sk_live_" : "sk_test_";

if (!apiKey || !apiKey.startsWith(expectedKeyPrefix)) {
  fail(`STRIPE_API_KEY must start with ${expectedKeyPrefix} for ${mode} mode.`);
}

const webhookUrl = WEBHOOK_URLS[mode];

function fail(message) {
  console.error(`register-stripe-webhook: ${message}`);
  process.exit(1);
}

function writeOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

async function stripeRequest(method, path, params) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params ? new URLSearchParams(params).toString() : undefined
  });
  const payload = await response.json();

  if (!response.ok) {
    fail(`Stripe ${method} ${path} failed: ${payload.error?.message ?? response.status}`);
  }

  return payload;
}

function enabledEventParams() {
  return Object.fromEntries(REQUIRED_EVENTS.map((eventName, index) => [`enabled_events[${index}]`, eventName]));
}

async function listEndpointsForUrl() {
  const matches = [];
  let startingAfter = null;

  for (let page = 0; page < 10; page += 1) {
    const query = new URLSearchParams({ limit: "100" });

    if (startingAfter) {
      query.set("starting_after", startingAfter);
    }

    const payload = await stripeRequest("GET", `/v1/webhook_endpoints?${query.toString()}`);
    matches.push(...payload.data.filter((endpoint) => endpoint.url === webhookUrl));

    if (!payload.has_more || payload.data.length === 0) {
      break;
    }

    startingAfter = payload.data[payload.data.length - 1].id;
  }

  return matches;
}

async function createEndpoint() {
  const endpoint = await stripeRequest("POST", "/v1/webhook_endpoints", {
    url: webhookUrl,
    description: `ReadNest ${mode} subscription webhook (registered by scripts/register-stripe-webhook.mjs)`,
    "metadata[managedBy]": "readnest-register-stripe-webhook",
    ...enabledEventParams()
  });

  if (endpoint.secret) {
    // Keep the signing secret out of workflow logs.
    console.log(`::add-mask::${endpoint.secret}`);
    writeOutput("webhook_secret", endpoint.secret);
  }

  writeOutput("endpoint_id", endpoint.id);
  writeOutput("endpoint_created", "true");
  console.log(`Created Stripe ${mode} webhook endpoint ${endpoint.id} for ${webhookUrl}.`);
  console.log(`Enabled events: ${REQUIRED_EVENTS.join(", ")}`);

  return endpoint;
}

const existingEndpoints = await listEndpointsForUrl();

if (existingEndpoints.length === 0) {
  await createEndpoint();
} else if (rotate) {
  // Create the replacement first so webhook delivery never has a gap, then
  // remove the previous endpoints for this URL.
  const replacement = await createEndpoint();

  for (const endpoint of existingEndpoints) {
    if (endpoint.id !== replacement.id) {
      await stripeRequest("DELETE", `/v1/webhook_endpoints/${endpoint.id}`);
      console.log(`Deleted previous endpoint ${endpoint.id}; its signing secret is now invalid.`);
    }
  }
} else {
  const endpoint = existingEndpoints[0];

  await stripeRequest("POST", `/v1/webhook_endpoints/${endpoint.id}`, {
    ...enabledEventParams(),
    disabled: "false"
  });
  writeOutput("endpoint_id", endpoint.id);
  writeOutput("endpoint_created", "false");
  console.log(`Endpoint ${endpoint.id} already covers ${webhookUrl}; enabled events refreshed.`);
  console.log("Stripe never re-reveals an existing signing secret. Re-run with rotate=true to mint a new one.");

  if (existingEndpoints.length > 1) {
    console.log(`Warning: ${existingEndpoints.length} endpoints point at this URL. Consider rotate=true to consolidate.`);
  }
}
