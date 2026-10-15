---
title: SQL Builder
sidebar_label: overview
---

> Builds SQL text from typed pieces, for every engine Terascope targets

`@terascope/sql-builder` turns typed values (a value and its field type, a sort, a list of
readable columns, a row limit) into SQL text. It does not parse or run SQL.

It is used by `@terascope/xlucene-translator` to render translated queries and by
`@terascope/data-mate` for its DuckDB-backed frame, so both generate the same SQL for sorts,
projections and limits.

## What it exports

- **Dialects**: `getSQLDialect(name)` returns a `SQLDialect` for `'duckdb'` (the default) or
  `'postgres'`. A dialect writes everything that differs between engines: field references,
  literals, comparisons, geo and IP predicates, projections, `ORDER BY` and `LIMIT`.
  `DuckDBDialect`, `PostgresDialect` and `BaseSQLDialect` are exported so you can subclass them.
- **Clauses**: `orderByClause`, `orderByTerms`, `groupByClause`, `sortDirection`,
  `defaultNullOrder` and `toSQLSort`.
- **Quoting**: `quoteIdentifier`, `quoteLiteral`, `quoteNumber`, `quoteBoolean`, `parens` and
  related helpers.
- **Statements**: `buildSQLStatement` assembles a full `SELECT` from a `SQLQueryParts` object.

## Using a dialect

```ts
import { getSQLDialect } from '@terascope/sql-builder';
import { SQLDialectName, xLuceneFieldType } from '@terascope/types';

const dialect = getSQLDialect(SQLDialectName.duckdb);

dialect.fieldRef('user.name');
// '"user"."name"'

dialect.equals(dialect.fieldRef('bar'), 'hello', xLuceneFieldType.String);
// '("bar" = \'hello\')'

dialect.limitOffset(100, 200);
// 'LIMIT 100 OFFSET 200'
```

Values that are written into the statement, such as `LIMIT`, `OFFSET`, sort directions and IP
addresses, are validated and throw a `TSError` with status 400 when invalid.

## Null placement in sorts

Engines place nulls differently by default, and none match `DataFrame`:

| | ascending | descending |
|---|---|---|
| Elasticsearch | last | last |
| DuckDB | last | last |
| PostgreSQL | last | first |
| `DataFrame` (the default here) | first | last |

So every `ORDER BY` term includes `NULLS FIRST` or `NULLS LAST`. Pass `nulls: 'last'` to match
Elasticsearch.

```ts
dialect.orderBy([{ expression: '"bytes"', order: 'asc' }]);
// '"bytes" ASC NULLS FIRST'

dialect.orderBy([{ expression: '"bytes"', order: 'asc', nulls: 'last' }]);
// '"bytes" ASC NULLS LAST'
```

A sort `expression` is SQL and is used as-is, so never build it from untrusted input. Wrap a
field name with `dialect.fieldRef(field)` first.

## Quoting

`quoteIdentifier` always quotes, so reserved words such as `group`, `order` and `end` work as
field names. `quoteLiteral` escapes a string by doubling single quotes, which is correct for
DuckDB and PostgreSQL.

```ts
import { quoteIdentifier, quoteLiteral } from '@terascope/sql-builder';

quoteIdentifier('order');  // '"order"'
quoteLiteral("it's");      // "'it''s'"
```
