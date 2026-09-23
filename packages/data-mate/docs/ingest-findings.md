# Ingest findings — the transport measurement

**This file is now only the measurement record behind the wire format.** The live conclusions are in
`HANDOFF.md` §1 THE BOUNDARIES; the design this file used to describe (`read_json` + SQL coercion + UDFs)
was measured, abandoned, and the code deleted — `coercion-sql.ts`, `ingest-sql.ts`, `object-ingest.ts`,
`udf/*`, `type-map.ts` and `util-parity-spec.ts` are all gone from `src`, verified 2026-09-15.

**There is NO JSON in the lifecycle.** The Elasticsearch client returns already-parsed JS objects; ingest is
`coerceToType` in JS plus a typed appender (`DuckFrame.fromRecords`), and the wire carries **Parquet + zstd**.
`read_parquet` is **27 ms/1M** against `read_json` + coercion at **263 ms/1M**, and Parquet is typed and
schema-carrying so the worker does no coercion at all. Current ingest timings are on `DuckFrame.ts`'s class
doc comment, not here.

## The transport measurement

Probe: `docs/tools/archive/ingest-probe/measure-parquet.mjs` (archived; it may no longer run). Every option
starts from the same JS objects and ends with a **queryable DuckDB table on the worker**; dfjson ends at a
`DataFrame` and is shown, not compared as equivalent.

| 1M rows | producer (search) | worker | **total** |
|---|---|---|---|
| ndjson | 803 ms | 248 ms | **1,052 ms** |
| **opt2 parquet zstd** | 1,164 ms | **31 ms** | **1,195 ms** |
| opt2 parquet snappy | 1,148 ms | 26 ms | 1,175 ms |
| opt2 parquet uncompressed | 1,141 ms | 24 ms | 1,164 ms |
| ndjson + gzip | 2,665 ms | 385 ms | 3,049 ms |
| dfjson *(then)* | 1,482 ms | 784 ms | 2,266 ms *(→ DataFrame)* |

| wire size | size | gzipped |
|---|---|---|
| ndjson | 194.0 MB | 35.9 MB in **1,937 ms** |
| dfjson | 106.3 MB | 25.4 MB in 1,388 ms |
| parquet uncompressed | 67.5 MB | 24.7 MB in 1,215 ms |
| parquet snappy | 36.0 MB | *internal* |
| **parquet zstd** | **22.8 MB** | *internal* |

**gzip: no — it loses on both axes.** Gzipping ndjson costs ~1,900 ms to produce, makes the worker *slower*
(385 ms vs 248 ms, since it must decompress), and is still beaten on size by Parquet zstd (35.9 vs 22.8 MB).

**Parquet's internal compression is effectively free**: zstd `COPY` costs 65 ms vs 42 ms uncompressed and
reads in 31 ms vs 24 ms — ~30 ms for the smallest wire of anything measured. **Use `COMPRESSION zstd`; never
gzip the transport.**

**The split matters more than the sum.** Total time is close (1,195 vs 1,052 ms) but the worker is 31 ms
against 248 ms — **8x** on the scarce tier where the table lives — and Parquet needs no coercion there, so
Binary/Long/Infinity survive transport where plain `JSON.stringify` cannot represent them.

> The 1,164 ms producer above is the ABANDONED producer (`stringify` → `read_json` → coerce → `COPY`, of
> which the JSON round-trip was ~1,100 ms and the `COPY` ~50 ms). The shipped producer is `coerceToType` +
> typed appender; do not cite 1,164 ms as the current cost.

Correctness: ndjson and parquet fingerprints match (`sum(bytes)`, `sum(total)`, `count(active)`); Parquet
renders the HUGEINT sum with a trailing `.0` but the value is identical.

## Two lessons

**If a number looks impossibly good, check what is outside the timer before reporting it.** The first pass
computed the ndjson bytes ONCE at setup, so the "producer" timer measured only the file write — 21 ms
instead of 803 ms, and the gzip and opt2 rows had the same omission. Third occurrence of this exact error.

**Promote a settled finding into `HANDOFF.md` next to whatever it constrains.** This file's own conclusion
was buried under a header telling readers to skip the body, and was re-derived wrongly as a result.
