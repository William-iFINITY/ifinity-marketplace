import { createComponent, provideZonelessChangeDetection } from "@angular/core";
import type { ApplicationRef, ComponentRef } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

const selector = '[data-agentz-ipart="__MOUNT_KEY__"]';
const pending = new WeakSet<Element>();
const runtimes = new Map<Element, { application: ApplicationRef; reference: ComponentRef<AppComponent> }>();

export function reconcileInstances(root: ParentNode = document): void {
  const direct = root instanceof Element && root.matches(selector) ? [root] : [];
  const candidates = [...direct, ...root.querySelectorAll(selector)];
  for (const instance of candidates) {
    if (runtimes.has(instance) || pending.has(instance)) continue;
    void startInstance(instance);
  }
  for (const [instance, runtime] of runtimes) {
    if (instance.isConnected) continue;
    runtime.application.detachView(runtime.reference.hostView);
    runtime.reference.destroy();
    runtime.application.destroy();
    runtimes.delete(instance);
  }
}

async function startInstance(instance: Element): Promise<void> {
  pending.add(instance);
  let application: ApplicationRef | undefined;
  try {
    const host = instance.querySelector("[data-angular-host]");
    if (!(host instanceof Element)) return;
    application = await createApplication({ providers: [provideZonelessChangeDetection()] });
    if (!instance.isConnected) {
      application.destroy();
      return;
    }
    const reference = createComponent(AppComponent, {
      hostElement: host,
      environmentInjector: application.injector,
    });
    reference.setInput("instance", instance);
    application.attachView(reference.hostView);
    reference.changeDetectorRef.detectChanges();
    runtimes.set(instance, { application, reference });
  } catch (error) {
    application?.destroy();
    instance.setAttribute("aria-busy", "false");
    instance.setAttribute("data-state", "error");
    const host = instance.querySelector("[data-angular-host]");
    if (host instanceof HTMLElement) {
      host.textContent = error instanceof Error ? error.message : "The iPart could not start.";
      host.setAttribute("role", "alert");
    }
  } finally {
    pending.delete(instance);
  }
}

reconcileInstances();
new MutationObserver((records) => {
  for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) reconcileInstances(node);
  reconcileInstances();
}).observe(document.documentElement, { childList: true, subtree: true });
