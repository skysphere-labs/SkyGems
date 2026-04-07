import type { ZodType } from "zod";

export function parseWithSchema<T>(schema: ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}
