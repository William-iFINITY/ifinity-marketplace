export interface PartyContext {
  loggedInPartyId?: string;
  selectedPartyId?: string;
  requestedPartyId?: string;
}

export function getPartyContext(doc: Document = document): PartyContext {
  const raw = doc.querySelector<HTMLInputElement>("#__ClientContext")?.value;
  let context: Record<string, unknown> = {};
  try { context = raw ? JSON.parse(raw) as Record<string, unknown> : {}; } catch { context = {}; }
  return {
    loggedInPartyId: value(context["loggedInPartyId"]),
    selectedPartyId: value(context["selectedPartyId"]),
    requestedPartyId: new URL(doc.location.href).searchParams.get("ID") || undefined,
  };
}

function value(input: unknown): string | undefined {
  return input === undefined || input === null || input === "" ? undefined : String(input);
}
