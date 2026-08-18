import { getPartyContext } from "./imis/party-context.js";
import { readInstanceSettings } from "./imis/settings.js";

const selector = '[data-agentz-ipart="__MOUNT_KEY__"]';
const started = new WeakSet();

export function startInstances(root = document) {
  const instances = root.matches?.(selector) ? [root] : [...root.querySelectorAll(selector)];
  for (const instance of instances) {
    if (started.has(instance)) continue;
    started.add(instance);
    startInstance(instance);
  }
}

async function startInstance(instance) {
  const status = instance.querySelector("[data-status]");
  try {
    const settings = await readInstanceSettings(instance, __SETTINGS_DEFAULTS_JSON__);
    const context = getPartyContext();
    instance.dataset.contentItemKey = settings.contentItemKey;
    status.textContent = `${__EXPECTED_MARKER_JS__}${settings.heading ? ` ${settings.heading}` : ""}${context.selectedPartyId ? ` for Party ${context.selectedPartyId}` : ""}`;
    instance.setAttribute("aria-busy", "false");
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "The iPart could not start.";
    instance.setAttribute("aria-busy", "false");
    instance.dataset.state = "error";
  }
}

startInstances();
new MutationObserver((records) => {
  for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) startInstances(node);
}).observe(document.documentElement, { childList: true, subtree: true });
