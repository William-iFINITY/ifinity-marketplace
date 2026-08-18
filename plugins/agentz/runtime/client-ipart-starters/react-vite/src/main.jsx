import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./runtime.css";

const selector = '[data-agentz-ipart="__MOUNT_KEY__"]';
const roots = new Map();

export function reconcileInstances(root = document) {
  const candidates = root.matches?.(selector) ? [root] : [...root.querySelectorAll(selector)];
  for (const instance of candidates) {
    if (roots.has(instance)) continue;
    const content = instance.querySelector("[data-react-content]");
    const overlay = instance.querySelector("[data-react-overlay]");
    if (!content || !overlay) continue;
    const reactRoot = createRoot(content);
    roots.set(instance, reactRoot);
    reactRoot.render(<App instance={instance} overlay={overlay} />);
  }
  for (const [instance, reactRoot] of roots) {
    if (instance.isConnected) continue;
    reactRoot.unmount();
    roots.delete(instance);
  }
}

reconcileInstances();
new MutationObserver((records) => {
  for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) reconcileInstances(node);
  reconcileInstances();
}).observe(document.documentElement, { childList: true, subtree: true });
