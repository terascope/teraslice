# Ingest findings

> ## VALIDITY INDEX — read this before trusting any part of this file
>
> This file is **chronological**, and most of it describes a design that was measured and
> abandoned. The STOP block below was meant to fix that, but it quarantined the whole body
> **including the parts that are still valid**, and compressed them to slogans. A real
> conclusion (Part 8, the wire format) got lost that way and had to be rediscovered.
> So, explicitly:
>
> | part | status |
> |---|---|
> | **STOP block** (immediately below) | **VALID** — the live ingest conclusion |
> | **Part 8** — transport measured, gzip answered | **VALID AND LOAD-BEARING.** Parquet+zstd on the wire: producer 1,164 ms / **worker 31 ms** / 22.8 MB, vs dfjson 1,482/784/106 MB. Promoted into HANDOFF.md §1 "THE BOUNDARIES" |
> | Part 5 | **VALID as a negative result** — Parquet→`/dev/shm` ruled out; premise was wrong |
> | Parts 1-4, 6-7, 9-15 | **ABANDONED DESIGN.** `read_json` + SQL coercion + UDFs. Do not implement from them. Kept only as the record of how it went wrong |
> | the `scope-utils.ts` section | **SUPERSEDED and wrong** — carries its own correction note |
> | the three data-mate defects + `toArray()` note | **VALID** |
> | DEFERRED section | **VALID** — the two provisional decisions |
>
> **If you take one thing from the shape of this file:** a conclusion buried in a document
> that tells readers to skip its own body will be re-derived, wrongly. Promote settled
> findings into HANDOFF.md next to whatever they constrain.

> ## STOP — READ THIS BEFORE BUILDING ANYTHING
>
> The parts below are CHRONOLOGICAL and most of them describe a design that was
> MEASURED AND ABANDONED. Do not implement from them. The live conclusions are here,
> and this block is the only part that is current.
>
> ### 1. There is NO JSON in the lifecycle. Do not reintroduce it.
> The Elasticsearch client returns **already-parsed JS objects**
> (`hits.hits.map(d => d._source)`); the wire should carry **Parquet**. JSON existed in
> Parts 1-15 only because `read_json` was chosen as the ingest mechanism, which forced
> serializing objects to ndjson so DuckDB could parse them back. That was measured as a
> net loss in Part 5 and building continued on it anyway. **That was the mistake.**
>
> ### 2. Parquet beats JSON on every axis for DuckDB. There is no trade-off.
> `read_parquet` **27 ms/1M** vs `read_json` + coercion **263 ms/1M**, and Parquet is typed
> and schema-carrying so it needs no coercion at all on read.
>
> ### 3. The ingest path: coerce in JS with `coerceToType`, append typed values.
> Measured (1M rows, JS objects in -> typed+validated table):
>
> | path | time |
> |---|---|
> | **`coerceToType` in JS -> typed appender (NO JSON)** | **394 ms** |
> | `JSON.stringify` -> `read_json` -> SQL coercion | 384 ms |
> | `DataFrame.fromJSON` (today) | 385 ms |
>
> Same speed, and the no-JSON path is **exactly equivalent to `DataFrame`** because it uses
> the same primitives. It needs no SQL coercion, no UDFs, no divergence list and no parity
> harness.
>
> ### 4. Code that should be DELETED, not extended
> `coercion-sql.ts`, `ingest-sql.ts`, `object-ingest.ts`, `udf/*`, `util-parity-spec.ts`.
> All of it exists to reimplement `coerceToType` in SQL and then patch the resulting gaps.
>
> **Survives:** `type-map.ts` (the DDL must come from the field config), `DuckFrame.ts`
> (with `fromJSON` switched to the appender and the staging file removed), and the
> transport conclusion (Parquet + zstd; worker side 27 ms vs 816 ms; **never gzip**).
>
> ### 5. Still-valid findings independent of all the above
> Three data-mate defects: the Byte/Short endpoint off-by-one, `Long` losing 1 on a bigint
> round trip, and the D1-D6 set. Plus `toArray()`'s integer fidelity gap. See DEFERRED for
> the two decisions Jared took provisionally.

---

---

