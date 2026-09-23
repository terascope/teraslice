---
title: SQL Builder
sidebar_label: overview
---

> Builds SQL text from typed pieces, for every engine Terascope targets

Everything here turns something typed — a value and its field type, a sort, a set of readable
columns, a limit — into SQL **text**. It parses nothing and executes nothing.

- **`SQLDialect`** (`dialects/`) — every piece of SQL that differs between engines: geo
  predicates, IP containment, regular expressions, JSON access, projections. `duckdb` and
  `postgres` ship; `BaseSQLDialect` holds everything they spell the same way.
- **`clauses`** — `ORDER BY` and `GROUP BY`. **Null placement is decided here, once**, for every
  package that emits a sort.
- **`quoting`** — identifiers, string literals, numbers, booleans, timestamps.
- **`statement`** — `buildSQLStatement`, which assembles a complete statement from parts.

## Who uses it

| package | for |
|---|---|
| `@terascope/xlucene-translator` | rendering the leaves of a translated xLucene query, and assembling the restricted statement `QueryAccess` hands back |
| `@terascope/data-mate` | the DuckDB frame's own DDL, projections, sorts and limits |

Neither depends on the other, which is why this is its own package rather than part of either.

## Null placement

No two engines place nulls the same way, and none of them match `DataFrame`:

| | ascending | descending |
|---|---|---|
| Elasticsearch (`missing` defaults to `_last`) | last | last |
| DuckDB (`default_null_order`) | last | last |
| PostgreSQL (a null is the largest value) | last | first |
| **`DataFrame` — the default here** | **first** | **last** |

Because the rule matches nothing, it can never be left to an engine default: `NULLS FIRST` /
`NULLS LAST` is emitted on **every** term, in **every** engine. Pass `nulls: 'last'` on a
`SQLSort` for the Elasticsearch answer.

```ts
import { getSQLDialect } from '@terascope/sql-builder';

const dialect = getSQLDialect('duckdb');

dialect.orderBy([{ expression: '"bytes"', order: 'asc' }]);
// '"bytes" ASC NULLS FIRST'

dialect.orderBy([{ expression: '"bytes"', order: 'asc', nulls: 'last' }]);
// '"bytes" ASC NULLS LAST'
```

## Quoting

Identifiers are quoted **unconditionally**. "Only when it looks unsafe" is not a decidable test —
every reserved word looks like an ordinary identifier, and `group`, `order`, `end` and `table` are
ordinary field names in real data.

Note that `quoteLiteral` is not the same job as `core-utils`' `jsStringEscape`: that escapes for a
*JavaScript* string literal, including backslashes, which would corrupt `C:\path` here while
leaving the quote that actually matters unescaped.
