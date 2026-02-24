import { z } from "zod";

export const CursorPaginationParams = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});
export type CursorPaginationParams = z.infer<typeof CursorPaginationParams>;

export function createCursorPaginationResult<T extends z.ZodTypeAny>(
  itemSchema: T,
) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().optional(),
    hasMore: z.boolean(),
  });
}

export const CursorPaginationResult = createCursorPaginationResult(z.unknown());
export type CursorPaginationResult<T = unknown> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};