**TRUNCATED 2026-08-14.** Parts 1-7 and 9+ described the abandoned `read_json` ingest design -
~1,200 lines building, measuring and then extending a layer that was deleted from `src` (see the
DO NOT list in HANDOFF.md). The scripts are in `tools/archive/ingest-probe/` and no longer run:
ten of them import modules whose source is gone. Only the STOP block above and Part 8 below
survived, because only they still describe how ingest works.

---

# Part 8: option 2 (Parquet) measured, and gzip answered

Probe: `tools/ingest-probe/measure-parquet.mjs`. Every option starts from the same JS
objects and ends with a **queryable DuckDB table on the worker**. dfjson is shown but ends
at a DataFrame — noted, not compared as equivalent.

**Harness bug caught mid-run:** the first pass computed the ndjson bytes ONCE at setup, so
the "producer" timer measured only the file write (21 ms instead of 803 ms). Same omission
in the gzip and opt2 rows. Fixed by moving `serializeRecords` inside every producer timer.
This is the third time this exact error has appeared — **if a number looks impossibly good,
check what is outside the timer before reporting it.**

## Time, 1M rows

| | producer (search) | worker | **total** |
|---|---|---|---|
| ndjson | 803 ms | 248 ms | **1,052 ms** |
| **opt2 parquet zstd** | 1,164 ms | **31 ms** | **1,195 ms** |
| opt2 parquet snappy | 1,148 ms | 26 ms | 1,175 ms |
| opt2 parquet uncompressed | 1,141 ms | 24 ms | 1,164 ms |
| ndjson + gzip | 2,665 ms | 385 ms | 3,049 ms |
| dfjson *(today)* | 1,482 ms | 784 ms | 2,266 ms *(-> DataFrame)* |

## Wire size

| | size | gzipped |
|---|---|---|
| ndjson | 194.0 MB | 35.9 MB in **1,937 ms** |
| dfjson | 106.3 MB | 25.4 MB in 1,388 ms |
| parquet uncompressed | 67.5 MB | 24.7 MB in 1,215 ms |
| parquet snappy | 36.0 MB | *internal* |
| **parquet zstd** | **22.8 MB** | *internal* |

## Answers

**gzip: no. It loses on both axes.** Gzipping ndjson costs ~1,900 ms to produce and makes
the worker *slower* (385 ms vs 248 ms, since it must decompress). And it is beaten on size
by Parquet zstd — 35.9 MB vs 22.8 MB. There is no configuration where HTTP gzip is the
right call here.

**Parquet's internal compression is effectively free.** zstd `COPY` costs 65 ms vs 42 ms
uncompressed (+23 ms) and reads in 31 ms vs 24 ms (+7 ms). For ~30 ms total it gives the
smallest wire of anything measured — smaller than gzipped dfjson, at 1/20th the CPU.
**Use `COMPRESSION zstd`; never gzip the transport.**

**Parquet vs ndjson on total time is close — 1,195 vs 1,052 ms — but the split matters
more than the sum.** The worker is 31 ms against 248 ms, an **8x** difference, and the
worker is the scarce resource where the table lives. Parquet moves work onto the
search side, which Jared noted is the more distributed tier. It also needs **no coercion
at all** on the worker, because Parquet is typed and schema-carrying: validation happens
once on the search side, and Binary/Long/Infinity survive transport — the values plain
`JSON.stringify` cannot represent (Part 7).

So on the stated preference (performance over response size, worker latency over search
latency) **option 2 with zstd is the recommendation**, and the 8.5x smaller wire is a free
side effect rather than the reason.

## The remaining inefficiency, and it is the obvious next target

opt2's producer is 1,164 ms against ndjson's 803 ms because it currently does
**stringify -> `read_json` -> coerce -> `COPY`** — a full JSON round-trip on the search
side just to get objects into DuckDB. The `COPY` itself is only ~50 ms of that; the JSON
round-trip is ~1,100 ms.

Getting objects into DuckDB without the JSON detour would cut most of it. Measured
alternatives so far: a typed per-row appender was 581 ms but did **no coercion** (invalid
comparison), and appender -> VARCHAR staging -> SQL coercion was 1,350 ms (worse). So the
JSON round-trip is currently the best *measured* route, and beating it is an open problem —
probably a typed appender fed by JS-side coercion, which is close to what `fromJSON`
already does well.

Correctness: ndjson and parquet fingerprints match (`sum(bytes)`, `sum(total)`,
`count(active)`); Parquet renders the HUGEINT sum with a trailing `.0` but the value is
identical.

---
