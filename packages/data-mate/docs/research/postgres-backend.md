# A Postgres backend for TealFrame — not planned

Written 2026-10-07 from a read of the code, not a prototype. **DECIDED 2026-10-08: not now.** A
non-DuckDB backend is a possible FUTURE feature; nothing here is built, and nothing should be changed
to prepare for it until that feature is actually taken on.

**The verdict: the API is engine-neutral, the implementation is not.** `select`/`filter`/`join`/
`orderBy`/`limit` accumulate SQL text and `rows()` reads it, so a Postgres frame could keep the same
surface. Underneath, DuckDB is assumed in nine places, and four of them (rows 4-7) are features the
design depends on rather than plumbing.

## Getting a client

- `pg` (node-postgres) with a `Pool`; `pg-query-stream` or `pg-cursor` so `rows()`/`ndjson()` stream,
  and `pg-copy-streams` so `append()` bulk-loads with `COPY ... FROM STDIN` (row-wise `INSERT` is too
  slow at our volumes).
- In Teraslice a client comes from a terafoundation connector. Only `elasticsearch-next` and `s3`
  exist (`packages/terafoundation/src/connectors/`), so this means a new `postgres` connector. The
  QPL api-server and worker would build a pool from their own config.
- **The process model changes.** DuckDB is in-process, one database per process. Postgres is a
  network server reached through pooled sessions, so every statement pays a round trip, temp tables
  are visible only to the session that made them (frames need real tables in a dedicated schema,
  plus crash cleanup), and `COPY ... TO 'file'` writes to the SERVER's disk.

## Where DuckDB is assumed

| # | Coupling | Where | Effort |
|---|---|---|---|
| 1 | The dialect is hardcoded | `TealFrame.ts`: `getSQLDialect(SQLDialectName.duckdb)` | small: inject it |
| 2 | `DuckContext` is the only executor; `columnTypes` returns DuckDB types and `append()` opens a raw DuckDB connection for its transaction | `DuckContext.ts`, `duck-values.ts` | medium: extract an engine interface |
| 3 | DDL types come from `DataType.toDuckDB()`; there is no `toPostgres` | `table.ts`, `data-types` | medium |
| 4 | **Frames query Parquet in place** (`read_parquet`). Postgres needs `pg_parquet`/`parquet_fdw`, or the data loaded into tables first | `sources.ts`, the storage design | **large** — reverses the measured storage decision (break-even 272 queries) |
| 5 | **All 188 function emissions are DuckDB SQL**: `regexp_matches` (23 uses), `list_transform`/`list_filter` lambdas, `epoch_ms`, `strftime`, `printf`, `to_json`, `string_split` | `function-configs/**` `sql:` | **large**: a Postgres emission per function, gated against a real Postgres |
| 6 | **The JS UDF fallback.** DuckDB runs our JS in-process; Postgres runs functions server-side and has no JS unless `plv8` is installed (rare). The 17 UDF-only functions and every emission whose `applies` declines have no path: reject, or pull rows into Node | `scalar-function.ts`, the adapter | **hard limit** |
| 7 | **Output.** `writeParquet` is `COPY ... (FORMAT parquet)`; the JSON export is byte-equal to `DataFrame` only because of DuckDB's `to_json` formatting. `jsonb` reorders keys and formats numbers its own way | `export-json.ts`, `TealFrame.ts` output methods | large: rebuild and re-verify |
| 8 | Regex engine: DuckDB is RE2, Postgres is ARE; both differ from JS, differently | function SQL | medium |
| 9 | Extensions: `inet`/`spatial` load in-process; Postgres needs `inet` (built in) and PostGIS installed on the server | `extensions.ts` | small for us, ops for the deployment |

**Already there:** `sql-builder`'s `PostgresDialect` (`sql-builder/src/dialects/postgres.ts`) covers
the xLucene → `WHERE` half. Its own doc says it is **"emitted but not exercised"** — there is no
PostGIS in the test services, so its SQL has never run against Postgres.

## If the answer is yes

1. **Cheap, worth doing first:** inject the dialect into `TealFrame` and extract a `QueryEngine`
   interface from `DuckContext`, DuckDB its only implementation. About a day.
2. **Do not port functions or output until there is a real Postgres use case** — that is where the
   cost is.
3. **If the real need is "the data lives in Postgres", try DuckDB's `postgres` extension first.**
   `ATTACH`ing a Postgres database keeps every emission, the UDF fallback and the exact JSON output,
   and removes rows 4-8. Untested here; filter pushdown to Postgres has limits, so probe it first.
