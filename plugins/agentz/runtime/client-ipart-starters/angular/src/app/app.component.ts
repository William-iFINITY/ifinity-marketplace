import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { getPartyContext } from "../imis/party-context";
import { readInstanceSettings } from "../imis/settings";

@Component({
  selector: "agentz-client-ipart-app",
  standalone: true,
  template: `
    <div [attr.data-state]="state()">
      <h2>{{ projectName }}</h2>
      <p role="status" aria-live="polite">{{ message() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly projectName = __PROJECT_NAME_JS__;
  readonly instance = input.required<Element>();
  readonly state = signal("loading");
  readonly message = signal("Loading");

  constructor() {
    queueMicrotask(() => void this.start());
  }

  private async start(): Promise<void> {
    const instance = this.instance();
    try {
      const settings = await readInstanceSettings(instance, __SETTINGS_DEFAULTS_JSON__);
      const context = getPartyContext();
      (instance as HTMLElement).dataset["contentItemKey"] = settings.contentItemKey;
      instance.setAttribute("aria-busy", "false");
      this.state.set("ready");
      this.message.set(`${__EXPECTED_MARKER_JS__}${settings["heading"] ? ` ${String(settings["heading"])}` : ""}${context.selectedPartyId ? ` for Party ${context.selectedPartyId}` : ""}`);
    } catch (error) {
      instance.setAttribute("aria-busy", "false");
      this.state.set("error");
      this.message.set(error instanceof Error ? error.message : "The iPart could not start.");
    }
  }
}
