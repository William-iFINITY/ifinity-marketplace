import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertSettingsMatchSchema } from "../src/imis/settings-schema-validator.js";

test("Angular starts multiple hosts with zoneless change detection", () => {
  const source = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.match(source, /provideZonelessChangeDetection/);
  assert.match(source, /querySelectorAll/);
  assert.match(source, /async function startInstance/);
  assert.match(source, /application\.destroy\(\)/);
  assert.equal(source.match(/await createApplication/g)?.length, 1);
  assert.ok(source.indexOf("await createApplication") > source.indexOf("async function startInstance"));
  assert.doesNotMatch(source, /zone\.js|provideZoneChangeDetection/);
});

test("Angular API adapter binds the token only to same-origin iMIS routes", () => {
  const source = readFileSync(new URL("../src/imis/api-client.ts", import.meta.url), "utf8");
  assert.match(source, /url\.origin !== doc\.location\.origin/);
  assert.match(source, /pathname\.toLowerCase\(\)\.startsWith\("\/api\/"\)/);
  assert.match(source, /RequestVerificationToken/);
  assert.match(source, /request-verification-token/);
  assert.match(source, /getAttribute\("content"\)/);
  assert.match(source, /credentials: "include"/);
});

test("Angular settings adapter reads the paged ContentItemData envelope", () => {
  const source = readFileSync(new URL("../src/imis/settings.ts", import.meta.url), "utf8");
  assert.match(source, /Items/);
  assert.match(source, /\$values/);
  assert.match(source, /data\["Settings"\]/);
});

test("Angular settings values must match their declared field types", () => {
  const schema = { type: "object", properties: { heading: { type: "string" } }, required: ["heading"] };
  assert.deepEqual(assertSettingsMatchSchema({ heading: "Member view" }, schema), { heading: "Member view" });
  assert.throws(() => assertSettingsMatchSchema({ heading: 42 }, schema), /heading must be string/);
  assert.doesNotThrow(() => assertSettingsMatchSchema({ second: 2, first: 1 }, { const: { first: 1, second: 2 } }));
});
