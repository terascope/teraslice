/**
 * SQL text helpers for the DuckDB frame.
 *
 * These stay here rather than in `@terascope/data-types`: that package owns the mapping from
 * a `DataType` onto a target system's TYPES (`toDuckDB`, `toESMapping`, `toGraphQL`,
 * `toXlucene`), while quoting is about generating SQL text, which is this layer's job.
*/

/**
 * Quote an identifier - ALWAYS, not only when it looks unsafe.
 *
 * An earlier version skipped quoting anything matching `/^[A-Za-z_][A-Za-z0-9_]*$/`, which
 * looks like the set of identifiers needing no quotes but is not: every RESERVED WORD matches
 * it too. A DataType field named `group` produced
 * `CREATE OR REPLACE TABLE t (name VARCHAR, group VARCHAR)` and a parser error, so such a
 * frame could not be created at all - and `group`, `order`, `end`, `all` and `table` are
 * ordinary field names in real data.
 *
 * Quoting unconditionally is safe here because **DuckDB treats a quoted identifier
 * case-INsensitively** (verified: `SELECT "mixedcase"` finds a column declared `"MixedCase"`).
 * That is the opposite of Postgres, where quoting pins the case, and it is why this needs no
 * reserved-word list to consult.
*/
export function quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
}

/** Quote a value as a SQL string literal, escaping embedded quotes. */
export function quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, '\'\'')}'`;
}
