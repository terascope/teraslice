---
title: xLucene Translator
sidebar_label: xLucene Translator
---

> Translate xlucene query to database queries


### Note on geo shape opensearch queries
Opensearch has a limitation on the degree of precision based on how they store [geoshape](https://docs.opensearch.org/latest/mappings/supported-field-types/geo-shape/) data. Therefore exact matching of polygons or multi-polygons with the various geo relations (ie within, contains) is inconsistent.  The intersect relation seems the most reliable method to find a geoshape using the exact same geoshape in the query, though other data that intersect will also be there in the results.

## SQL

xLucene queries can be translated to SQL as well as to the Elasticsearch DSL. DuckDB is the
default engine; PostgreSQL is also available.

### A complete statement

`QueryAccess.restrictSQLQuery` is the SQL counterpart of `restrictSearchQuery`. It returns a
complete statement, with the access rules and field restrictions already applied, that you can
run as-is:

```ts
import { xLuceneFieldType } from '@terascope/types';
import { QueryAccess } from 'xlucene-translator';

const access = new QueryAccess({
    excludes: ['secret'],
    type_config: {
        id: xLuceneFieldType.String,
        bar: xLuceneFieldType.String,
        secret: xLuceneFieldType.String,
        num: xLuceneFieldType.Integer,
    },
});

const sql = await access.restrictSQLQuery('bar:hello', {
    params: { table: 'events', size: 100 }
});
// SELECT "id", "bar", "num" FROM "events" WHERE ("bar" = 'hello') LIMIT 100

await connection.run(sql);
```

`params` maps to the statement like this:

| `restrictSearchQuery` param | `restrictSQLQuery` param | SQL |
|---|---|---|
| `index` | `table` | `FROM "events"`, quoted one dot-separated segment at a time |
| | `relation` | `FROM …`, used as-is: `read_parquet([…])`, a subquery or a join |
| `size` | `size` | `LIMIT` |
| `from` | `from` | `OFFSET` |
| `sort` | `sort` | `ORDER BY`, after any sort the query itself produces |
| `_source_includes` / `_source_excludes` | `includes` / `excludes` | the `SELECT` list |

Exactly one of `table` or `relation` is required.

**`relation` and each sort `expression` are used without escaping**, so never build them from
untrusted input. Wrap a field name from a request with `dialect.fieldRef(field)` before using it
as a sort expression. `size`, `from` and each sort `order` are validated before they are written
into the statement.

Field restrictions become the `SELECT` list:

- With no includes or excludes, the statement selects `*`.
- With a restriction, it selects only the readable columns declared in the type config. A
  column the type config does not declare is not selected.
- When nothing is readable, it selects `NULL`: rows are still returned, but with no data, as
  Elasticsearch returns hits with an empty `_source`.

### Building your own statement

If you already have a source to query and want to build the statement yourself, use
`restrictSQLParts` to get the pieces:

```ts
const { where, select, sort, columns } = await access.restrictSQLParts('bar:hello');
```

**You must apply `select`.** Using only `where` returns columns the access rules exclude.

### Translator.toSQL

`Translator.toSQL()` mirrors `toElasticsearchDSL()`. It returns a `WHERE` expression and any
sort the query implies, with no access rules:

```ts
import { Translator } from 'xlucene-translator';

new Translator('bar:hello AND num:>50', { type_config }).toSQL();
// { query: '(("bar" = \'hello\') AND ("num" > 50))' }
```

### Dialects

Pass `dialect` to choose the engine:

```ts
import { SQLDialectName } from '@terascope/types';

translator.toSQL({ dialect: SQLDialectName.postgres });

await access.restrictSQLQuery('bar:hello', {
    dialect: SQLDialectName.postgres,
    params: { table: 'events' }
});
```

You can also pass a dialect object, such as a subclass of `DuckDBDialect` or `PostgresDialect`
that overrides methods for a different storage layout. The dialects come from
`@terascope/sql-builder` and are re-exported by this package.

Each dialect assumes a storage layout:

| | DuckDB | PostgreSQL |
|---|---|---|
| a dotted field | a `STRUCT` path, `"a"."b"`, as built by `DataType.toDuckDB` | one column named `a.b` |
| `geo-point` | `STRUCT(lat DOUBLE, lon DOUBLE)` | a PostGIS `geometry(Point, 4326)` |
| `geo-json` | `GEOMETRY` | text or `json`/`jsonb`, read with `ST_GeomFromGeoJSON` |
| `ip`, `ip_range` | text, cast with `TRY_CAST(… AS INET)` | text, cast with `CAST(… AS inet)` |
| a regular expression | `regexp_full_match` | `~` with an anchored pattern |
| a distance | `ST_Distance_Sphere` | `ST_DWithin` on `geography` |
| a partly readable column | rebuilt with `struct_pack` | the excluded column is left out |

DuckDB loads the `inet` extension automatically, but not `spatial`. Run `LOAD spatial` before
running a geo query, or it fails with a catalog error.

IP addresses are compared the way Elasticsearch compares them. DuckDB and PostgreSQL both sort every IPv4
address before every IPv6 address, while Elasticsearch stores every `ip` as 128 bits with IPv4
mapped into IPv6. The generated SQL maps IPv4 values into `::ffff:` form first, so ranges compare
numerically and `ip:"::ffff:8.8.8.8"` matches a stored `8.8.8.8`.

### Differences from Elasticsearch

The SQL translation returns the same results as the Elasticsearch DSL, with these exceptions:

- **Analyzed strings are compared whole.** There is no analyzer, so analyzed string fields are
  matched by equality rather than by token.
- **Queries with no field, or with a field pattern**, are compared only against configured
  fields whose type can hold the value, because comparing `'hello'` with an integer column is a
  SQL error.
- **A shape contains an identical shape.** `ST_Contains` and `ST_Within` follow OGC rules, where
  a geometry contains an identical geometry. OpenSearch may answer differently for some of these
  shapes; see the precision note above.
- **`knn` is not supported** and throws an error.

Negation matches Elasticsearch: `NOT bar:hello` also matches rows where `bar` is NULL, because
each negation is written as `COALESCE(NOT (…), TRUE)`.

An open-ended range on an `ip` field, such as `ip:[* TO *]`, is rejected by the parser for both
engines. Use `_exists_:ip` instead. Open-ended ranges on `ip_range` fields work.
