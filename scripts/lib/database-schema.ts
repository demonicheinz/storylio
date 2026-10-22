import { type SQL, sql } from "drizzle-orm";

export type QueryExecutor = (
  query: SQL,
) => Promise<{ rows: Record<string, unknown>[] }>;

const applicationTables = sql.raw(
  "n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname NOT IN ('_prisma_migrations', '__drizzle_migrations')",
);

/** Catalog-only inspection. It never reads application rows or changes the database. */
export async function readDatabaseSchema(execute: QueryExecutor) {
  const queries = {
    tables: sql`SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE ${applicationTables} ORDER BY c.relname`,
    columns: sql`SELECT c.relname AS table_name, a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS not_null, pg_get_expr(d.adbin, d.adrelid) AS default_expression FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_attribute a ON a.attrelid = c.oid LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum WHERE ${applicationTables} AND a.attnum > 0 AND NOT a.attisdropped ORDER BY c.relname, a.attname`,
    // NOT NULL is checked through pg_attribute above. Newer PostgreSQL versions
    // also expose it as a named pg_constraint entry; older versions do not.
    constraints: sql`SELECT c.relname AS table_name, con.conname AS name, con.contype::text AS type, pg_get_constraintdef(con.oid, true) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE ${applicationTables} AND con.contype <> 'n' ORDER BY c.relname, con.conname`,
    indexes: sql`SELECT tablename AS table_name, indexname AS name, indexdef AS definition FROM pg_indexes WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations', '__drizzle_migrations') ORDER BY tablename, indexname`,
    enums: sql`SELECT t.typname AS name, array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS values FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace JOIN pg_enum e ON e.enumtypid = t.oid WHERE n.nspname = 'public' GROUP BY t.typname ORDER BY t.typname`,
  };
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const [name, query] of Object.entries(queries)) {
    result[name] = (await execute(query)).rows.map((row) => ({
      ...row,
      ...(typeof row.default_expression === "string"
        ? {
            default_expression: row.default_expression.replace(
              /^CURRENT_TIMESTAMP$/,
              "now()",
            ),
          }
        : {}),
    }));
  }
  return result;
}

export function differingSchemaSections(
  expected: Awaited<ReturnType<typeof readDatabaseSchema>>,
  actual: Awaited<ReturnType<typeof readDatabaseSchema>>,
) {
  return Object.keys(expected).filter(
    (section) =>
      JSON.stringify(expected[section]) !== JSON.stringify(actual[section]),
  );
}
