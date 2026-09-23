# SQL Builder

> Builds SQL text from typed pieces, for every engine Terascope targets

Everything in this package turns something typed - a value and its field type, a sort, a set
of readable columns, a limit - into SQL **text**. It parses nothing and executes nothing.

- **`SQLDialect`** (`dialects/`) - every piece of SQL that differs between engines: geo
  predicates, IP containment, regular expressions, JSON access, projections. `duckdb` and
  `postgres` ship; `BaseSQLDialect` holds everything they spell the same way.
- **`clauses`** - `ORDER BY` and `GROUP BY`. **Null placement is decided here, once**, for
  every package that emits a sort.
- **`quoting`** - identifiers, string literals, numbers, booleans, timestamps.
- **`statement`** - `buildSQLStatement`, which assembles a complete statement from parts.

## Who uses it

| package | for |
|---|---|
| `@terascope/xlucene-translator` | rendering the leaves of a translated xLucene query, and assembling the restricted statement `QueryAccess` hands back |
| `@terascope/data-mate` | the DuckDB frame's own DDL, projections, sorts and limits |

Neither depends on the other, which is why this is its own package rather than part of
either.

## Null placement

No two engines place nulls the same way, and none of them match `DataFrame`:

| | ascending | descending |
|---|---|---|
| Elasticsearch (`missing` defaults to `_last`) | last | last |
| DuckDB (`default_null_order`) | last | last |
| PostgreSQL (a null is the largest value) | last | first |
| **`DataFrame` - the default here** | **first** | **last** |

So `NULLS FIRST` / `NULLS LAST` is emitted on **every** term in **every** engine rather than
left to a default. Pass `nulls: 'last'` on a `SQLSort` for the Elasticsearch answer.
