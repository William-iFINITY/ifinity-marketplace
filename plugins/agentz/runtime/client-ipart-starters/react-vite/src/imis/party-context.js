export function getPartyContext(doc = document) {
  const raw = doc.querySelector("#__ClientContext")?.value;
  let context = {};
  try { context = raw ? JSON.parse(raw) : {}; } catch { context = {}; }
  return {
    loggedInPartyId: value(context.loggedInPartyId),
    selectedPartyId: value(context.selectedPartyId),
    requestedPartyId: new URL(doc.location.href).searchParams.get("ID") || undefined,
  };
}
function value(input) { return input === undefined || input === null || input === "" ? undefined : String(input); }
