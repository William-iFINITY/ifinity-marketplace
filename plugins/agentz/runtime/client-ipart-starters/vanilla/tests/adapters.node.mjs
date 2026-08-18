import assert from "node:assert/strict";
import test from "node:test";
import { getPartyContext } from "../src/imis/party-context.js";
import { findVerificationToken, imisApi } from "../src/imis/api-client.js";
import { parseContentItemSettingsEnvelope } from "../src/imis/settings.js";
import { assertSettingsMatchSchema } from "../src/imis/settings-schema-validator.js";

test("Party context keeps actor, selected subject, and requested subject separate", () => {
  const contextInput = { value: JSON.stringify({ loggedInPartyId: "100", selectedPartyId: "200" }) };
  const doc = {
    location: { href: "https://example.test/page?ID=300" },
    querySelector(selector) { return selector === "#__ClientContext" ? contextInput : null; },
  };
  assert.deepEqual(getPartyContext(doc), {
    loggedInPartyId: "100",
    selectedPartyId: "200",
    requestedPartyId: "300",
  });
});

test("ContentItem settings are read from the paged ContentItemData envelope", () => {
  const envelope = { Items: { $values: [{ Data: { Settings: '{"heading":"Instance 2"}' } }] } };
  assert.deepEqual(parseContentItemSettingsEnvelope(envelope), { heading: "Instance 2" });
});

test("settings values must match their declared field types", () => {
  const schema = { type: "object", properties: { heading: { type: "string" } }, required: ["heading"] };
  assert.deepEqual(assertSettingsMatchSchema({ heading: "Member view" }, schema), { heading: "Member view" });
  assert.throws(() => assertSettingsMatchSchema({ heading: 42 }, schema), /heading must be string/);
  assert.doesNotThrow(() => assertSettingsMatchSchema({ second: 2, first: 1 }, { const: { first: 1, second: 2 } }));
});

test("iMIS API requests carry the same-origin session and verification token", async () => {
  const priorFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };
  const doc = {
    location: { href: "https://example.test/page", origin: "https://example.test" },
    querySelector: () => ({ value: "proof-token" }),
  };
  try {
    await imisApi("/api/ContentItem", {}, doc);
    assert.equal(captured.options.credentials, "include");
    assert.equal(captured.options.headers.get("RequestVerificationToken"), "proof-token");
    await assert.rejects(() => imisApi("https://external.test/api/data", {}, doc), /same-origin/);
  } finally {
    globalThis.fetch = priorFetch;
  }
});

test("iMIS API accepts the canonical meta-token shape", () => {
  const meta = { getAttribute: (name) => name === "content" ? "meta-token" : null };
  const doc = {
    location: { origin: "https://example.test" },
    querySelector: (selector) => selector === "meta[name='request-verification-token']" ? meta : null,
  };
  assert.equal(findVerificationToken(doc), "meta-token");
});
