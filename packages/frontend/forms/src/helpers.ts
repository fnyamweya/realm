import { type ZodSchema, type ZodError, type z } from 'zod';

export function getZodDefaults<T extends ZodSchema>(schema: T): z.infer<T> {
  // Basic implementation that returns empty object - consumers override as needed
  return {} as z.infer<T>;
}

export function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
