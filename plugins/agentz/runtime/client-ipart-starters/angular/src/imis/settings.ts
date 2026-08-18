import { imisApi } from "./api-client";
import { assertSettingsMatchSchema } from "./settings-schema-validator.js";

export interface InstanceSettings extends Record<string, unknown> {
  contentKey: string;
  contentItemKey: string;
}

export async function readInstanceSettings(instance: Element, defaults: Record<string, unknown> = {}): Promise<InstanceSettings> {
  const contentKey = instance.querySelector<HTMLInputElement>("[data-content-key]")?.value;
  const contentItemKey = instance.querySelector<HTMLInputElement>("[data-content-item-key]")?.value;
  if (!contentKey || !contentItemKey || contentKey.startsWith("[") || contentItemKey.startsWith("[")) throw new Error("iMIS did not supply the instance content keys.");
  const query = new URLSearchParams({ contentKey, contentItemKey });
  const envelope = await imisApi<Record<string, unknown>>(`/api/ContentItem?${query}`);
  const saved = parseContentItemSettingsEnvelope(envelope);
  const merged = { ...defaults, ...saved };
  assertSettingsMatchSchema(merged, __SETTINGS_SCHEMA_JSON__);
  return { ...merged, contentKey, contentItemKey } as InstanceSettings;
}

export function parseContentItemSettingsEnvelope(envelope: Record<string, unknown>): Record<string, unknown> {
  const items = objectValue(envelope["Items"]);
  const values = Array.isArray(items?.["$values"]) ? items["$values"] as unknown[] : Array.isArray(envelope["Items"]) ? envelope["Items"] as unknown[] : [];
  const item = objectValue(values[0]) ?? envelope;
  const data = objectValue(item["Data"]) ?? item;
  const candidate = data["Settings"] ?? {};
  let saved: unknown = candidate;
  if (typeof candidate === "string") {
    try { saved = JSON.parse(candidate); } catch { throw new Error("The saved iPart settings are not valid JSON."); }
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("The saved iPart settings are not an object.");
  return saved as Record<string, unknown>;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
