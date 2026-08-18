import React, { useEffect, useId, useState } from "react";
import { getPartyContext } from "./imis/party-context.js";
import { readInstanceSettings } from "./imis/settings.js";

export function App({ instance }) {
  const headingId = useId();
  const [state, setState] = useState({ status: "loading", message: "Loading" });

  useEffect(() => {
    const controller = new AbortController();
    readInstanceSettings(instance, __SETTINGS_DEFAULTS_JSON__, controller.signal)
      .then((settings) => {
        if (controller.signal.aborted) return;
        const context = getPartyContext();
        instance.dataset.contentItemKey = settings.contentItemKey;
        instance.setAttribute("aria-busy", "false");
        setState({
          status: "ready",
          message: `${__EXPECTED_MARKER_JS__}${settings.heading ? ` ${settings.heading}` : ""}${context.selectedPartyId ? ` for Party ${context.selectedPartyId}` : ""}`,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        instance.setAttribute("aria-busy", "false");
        setState({ status: "error", message: error instanceof Error ? error.message : "The iPart could not start." });
      });
    return () => controller.abort();
  }, [instance]);

  return (
    <div aria-labelledby={headingId} data-state={state.status}>
      <h2 id={headingId}>{__PROJECT_NAME_JS__}</h2>
      <p role="status" aria-live="polite">{state.message}</p>
    </div>
  );
}
