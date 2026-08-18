interface QueryClient {
  fetchQueryRows(input: Record<string, unknown>): Promise<unknown[]>;
  renderQueryTemplate(templateHtml: string, rows: unknown[], options: { escapeValues: boolean }): string;
}

declare global {
  interface Window { ifxQueryClient?: QueryClient; }
}

export function queryRows(input: Record<string, unknown>): Promise<unknown[]> {
  if (!window.ifxQueryClient?.fetchQueryRows) throw new Error("The AgentZ IQA runtime helper is missing.");
  return window.ifxQueryClient.fetchQueryRows(input);
}

export function renderTrustedQueryTemplate(templateHtml: string, rows: unknown[]): string {
  if (!window.ifxQueryClient?.renderQueryTemplate) throw new Error("The AgentZ IQA runtime helper is missing.");
  return window.ifxQueryClient.renderQueryTemplate(templateHtml, rows, { escapeValues: true });
}
