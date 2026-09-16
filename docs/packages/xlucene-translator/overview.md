---
title: xLucene Translator
sidebar_label: xLucene Translator
---

> Translate xlucene query to database queries


### Note on geo shape opensearch queries
Opensearch has a limitation on the degree of precision based on how they store [geoshape](https://docs.opensearch.org/latest/mappings/supported-field-types/geo-shape/) data. Therefore exact matching of polygons or multi-polygons with the various geo relations (ie within, contains) is inconsistent.  The intersect relation seems the most reliable method to find a geoshape using the exact same geoshape in the query, though other data that intersect will also be there in the results.

## SQL

`QueryAccess.restrictSQLQuery` is the SQL counterpart of `restrictSearchQuery`: that one takes
`params` and returns search params a client accepts unchanged, and this takes `params` and
returns a **statement a client accepts unchanged**.

```ts
const sql = await access.restrictSQLQuery('bar:hello', {
    params: { table: 'events', size: 100 }
});
// SELECT * FROM "events" WHERE ("bar" = 'hello') LIMIT 100

await connection.run(sql);
```

Neither method asks the caller to assemble anything, and for the same reason: the part a caller
forgets to assemble is the field restriction.

| `restrictSearchQuery` param | `restrictSQLQuery` param | becomes |
|---|---|---|
| `index` | `table` | `FROM "events"`, quoted a segment at a time |
| — | `relation` | `FROM …` **verbatim** — `read_parquet([…])`, a sub-select, a join |
| `size` | `size` | `LIMIT` |
| `from` | `from` | `OFFSET` |
| `sort` | `sort` | `ORDER BY`, after whatever the query itself asked for |
| `_source_includes` / `_source_excludes` | `includes` / `excludes` | the `SELECT` list |

`table` is quoted, so a reserved word like `order` is an ordinary table name; `relation` is the
caller's own SQL and is used as written, so it must never be built from input the caller did not
write. `size` and `from` cannot be parameterised in a statement, so they are checked to be
non-negative integers rather than interpolated.

Field restrictions are **applied**, into the projection. `select` is `*` when nothing is
restricted, an explicit column list when something is, and `NULL` when nothing may be read at
all — which returns the rows and none of their data, as Elasticsearch returns hits with an empty
`_source`. A column the type config does not declare is not projected once any restriction is in
play: `QueryAccess` cannot reason about a field it was never told about, and withholding it
matches the answer it already gives when one is queried.

### Composing your own statement

A caller that already has a relation — a frame, say — wants the pieces instead:

```ts
const { where, select, sort, columns } = await access.restrictSQLParts('bar:hello');
frame.filter(where);
```

**A caller here owes the restriction**: using `where` and ignoring `select` returns every
excluded column. That is why the method returning a finished statement is the one with the
ordinary name.

`Translator.toSQL()` is a level below both, and mirrors `toElasticsearchDSL` — it returns the
`query` expression and any `sort`, with no notion of access rules:

```ts
new Translator('bar:hello AND num:>50', { type_config }).toSQL();
// { query: '(("bar" = \'hello\') AND ("num" > 50))' }
```

### Dialects

Engines differ on regular expressions, IP containment and every geo predicate, so the emission
goes through a dialect:

```ts
translator.toSQL({ dialect: 'postgres' });
```

`duckdb` is the default and the one verified against a running engine. A caller whose storage
differs from a dialect's assumptions subclasses it and overrides the method concerned, then
passes the instance as `dialect`.

| | DuckDB | PostgreSQL |
|---|---|---|
| a dotted field | a `STRUCT` path, `"a"."b"` — what `DataType.toDuckDB` builds | one column named `a.b` |
| `geo-point` | `STRUCT(lat DOUBLE, lon DOUBLE)` | a PostGIS `geometry(Point, 4326)` |
| `geo-json` | `JSON`, through `ST_GeomFromGeoJSON` | text or `json`/`jsonb`, likewise |
| a regular expression | `regexp_full_match` | `~` against an anchored pattern |
| an IP | `TRY_CAST(… AS INET)`, IPv4 mapped into IPv6 | `CAST(… AS inet)` |
| a distance | `ST_Distance_Sphere` | `ST_DWithin` over `geography` |
| a partly-readable column | `struct_pack`, rebuilding the struct | the excluded column is simply left out |

**DuckDB needs two extensions and neither is statically linked.** `inet` autoloads on first use;
`spatial` does **not**, so a geo query without a `LOAD spatial` at bootstrap is a catalog error
rather than a slow path.

### Where SQL does not answer the way Elasticsearch does

Most of the translation matches the DSL exactly — `test/sql/` runs the same queries as
`test/query/` against a real DuckDB and asserts the same results. Four places differ, all of them
deliberate:

- **A missing field under `NOT`.** `must_not` matches a document whose field is absent, and SQL's
  three-valued logic would drop that row, so every negation is emitted as
  `COALESCE(NOT (…), TRUE)`.
- **An analyzed string is compared whole.** There is no analyzer, so `~string` fields are matched
  by equality rather than by tokens.
- **A query with no field, or a field pattern**, becomes the same comparison against every
  configured field *whose type could hold the value*. Elasticsearch's `multi_match` needs no such
  filter; in SQL, comparing `'hello'` to an integer column is a cast error rather than a
  non-match.
- **A shape contains itself.** `ST_Contains` and `ST_Within` apply OGC semantics, where a geometry
  contains an identical geometry; OpenSearch's `geo_shape` answers differently for some of those
  pairs, for the precision reason described above.

`knn` has no SQL equivalent and raises rather than emitting something that would answer wrongly.

Field restrictions are checked the other way round — `test/query/sql-parity-spec.ts` runs the same
`QueryAccess` against a real OpenSearch and a real DuckDB over ten include/exclude combinations
and requires the returned records to be identical, sub-object exclusions included.
