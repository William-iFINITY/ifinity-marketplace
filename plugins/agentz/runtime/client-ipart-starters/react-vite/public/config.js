import { assertSettingsMatchSchema } from "__PACKAGE_BASE_URL__settings-schema-validator.js";

const defaults = __SETTINGS_DEFAULTS_JSON__;
const schema = __SETTINGS_SCHEMA_JSON__;
const hostInput = document.querySelector("#JsonSettings");
const editor = document.querySelector("#agentz-settings-json");
const status = document.querySelector("[data-config-status]");
if (!editor) {
  if (status && !status.textContent) status.textContent = "This iPart has no configurable settings.";
} else {
  let current = { ...defaults };
  try {
    const saved = hostInput?.value?.trim() ? JSON.parse(hostInput.value) : {};
    if (saved && typeof saved === "object" && !Array.isArray(saved)) current = { ...defaults, ...saved };
    assertSettingsMatchSchema(current, schema);
  } catch {
    status.textContent = "The saved settings are not valid JSON or do not match the declared schema. Correct them before you save.";
  }
  editor.value = JSON.stringify(current, null, 2);
  editor.addEventListener("input", () => {
    try {
      const next = JSON.parse(editor.value);
      if (!next || typeof next !== "object" || Array.isArray(next)) throw new Error("Settings must be an object.");
      assertSettingsMatchSchema(next, schema);
      if (hostInput) hostInput.value = JSON.stringify(next);
      status.textContent = "Settings are ready for the iMIS dialog to save.";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Settings are not valid.";
    }
  });
}
