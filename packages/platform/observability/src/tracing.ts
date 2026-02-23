export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
}

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createSpan(name: string, parentSpanId?: string): Span {
  const span: Span = {
    traceId: generateId(),
    spanId: generateId(),
    name,
    startTime: Date.now(),
    attributes: {},
  };
  if (parentSpanId !== undefined) {
    span.parentSpanId = parentSpanId;
  }
  return span;
}

export function endSpan(span: Span): Span {
  return { ...span, endTime: Date.now() };
}
