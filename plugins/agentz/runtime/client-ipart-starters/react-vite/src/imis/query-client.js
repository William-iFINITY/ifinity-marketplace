export function queryRows(input) {
  if (!window.ifxQueryClient?.fetchQueryRows) throw new Error("The AgentZ IQA runtime helper is missing.");
  return window.ifxQueryClient.fetchQueryRows(input);
}

export function renderTrustedQueryTemplate(templateHtml, rows) {
  if (!window.ifxQueryClient?.renderQueryTemplate) throw new Error("The AgentZ IQA runtime helper is missing.");
  return window.ifxQueryClient.renderQueryTemplate(templateHtml, rows, { escapeValues: true });
}
