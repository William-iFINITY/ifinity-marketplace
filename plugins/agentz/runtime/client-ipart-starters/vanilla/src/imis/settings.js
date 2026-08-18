import { imisApi } from "./api-client.js";
import { assertSettingsMatchSchema } from "./settings-schema-validator.js";

export async function readInstanceSettings(instance, defaults = {}) {
  const contentKey = instance.querySelector("[data-content-key]")?.value;
  const contentItemKey = instance.querySelector("[data-content-item-key]")?.value;
  if (!contentKey || !contentItemKey || contentKey.startsWith("[") || contentItemKey.startsWith("[")) {
    throw new Error("iMIS did not supply the instance content keys.");
  }
  const query = new URLSearchParams({ contentKey, contentItemKey });
  const envelope = await imisApi(`/api/ContentItem?${query}`);
  const saved = parseContentItemSettingsEnvelope(envelope);
  const merged = { ...defaults, ...saved };
  assertSettingsMatchSchema(merged, __SETTINGS_SCHEMA_JSON__);
  return { ...merged, contentKey, contentItemKey };
}

export function parseContentItemSettingsEnvelope(envelope) {
  const item = envelope?.Items?.$values?.[0] ?? envelope?.Items?.[0] ?? envelope;
  const data = item?.Data ?? item;
  const candidate = data?.Settings ?? {};
  let saved = candidate;
  if (typeof candidate === "string") {
    try { saved = JSON.parse(candidate); } catch { throw new Error("The saved iPart settings are not valid JSON."); }
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("The saved iPart settings are not an object.");
  return saved;
}
