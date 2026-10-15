---
title: TealFrame
---

`TealFrame` is a frame whose rows live in a [DuckDB](https://duckdb.org) table instead of in JavaScript memory. Each operation (`filter`, `select`, `orderBy`, `limit`, `join`, ...) returns a new frame that wraps one more step of a SQL statement. Nothing runs until you read the rows, and then the whole chain runs as a single query.

It uses the same `DataTypeConfig` as [`DataFrame`](data-frame.md), and the data-mate field functions run against it, as native SQL where a translation exists and as a JavaScript function registered with DuckDB otherwise.

## TealFrame or DataFrame

Use `DataFrame` when the data fits comfortably in the Node.js heap and you want synchronous, in-process access to columns and values.

Use `TealFrame` when:

- the data is larger than you want to hold as JavaScript objects, since DuckDB stores it in columnar form and can spill to disk past a memory limit;
- the input is already Parquet, which `TealFrame` queries in place without loading it first;
- you need joins, grouping, or a sort with a limit, which DuckDB runs natively and in parallel;
- you already have a SQL statement, such as one built by `QueryAccess` from an xLucene query.

`TealFrame` does not wrap or replace `DataFrame`. The two have separate APIs, and `TealFrame` is asynchronous throughout.

## Opening the database

There is one DuckDB database per process. It opens on first use as an in-memory database (`:memory:`), so no setup is required. To set resource limits, call `configureDuckDatabase` once at startup:

```ts
import { configureDuckDatabase } from '@terascope/data-mate';

await configureDuckDatabase({
    memoryLimit: '8GB',          // keep this below the container's memory limit
    tempDirectory: '/var/tmp/duck', // where DuckDB spills when a query exceeds memoryLimit
    maxTempDirectorySize: '30GB',
    threads: 4,
});
```

Calling it again on an open database applies the new settings. Passing `database: '/path/to/file.db'` (here or in a frame's options) opens a file-backed database instead. Only the exact string `:memory:` is in-memory; any other value is treated as a file path. Frames in different databases cannot see each other's tables and cannot be joined.

### DuckDB extensions

`TealFrame` loads four DuckDB extensions when the database opens: `httpfs` and `aws` (reading `s3://` and `https://` paths), `inet` (the IP functions), and `spatial` (the geo functions). `parquet`, `json` and `icu` are compiled into the DuckDB binding and need nothing.

By default DuckDB downloads a missing extension from `extensions.duckdb.org` the first time the database opens, and caches it in `~/.duckdb/extensions`. On a machine without network access, install the extensions ahead of time with the `duckdb-extensions` command this package provides, for example while building a container image:

```bash
# download the extensions (build stage)
duckdb-extensions install --dir /opt/duckdb/extensions

# confirm they load with no network access (runtime stage)
duckdb-extensions verify --dir /opt/duckdb/extensions
```

`install` also accepts `--repository <url|dir>` to download from an internal mirror. At runtime, point DuckDB at the directory and turn off downloads with environment variables:

```bash
DUCKDB_EXTENSION_DIRECTORY=/opt/duckdb/extensions
DUCKDB_AUTOINSTALL_EXTENSIONS=false
```

The same settings are available as `extensionDirectory` and `autoinstallExtensions` on `configureDuckDatabase`, but the environment is the more reliable place for them, because the directory is fixed when the database opens and the first frame you create may open it before your configuration code runs. If an extension cannot be loaded, opening the database throws a `DuckExtensionError` that names each missing extension and the directory searched. `installExtensions` and `verifyExtensions` are also exported for use from code.

## Creating a frame

```ts
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame } from '@terascope/data-mate';

const config: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        ip: { type: FieldType.IP },
        bytes: { type: FieldType.Long },
        tags: { type: FieldType.Keyword, array: true },
    },
};

// from JavaScript records; each value is coerced to its field type
const frame = await TealFrame.fromRecords(config, records);

// from one Parquet file, a list of files, or a glob; read in place, without coercion
const fromFiles = await TealFrame.fromParquet(config, ['part-1.parquet', 'part-2.parquet']);

// an empty table, filled later
const empty = await TealFrame.create(config, { name: 'events' });
await empty.append({ records: batch });
await empty.append({ parquet: 's3://bucket/payload.parquet' });

// over a complete SQL statement that names its own source
const fromSql = await TealFrame.fromSQL(`SELECT * FROM read_parquet('data/*.parquet')`, config);
```

`fromRecords` and `append({ records })` default to `strict` mode: the first value that does not fit its field type throws a `CoercionFailureError`, as `DataFrame` does. Pass `{ mode: 'lenient' }` as the options argument to store those values as `null` instead:

```ts
await TealFrame.fromRecords(config, records, { mode: 'lenient' });
await frame.append({ records: batch }, { mode: 'lenient' });
```

`append` runs in a transaction. If it fails, it throws an `AppendError` and the table is left exactly as it was, so earlier appends are kept. `append` returns the number of rows added.

## Querying

Each method returns a new frame and leaves the original unchanged:

```ts
const result = frame
    .filter(`"bytes" > 1000`)
    .select({ name: '"name"', kb: '"bytes" / 1024' }, {
        config: {
            version: 1,
            fields: { name: { type: FieldType.Keyword }, kb: { type: FieldType.Double } },
        },
    })
    .orderBy([{ expression: '"kb"', order: 'desc' }, { expression: '"name"' }])
    .limit(10);
```

- `filter(predicate)` is the `WHERE` clause and `select(expressions, options)` the `SELECT` list. Both take raw SQL, so quote identifiers yourself (`"group"`, not `group`). `select` returns only the columns you list. When the result's types differ from the frame's, pass the new `config`. `select` also accepts `groupBy`.
- `orderBy(sort)` takes `{ expression, order?: 'asc' | 'desc', nulls?: 'first' | 'last' }` terms. As in `DataFrame`, nulls sort first ascending and last descending unless `nulls` is set.
- `limit(count?, offset?)` pages the result.
- `distinct()` removes duplicate rows across all columns.
- `join(other, { on, select, config, type?, as?, otherAs?, groupBy? })` joins two frames. The sides are aliased `a` and `b` by default, so `on` and `select` are written against those aliases.
- `deepSelect(fields)`, `expandValues(fields, { correlate })` and `removeEmptyRows()` match the `DataFrame` methods of the same names, and `countEmptyRows()` counts rows where every column is null.
- `materialize()` copies the result into a table and returns a new frame over it. Use it when an expensive frame is read more than once; otherwise the statement is recomputed at each use.

### Running an existing SQL statement

If you already have a complete statement, run it with `query` rather than taking it apart into `filter` and `select` calls. This is how you run an xLucene query restricted by `QueryAccess` from `xlucene-translator`: the frame names itself with `searchParams`, and `query` runs the statement built around that name.

```ts
import { QueryAccess } from 'xlucene-translator';

const access = new QueryAccess({ type_config: typeConfig, excludes: ['secret'] });
const sql = await access.restrictSQLQuery('bar:hello', {
    params: frame.searchParams(100), // size, and optionally from
});

for await (const row of frame.query(sql).rows()) {
    // rows matching bar:hello, without the excluded field
}
```

Pass `query` a `config` (and `columns`) when the statement returns different fields than the frame has.

### Running data-mate functions

`tealFrameAdapter` turns a data-mate function config into a SQL expression for one column, which you then pass to `select`:

```ts
import { tealFrameAdapter, functionConfigRepository } from '@terascope/data-mate';

const step = await tealFrameAdapter(functionConfigRepository.toUpperCase, {
    field: 'name',
    inputConfig: { field_config: config.fields.name },
});

const upper = frame.select(
    { name: step.expression, bytes: '"bytes"' },
    { config: { version: 1, fields: { name: step.outputConfig.field_config, bytes: config.fields.bytes } } }
);
```

The result's `outputConfig` is the column's field config after the function runs. Pass it as the `inputConfig` of the next step to chain functions, and each chain still runs as one statement.

Most function configs have a `sql` translation and run as native DuckDB SQL. A function without one runs its own JavaScript implementation, registered with DuckDB as a scalar function (a UDF). Some translations cover only part of the input and use the UDF for the rest. `result.dispatch` reports which happened: `'sql'`, `'sql+udf'`, `'udf'` or `'none'`. Pass `preferSql: false` to force the JavaScript implementation.

Behavior follows `DataFrame`: a validation sets failing values to `null` and keeps the row, while a transform throws on a value it cannot convert, and throws immediately if the column's type is not one it accepts.

## Output

```ts
for await (const row of frame.rows()) { /* plain objects */ }
for await (const line of frame.ndjson()) { /* one JSON string per row */ }

await frame.writeNDJSON('result.ndjson');
await frame.writeParquet('result.parquet'); // zstd compressed
const count = await frame.size();
```

`rows()` with no options yields every column, with nulls as `null`. `rows(options)`, `ndjson(options)` and `writeNDJSON(path, options)` take `DataFrame`'s `SerializeOptions` (`useNullForUndefined`, `skipNilValues`, `skipEmptyArrays`, `skipNilListValues`, `skipNilObjectValues`, `skipEmptyObjects`, `skipDuplicateObjects`) and produce the same output as `DataFrame.toJSON` with those options. The extra `removeNullFields` flag selects a preset. With no options at all, `ndjson()` and `writeNDJSON()` behave as `removeNullFields: true`, leaving null fields and empty objects out.

`writeNDJSON` and `ndjson` render JSON inside DuckDB, so they are much faster than building objects with `rows()`. `ndjson` streams, so a large result can be uploaded while it is produced.

Dates are written as ISO 8601 strings, and integers larger than `Number.MAX_SAFE_INTEGER` as exact decimal strings.

## Type mapping

Each field is stored in the DuckDB type below. An `array: true` field is a DuckDB list of that type (`VARCHAR[]`).

| FieldType | DuckDB type |
| --- | --- |
| `Keyword` and its variants, `Text`, `String`, `Domain`, `Hostname`, `Binary` | `VARCHAR` |
| `IP`, `IPRange` | `VARCHAR` |
| `Boolean` | `BOOLEAN` |
| `Byte`, `Short` | `TINYINT`, `SMALLINT` |
| `Integer`, `Long` | `BIGINT` |
| `Float`, `Double`, `Number`, `Vector` | `DOUBLE` |
| `Date` | `STRUCT(ms BIGINT, tz_offset SMALLINT)` |
| `Geo`, `GeoPoint` | `STRUCT(lat DOUBLE, lon DOUBLE)` |
| `Boundary` | `STRUCT(lat DOUBLE, lon DOUBLE)[]` |
| `GeoJSON` | `GEOMETRY` |
| `Object` with child fields | `STRUCT(...)` of its children |
| `Tuple` with child fields | `STRUCT("0" ..., "1" ...)`, returned as an array |
| `Object` or `Tuple` without child fields, `Any` | `JSON` |

A `Date` keeps both the instant and the original time zone offset. `diffSchema(frame)` compares a frame's declared config to the column types DuckDB actually produces, which helps catch a `select` whose expressions do not match the config it declares.

## Cleanup

`frame.destroy()` drops the table a frame owns. Frames built over it with `filter`, `select` and the other methods read that table by name, so only destroy it once nothing derived from it is still in use.

`closeDuckDatabase()` closes the database. Call it when you are done with `TealFrame`, and in test teardown. It matters once any data-mate function has run as a UDF: a registered UDF keeps the Node.js event loop alive, so a process that does not close the database will not exit on its own.

## Limitations

- Sorting is not stable. If several rows share a sort value, their order can change between runs, and paging over them with `limit` can repeat or skip rows. Add a unique field as the last sort term when you page.
- `join`, `distinct` and a `select` with `groupBy` throw on a frame that has been sorted, because they would discard the order. Sort after them instead.
- `size()` on a limited frame counts the page, not the total. Call it on the frame before `limit` to get the total.
- `append` adds rows to a table that other frames may already read, and those frames will see the new rows. Finish appending before you derive frames from it.
- `filter`, `select`, `join` and `query` pass their SQL through unchecked. Errors come from DuckDB when the query runs.
- Function arguments passed to `tealFrameAdapter` are constants for the whole query. Per-row arguments are not supported.
- DuckDB cannot unregister a scalar function, so UDFs stay registered until the database closes. `await registeredFunctionCount()` reports how many there are.
- Functions that fall back to a UDF run their JavaScript one value at a time and are slower than the native SQL translations.
- The geo functions need the `spatial` extension and have no JavaScript fallback.
- Date functions that run as SQL compute in UTC. `DataFrame` uses the host's time zone, so on a host not set to UTC the two can differ: for example `getTimeBetween` with `days` or `weeks` across a daylight-saving change, or `formatDate`. Run on a UTC host when you compare the two.
