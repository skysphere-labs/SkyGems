import { stableStringify } from "@skygems/shared";

type SqlValue = string | number | null;

function prepareStatement(db: D1Database, sql: string, bindings: SqlValue[]) {
  const statement = db.prepare(sql);
  return bindings.length > 0 ? statement.bind(...bindings) : statement;
}

export async function queryFirst<T>(
  db: D1Database,
  sql: string,
  bindings: SqlValue[] = [],
): Promise<T | null> {
  return prepareStatement(db, sql, bindings).first<T>();
}

export async function queryAll<T>(
  db: D1Database,
  sql: string,
  bindings: SqlValue[] = [],
): Promise<T[]> {
  const result = await prepareStatement(db, sql, bindings).run<T>();
  return (result.results ?? []) as T[];
}

export async function executeStatement(
  db: D1Database,
  sql: string,
  bindings: SqlValue[] = [],
): Promise<void> {
  await prepareStatement(db, sql, bindings).run();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function hoursFromNowIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function asJsonText(value: unknown): string {
  return stableStringify(value);
}
