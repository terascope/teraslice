/**
 * SQL text helpers for the DuckDB frame.
 *
 * These stay here rather than in `@terascope/data-types`: that package owns the mapping from
 * a `DataType` onto a target system's TYPES (`toDuckDB`, `toESMapping`, `toGraphQL`,
 * `toXlucene`), while quoting is about generating SQL text, which is this layer's job.
*/

const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Quote an identifier unless it is already a bare one. */
export function quoteIdentifier(name: string): string {
    if (SAFE_IDENTIFIER.test(name)) return name;
    return `"${name.replace(/"/g, '""')}"`;
}

/** Quote a value as a SQL string literal, escaping embedded quotes. */
export function quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, '\'\'')}'`;
}
