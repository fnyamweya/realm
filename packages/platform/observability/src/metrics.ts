export interface Counter {
  name: string;
  increment(labels?: Record<string, string>): void;
  getValue(labels?: Record<string, string>): number;
}

export interface Histogram {
  name: string;
  observe(value: number, labels?: Record<string, string>): void;
}

function labelsKey(labels?: Record<string, string>): string {
  if (!labels) return "";
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

export function createCounter(name: string): Counter {
  const values = new Map<string, number>();

  return {
    name,
    increment(labels?: Record<string, string>): void {
      const key = labelsKey(labels);
      values.set(key, (values.get(key) ?? 0) + 1);
    },
    getValue(labels?: Record<string, string>): number {
      return values.get(labelsKey(labels)) ?? 0;
    },
  };
}

export function createHistogram(name: string): Histogram {
  const observations = new Map<string, number[]>();

  return {
    name,
    observe(value: number, labels?: Record<string, string>): void {
      const key = labelsKey(labels);
      const existing = observations.get(key) ?? [];
      existing.push(value);
      observations.set(key, existing);
    },
  };
}
