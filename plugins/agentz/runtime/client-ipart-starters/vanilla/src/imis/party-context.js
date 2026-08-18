export function getPartyContext(doc = document) {
  const raw = doc.querySelector("#__ClientContext")?.value;
  let context = {};
  try { context = raw ? JSON.parse(raw) : {}; } catch { context = {}; }
  const requestedPartyId = new URL(doc.location.href).searchParams.get("ID") || undefined;
  return {
    loggedInPartyId: stringValue(context.loggedInPartyId),
    selectedPartyId: stringValue(context.selectedPartyId),
    requestedPartyId,
  };
}

function stringValue(value) {
  return value === undefined || value === null || value === "" ? undefined : String(value);
}
