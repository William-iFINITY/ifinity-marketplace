export function findVerificationToken(doc: Document = document): string {
  for (const candidate of sameOriginDocuments(doc)) {
    for (const selector of tokenSelectors) {
      const element = candidate.querySelector<HTMLInputElement | HTMLMetaElement>(selector);
      const value = "value" in (element ?? {}) ? (element as HTMLInputElement).value : element?.getAttribute("content");
      if (value) return value;
    }
  }
  throw new Error("The iMIS RequestVerificationToken is missing.");
}

export async function imisApi<T>(path: string, options: RequestInit = {}, doc: Document = document): Promise<T> {
  const url = new URL(path, doc.location.href);
  if (url.origin !== doc.location.origin || !url.pathname.toLowerCase().startsWith("/api/")) throw new Error("imisApi accepts same-origin iMIS /api routes only.");
  const headers = new Headers(options.headers);
  headers.set("RequestVerificationToken", findVerificationToken(doc));
  const response = await fetch(url, { ...options, headers, credentials: "include" });
  if (!response.ok) throw new Error(`iMIS API request failed with HTTP ${response.status}.`);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

function sameOriginDocuments(doc: Document): Document[] {
  const documents: Document[] = [];
  for (const view of [doc.defaultView?.parent, doc.defaultView?.top]) {
    try {
      if (view?.document && view.location.origin === doc.location.origin && !documents.includes(view.document)) documents.push(view.document);
    } catch { /* Cross-origin parents are not token sources. */ }
  }
  if (!documents.includes(doc)) documents.push(doc);
  return documents;
}

const tokenSelectors = [
  "#RequestVerificationToken",
  "#__RequestVerificationToken",
  "input[name='RequestVerificationToken']",
  "input[name='__RequestVerificationToken']",
  "meta[name='RequestVerificationToken']",
  "meta[name='__RequestVerificationToken']",
  "meta[name='request-verification-token']",
];
