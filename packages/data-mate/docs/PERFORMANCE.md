# DuckFrame performance — the measurement record

The system of record for every DuckFrame/DataFrame measurement; other docs point here rather than copy
numbers. Where both engines appear they were given **identical records** from a seeded generator and
every case was checked to produce the same row count, so "faster" cannot mean "did less".

> **This file is `bench/comparison/run.js`'s default `OUT` target** — running that bench without `OUT=`
> overwrites this curated document.

## READ FIRST — what is stale, and by how much

| caveat | effect |
|---|---|
| **Every DataFrame-vs-DuckFrame transform/validation number was taken with all 205 functions on the JS UDF path**; 188 of 205 now emit native SQL (`docs/sql-emission.md`) | those rows are a **lower bound** on the DuckFrame side. Margin in §What the SQL promotions bought: 3-9x single-function at 1M, 2.98x on the five-function pipeline, flat at 100k |
| **Measured on an UNCOMPRESSED in-memory master table** — DuckDB compresses only at `CHECKPOINT`, and that harness never checkpoints | worst case for repetitive columns: a checkpointed table runs a UDF once per *distinct* value (104x on a low-cardinality column, 3.9x on a 30-column transform) and uses 5.4x less memory |
| **The 28 MB/million figure is a GENERATOR ARTEFACT** — `bench/comparison/lib/generate.js` builds values with `i % N`; the 2026-08-27 query fixtures measure **~106 MB/million** | every SIZE, disk and bytes-on-the-wire figure here is **optimistic by ~4x**; ratios BETWEEN formats on one corpus stay valid. See `s3-perf/fixtures/README.md` |

The tell for the artefact is this file's own format table — **29.21, 28.14, 28.11, 28.02, 28.01
MB/million across a 1000x range of scale** — since a ratio that constant means every row is equally
novel. Rows 1-2 reach only the UDF path: creation, appends, filters, sorts, paging, output,
group-bys and joins involve no UDF.

## Method

| | |
|---|---|
| corpus | 30 columns (35 declared field paths) across Keyword, Text, Byte, Short, Integer, Long, Float, Double, Number, Boolean, Date, IP, GeoPoint, 7 array types and nested objects |
| scales | 1k…5M for the engine comparison (appends, dedup, page stop at 1M); 100k-100M for the 2026-08-25 report; 100M/244M/1B in §Scale |
| timing | median of 3 / 2 / 1 by scale, after a discarded warm-up |
| machine | node v24.15.0, 14 cores, 36 GB RAM, JS heap limit 24576 MB |

**Forcing.** DuckFrame is lazy, so every case ends in an explicit force — `count(*)` for a filter or
join, `materialize()` for anything yielding a usable frame, a full drain where DataFrame also produces
JS values; a sort is *never* forced with a count, which would let the optimiser drop the `ORDER BY`.
`OOM` means the JS heap was exhausted: a result, not a crash.

---

## THE 2026-08-25 REPORT MEASUREMENTS — READ THIS SECTION FIRST

Five benches over one corpus, strictly serial, all under `tools/bench`: `report-ladder.mjs` (formats ×
scale, memory-vs-disk), `report-ingest.mjs` (append vs land vs materialise), `report-consolidation.mjs`
(file layout, groups censused), `report-transforms.mjs` (SQL vs mixed vs UDF × compression),
`report-s3.mjs` (modelled latency), plus `probe/memory-metric.mjs`, `probe/parquet-memory-limits.mjs`
and `probe/parquet-scan-law.mjs`. Artifact
`https://claude.ai/code/artifact/58c8f09f-3cda-4b30-a886-a48a570e1d6a`, rebuilt by
`tools/report/build-report.mjs` from `tools/results/*.json`.

**Envelope: `memory_limit = 24GiB`, deliberately BELOW this 36 GB box.** The shared `WORKER` constant
is 48 GiB — above physical memory here, where DuckDB never spills and the kernel kills the process, so
**do not use `WORKER` unchanged on this machine**.

**FOUR RECORDED CLAIMS DID NOT SURVIVE.**

| recorded claim | status |
|---|---|
| "append cost is per STATEMENT, not per row" | **WRONG.** Fitted ~2.0 ms/statement + ~1.88 µs/row; at a 50k slice the constant is 2% |
| "batching 5-10 payloads per append is the real lever (3.74x)" | **FOLLOWS FROM THE ABOVE AND IS WRONG.** Batching saves only the 2% constant |
| "writing a native table costs LESS than rewriting Parquet" | **REVERSED at a jagged input** — 16.5 s vs 1.69 s. True only from many tiny payloads |
| "real S3 latency could collapse every break-even in favour of consolidation" | **DID NOT HOLD.** A request-count model over-predicts by ~22x |

### 1. FORMATS × SCALE — 100k to 100M, the full 15-query battery

Warm battery total and the ratio against a native table on the identical corpus; every non-native
format is a `COPY` of that table, so generator variance cannot reach a number.

| format | 100k | 500k | 1M | 10M | 100M | MB/million |
|---|---|---|---|---|---|---|
| **native table (file)** | 86 ms | 112 ms | 143 ms | 533 ms | 4.85 s | 112.6 |
| **parquet + zstd** | 117 ms · 1.37x | 142 ms · 1.27x | 165 ms · 1.15x | 768 ms · 1.44x | 6.69 s · 1.38x | 28.0 |
| **parquet + snappy** | 105 ms · 1.23x | 137 ms · 1.23x | 155 ms · 1.08x | 774 ms · 1.45x | 6.12 s · 1.26x | 68.1 |
| **parquet, uncompressed** | 92 ms · 1.08x | 124 ms · 1.10x | 143 ms · 1.00x | — | — | 221.4 |
| **arrow IPC** | 176 ms · 2.05x | 633 ms · 5.65x | 1.16 s · 8.09x | — | — | 442.5 |
| **CSV** | 1.48 s · 17.32x | 1.92 s · 17.14x | 2.36 s · 16.46x | — | — | 540.5 |
| **NDJSON** | 1.48 s · 17.24x | 1.89 s · 16.83x | 2.35 s · 16.40x | — | — | 800.9 |

**Parquet+zstd never leaves the 1.15-1.44x band across three orders of magnitude, at 25% of native's
disk** — the penalty lands on CHEAP queries (footer reading) while expensive shapes converge (at 100M
`agg: quantiles` is 2.53 s on Parquet against 2.62 s on the table). Arrow IPC is decisively out and
worsens with scale; Arrow/CSV/NDJSON were not run above 1M, being settled and 44 GB to re-prove.

### 2. MEMORY vs DISK — there is NO query advantage to an in-memory table

The same data, both checkpointed.

| rows | table on disk | table in memory | difference | attach: disk | load: memory | RAM held |
|---|---|---|---|---|---|---|
| 100k | 86 ms | 86 ms | +1% | 0 ms | 195 ms | 12 MB |
| 500k | 112 ms | 117 ms | +4% | 1 ms | 356 ms | 58 MB |
| 1M | 143 ms | 128 ms | -11% | 0 ms | 595 ms | 116 MB |
| 10M | 533 ms | 598 ms | +12% | 1 ms | 4.33 s | 1.1 GB |
| 100M | 4.85 s | 4.86 s | +0% | 1 ms | 73.9 s | 11.3 GB |

**No consistent direction; all inside noise** — while the cost of in-memory is one-directional (74 s to
load 100M rows against ~1 ms to attach the file, plus gigabytes held). **Do not hold the master table
in memory**; the buffer manager already caches hot pages from a file-backed one.

### 3. APPEND vs LAND vs MATERIALISE

Producer leg excluded from all three (all pay it identically), 50k-row payloads.

| rows | payloads | A: append, ready | B: land bytes, ready | C: land + materialise | A disk | B disk | median append call |
|---|---|---|---|---|---|---|---|
| 1M | 20 | **2.05 s** | **14 ms** | 1.93 s | 112 MB | 32 MB | 91.7 ms |
| 10M | 200 | **20.2 s** | **108 ms** | 16.4 s | 1.1 GB | 317 MB | 91.9 ms |
| 100M | 2,000 | **4.3 min** | **6.15 s** | 55.1 s | 10.9 GB | 3.1 GB | 107.4 ms |

**Landing bytes is 188x faster at 10M and 42x at 100M**, and if a table IS wanted, building it once at
quiesce is **4.7x cheaper for a byte-identical result** (4.3 min against 55.1 s at 100M).

**Append cost is per ROW, not per statement** — 10M rows, only the slice size changing:

| payload | payloads | append ready | median call | **µs per row** | land ready |
|---|---|---|---|---|---|
| 10k | 1,000 | 24.8 s | 23.0 ms | **2.30** | 1.41 s |
| 50k | 200 | 20.2 s | 91.9 ms | **1.84** | 108 ms |
| 100k | 100 | 21.1 s | 191.7 ms | **1.92** | 418 ms |

Least-squares fit **~2.0 ms per statement + ~1.88 µs per row**, so at a 50k slice the per-statement
constant is **2%** — batching payloads into one call saves only that 2%, and the only way to avoid the
cost is not to decode the rows at all, which is what landing does.

#### BREAK-EVEN — the number that decides it

Aggregation-shaped battery (top-100 stripped; it is scan-bound and flatters any total).

| rows | option | extra cost, once | saved per query | **queries to break even** |
|---|---|---|---|---|
| 1M | append into a table | 2.04 s | 7.2 ms | **283** |
| 1M | land, materialise once | 1.92 s | 3.5 ms | **546** |
| 10M | append into a table | 20.1 s | 73.9 ms | **272** |
| 10M | land, materialise once | 16.3 s | 69.7 ms | **234** |
| 100M | append into a table | 4.2 min | 538.2 ms | **469** |
| 100M | land, materialise once | 48.9 s | 704.4 ms | **70** |

These jobs are append-dominated and aggregate rarely, so real Q is single/low-double digits. **Every
break-even here is far above it. Land the bytes.**

### 4. FILE LAYOUT — the row group is the unit, and "one big file" has no special property

10M rows, row groups **CENSUSED** (`parquet_file_metadata`; `count(DISTINCT row_group_id)` from
`pragma_storage_info` for native), never inferred.

| layout | files | row groups | rows/group | count(*) | µs/row group | cheap queries | full battery |
|---|---|---|---|---|---|---|---|
| as landed: 1,000 × 10k | 1,000 | 1,000 | 10,000 | 30.2 ms | 30 | 220 ms | 1.15 s |
| as landed: 200 × 50k | 200 | 200 | 50,000 | 7.1 ms | 35 | 57 ms | 723 ms |
| as landed: 100 × 100k | 100 | 100 | 100,000 | 4.1 ms | 41 | 43 ms | 742 ms |
| as landed: jagged 10k-100k | 178 | 178 | 56,179 | 6.8 ms | 38 | 56 ms | 770 ms |
| consolidated: ~123k rows/object | 82 | 82 | 121,951 | 3.4 ms | 41 | 41 ms | 746 ms |
| consolidated: ~500k rows/object | 20 | 100 | 100,000 | 4.1 ms | 41 | 40 ms | 714 ms |
| consolidated: ~2M rows/object | 5 | 85 | 117,647 | 3.8 ms | 44 | 42 ms | 751 ms |
| consolidated: ONE object | 1 | 81 | 123,456 | 2.2 ms | 27 | 45 ms | 755 ms |
| native TABLE | 1 | 84 | 119,047 | 0.2 ms | 3 | 15 ms | 539 ms |

**THE DECISIVE PAIR:** `100 × 100k` and `consolidated ~500k` both hold 100 row groups and both answer
`count(*)` in 4.1 ms, at 5x different file counts; per row group the cost holds at 26-44 µs across a
1,000x range of file count.

- **Only 10k slices are a real problem** (220 ms on cheap queries against 43 ms for 100k slices), and
  the realistic jagged mix is indistinguishable from tidy 100k slices; **one giant object is NOT better
  than twenty medium ones** — 82 / 20 / 5 / 1 objects land within a few percent of each other, because
  all of them reach ~81-100 row groups.

| how the single object is generated | cost |
|---|---|
| **stream through** — `COPY (SELECT * FROM read_parquet([...])) TO one.parquet` | **1.69 s** |
| stage first — `CREATE TABLE AS …`, then `COPY` it out | 4.35 s |
| native table from the same input (`CREATE TABLE AS` + CHECKPOINT) | 16.5 s |

**Stream it.** The third row **reverses the recorded claim** that a native table is cheaper than
rewriting Parquet — from a jagged input it is 9.7x MORE expensive, because it writes several times more
bytes; the recorded result came from 2,000 tiny payloads, where decode dominates.

### 5. LOCAL vs S3 — with the round trip PUT BACK IN, and the prediction that failed

Every earlier remote number was localhost minio at sub-millisecond RTT; `report-s3.mjs` injects a fixed
per-request delay with `lib/latency-proxy.mjs`, so **read these as "modelled at N ms", never "measured
on S3"**. Warm ms for `search: 2 predicates` (the shape spaces issues), caches ON:

| layout | objects | local | s3 @ 0 ms | s3 @ 20 ms | s3 @ 50 ms | s3 @ 100 ms |
|---|---|---|---|---|---|---|
| many payloads | 87 | 7 ms | 7 ms | 33 ms | 65 ms | 133 ms |
| consolidated ~2M | 3 | 5 ms | 4 ms | 27 ms | 59 ms | 127 ms |
| ONE object | 1 | 4 ms | 4 ms | 36 ms | 64 ms | 109 ms |

**THE PREDICTION IN OUR NOTES DID NOT HOLD:** the "2-5 requests per file × round trip" model predicts
**2.94 s** at 100 ms over 87 objects against a measured **133 ms**, over-predicting by ~**22x**, because
requests do not scale with objects (87 objects drew only **29.4** requests/query, statistics pruning
most before they are fetched) and the survivors are issued **concurrently**. **Latency raises the floor
for every layout at once**: consolidation is worth ~1.2x under it, not the 8-30x zero latency implied.

### 6. TRANSFORMS — the CHECKPOINT × PREFER_SQL cross

`report-transforms.mjs`, five chained field transforms forced with `sum(strlen(...))` because a
transform projection under `count(*)` is DISCARDED by the optimiser; `preferSql: false` forces the UDF.

| rows | storage | shape | all SQL | mixed (3 SQL + 2 UDF) | all UDF | UDF / SQL |
|---|---|---|---|---|---|---|
| 1M | UNCOMPRESSED | projection | **198 ms** | 584 ms | 1.40 s | 7.08x |
| 1M | UNCOMPRESSED | transform + filter + group | **95 ms** | 268 ms | 634 ms | 6.68x |
| 1M | COMPRESSED | projection | **200 ms** | 412 ms | 1.02 s | 5.10x |
| 1M | COMPRESSED | transform + filter + group | **97 ms** | 187 ms | 465 ms | 4.80x |
| 1M | parquet view | projection | **190 ms** | 412 ms | 1.01 s | 5.33x |
| 1M | parquet view | transform + filter + group | **110 ms** | 273 ms | 465 ms | 4.24x |
| 10M | UNCOMPRESSED | projection | **1.44 s** | 5.80 s | 13.8 s | 9.62x |
| 10M | UNCOMPRESSED | transform + filter + group | **646 ms** | 2.70 s | 6.35 s | 9.83x |
| 10M | COMPRESSED | projection | **1.40 s** | 4.29 s | 10.1 s | 7.25x |
| 10M | COMPRESSED | transform + filter + group | **655 ms** | 1.89 s | 4.65 s | 7.10x |
| 10M | parquet view | projection | **1.41 s** | 4.09 s | 10.1 s | 7.16x |
| 10M | parquet view | transform + filter + group | **663 ms** | 1.94 s | 4.62 s | 6.98x |

**Compression narrows the SQL advantage but does NOT collapse it** — 9.6x uncompressed against 7.3x
compressed at 10M, and the checkpoint helps only the UDF path (13.8 s → 10.1 s). **A single unpromoted
function dominates a query**: two UDFs among five cost **3.1x** the all-SQL pipeline, so the 17
functions still on the UDF path are not a rounding error.

### 7. `duckdb_memory()` IS NOT RESIDENT MEMORY — and the Parquet scan memory law

`sum(memory_usage_bytes) FROM duckdb_memory()` for an attached native table equalled the database FILE
SIZE to four decimal places at every scale from 100k to 100M — it is elastic buffer-manager residency,
**not a requirement, and not comparable across storage kinds**.

| case (100M rows) | memory_limit | duckdb_memory() | **peak process RSS** | outcome |
|---|---|---|---|---|
| native table | 24.0 GiB | 11.0 GB | **15.3 GB** | ok |
| native table | 8.0 GiB | 7.7 GB | **13.0 GB** | ok |
| native table | 4.0 GiB | 3.9 GB | **9.2 GB** | ok |
| parquet view | 24.0 GiB | 172 MB | **4.8 GB** | ok |
| parquet view | 4.0 GiB | 172 MB | **4.7 GB** | ok |
| parquet view | 1.0 GiB | 172 MB | **4.5 GB** | ok |

**Peak RSS is the figure to plan with** — by it the native/parquet gap is **3.2x** (15.3 vs 4.8 GB at
100M), **not the ~65x** an earlier draft published from `duckdb_memory()`. Parquet's RSS is FLAT from
24 GiB down to a 1 GiB limit.

Across a limit sweep at 10M, **14 of 15 shapes are fine on Parquet down to 128 MiB**; exactly one is
fragile — `SELECT * … ORDER BY "amount" DESC LIMIT 100`, a WIDE TOP-N, the only query that must
materialise **all 30 columns** for every matching row before the heap can discard.

| shape | pq 512MiB | native 512MiB | pq 256MiB | native 256MiB | pq 128MiB | native 128MiB |
|---|---|---|---|---|---|---|
| **wide top-N (`SELECT *`)** | **OOM** | ok | **OOM** | ok | **OOM** | OOM |
| agg high-card | ok | ok | ok | ok | **OOM** | ok |
| count distinct | ok | ok | ok | ok | **OOM** | ok |
| the other 12 shapes | ok | ok | ok | ok | ok | ok |

`temp_directory` defaults to `.tmp` with 90% of disk, so **spilling WAS available in every cell — "it
cannot spill" is NOT the explanation**; a native table keeps a large *evictable* reserve (1,127 MB of
`BASE_TABLE` at a 2 GiB limit) it drops the instant an operator needs room, while the Parquet view
caches almost nothing (`EXTERNAL_FILE_CACHE` peaked at **17 MB**).

| prediction | result |
|---|---|
| same threshold at 10M (280 MB file) and 100M (2,801 MB file)? | **YES** — ok at 1GiB, OOM at 512MiB, both |
| does projecting 3 columns instead of 30 remove it at 256MiB? | **YES** |
| do threads move it at 256MiB? | 14 OOM, 8 OOM, **4 ok**, 2 ok, 1 ok |

> **A Parquet scan's working set is THREADS × ROW-GROUP SIZE × COLUMNS PROJECTED and does NOT scale
> with the dataset** — at 14 threads / 122,880-row groups / 30 columns it needs between 512 MiB and
> 1 GiB, identically at 10M and 100M rows: a **fixed per-query reservation**.

**Mitigations, in order:** never emit `SELECT *` (project only the fields the query references, which
QPL knows); cap `threads` (4 suffices at 256 MiB); budget ~1 GiB headroom per concurrent wide query.
One job on a 64 GB worker cannot hit this; fifty concurrent ones can.

---

## Querying Parquet directly — the "no table" option

`tools/bench/parquet-query.mjs`. A `VIEW` over `read_parquet([...])` makes ingest **free**; the axis
here is FILE COUNT AT FIXED TOTAL ROWS, crossed with total rows and storage, on the 30-column corpus.

### THE ROW GROUP IS THE UNIT OF QUERY COST — ~32-45 µs each, and file count is not in the law

`ROW_GROUP_SIZE` is global per process, so two runs at 25M over the same file counts differ only in
row-group size, Run B forcing all three counts to hold exactly 5,000 groups (censused, not inferred).

| files × rows/file | row groups A → B | Run A (default) | Run B (forced 5k) |
|---|---|---|---|
| 100 × 250,000 | 300 → 5,000 | **12 ms** | **195 ms** |
| 1,000 × 25,000 | 1,000 → 5,000 | **33 ms** | **181 ms** |
| 5,000 × 5,000 | 5,000 → 5,000 | **160 ms** | **158 ms** |

**Hold row groups constant and cost goes flat across a 50x range of file count; re-chunk the same 100
files into more groups and they go 12 → 195 ms** — a 16x regression with file count untouched. DuckDB's
default row group is **122,880 rows** and `writeParquet` inherits it (250k → 3 groups, 25k → 1, 5k → 1).

| rows / files | rows per file | row groups | measured | **µs per row group** |
|---|---|---|---|---|
| 100k/100 · 1M/100 · 5M/100 | 1k · 10k · 50k | 100 each | 4.0 · 4.2 · 4.1 ms | 40-42 |
| **25M / 100** | **250,000** | **300** | **12.0 ms** | **40** |
| 1M/1,000 · 5M/1,000 · 25M/1,000 | 1k · 5k · 25k | 1,000 each | 33.2 · 33.2 · 33.6 ms | 33-34 |
| 5M/5,000 · 25M/5,000 | 1k · 5k | 5,000 each | 166.7 · 222.5 ms | 33 · 45 |
| **5M / 10** · **25M / 10** | 500k · 2.5M | 50 · 210 | 2.4 · 8.9 ms | 48 · 42 |
| 100k/10 · 1M/10 | 10k · 100k | 10 each | 0.8 ms | *floor* |
| **100M / 100** vs **100M / 1,000** | 1M vs 100k | **~900 vs 1,000** | **33 ms both** | 33-37 |
| 20M as 10k · 50k · 100k payloads | — | 2,000 · 400 · 200 | — | 33.4 · 33.0 · 33.8 |

An earlier "~32 µs per FILE" law is **retired**: under it the `100 files` column had to be flat, and 25M
cost 12.0 ms against 4.0-4.2 ms only because it held 3 groups per file instead of 1. Run A doubles as
the control for the recorded numbers: 12 ms (recorded 12), 33 ms (34), 160 ms (222 — the noisy cell).

**It is not only the thermometer.** At a constant 100 files, fragmenting the groups degrades the
searches spaces issues — `range + eq` 29 → 332 ms (**11.4x**), `2 predicates` 5 → 37 ms (7.4x), `text prefix`
9 → 61 ms, `IN list` 10 → 55 ms, `agg: 1 key` 29 → 88 ms, `project 1 col` 22 → 47 ms — while `agg:
quantiles` is unchanged at 556 ms: **metadata cost is most of a cheap query and a rounding error on an
expensive one.** Materialising heals it at 1.44x the build cost (9,239 → 13,304 ms), because
`CREATE TABLE AS` re-chunks into DuckDB's own row groups.

> **The design rule: size payloads to hold at least one full row group (~123k rows), and never lower
> `ROW_GROUP_SIZE` on the producer** — a large payload written with a small row group is exactly as slow
> as a swarm of tiny ones. `DuckFrame.writeParquet` sets only `FORMAT parquet, COMPRESSION zstd` and so
> inherits 122,880: correct today, and silently load-bearing.

**The first half is unreachable for the real producer**: `qpl-search-api` cannot return more than
**100,000 records** per slice (10k-50k common), so every payload it can emit under-fills the row group
— 81% at best, 8% at 10k.

### VIEW vs inline `read_parquet` vs a real TABLE

`tools/probe/view-vs-inline.mjs`, 2M rows, ratios against `inline read_parquet([...])`. A view binds an
extra `PROJECTION` node that the optimiser prunes to zero columns, so it costs nothing.

| variant | 10 files (200k rows each) | 500 files (4k rows each) |
|---|---|---|
| **`VIEW` over the list** | **0.94-1.00x** | **0.91-0.99x** |
| inline over a **glob** | 0.91-1.03x | 0.85-0.97x |
| **`VIEW` over the glob** | 0.94-1.02x | 0.85-1.00x |
| **real TABLE** | 0.18-0.87x | **0.02-0.15x** |

A VIEW is the same as inlining `read_parquet`, and a GLOB the same as an explicit path array even at
500 files — neither is a performance decision. The gap to a real table is entirely ROW-GROUP FILL:

| | rows/file | row groups | view `count(*)` | table | table's edge |
|---|---|---|---|---|---|
| 10 files | 200,000 | ~20 | 1.16 ms | 0.26 ms | 4.5x |
| 500 files | 4,000 | 500 | 17.26 ms | 0.31 ms | **56x** |

> **"A view matches a table on real queries" is TRUE ONLY AT GOOD ROW-GROUP FILL.** The 100M
> measurement behind that claim used 100 files of 1M rows — 9 full groups each — so quoting it for a
> worker writing 4k-row payloads would be wrong by a factor of 50.

### When materialising pays for itself

Build cost against the per-query penalty, averaged over the eight query shapes.

| rows / files | view penalty per query | table build (memory) | table build (file) | queries to pay back |
|---|---|---|---|---|
| 1M / 1,000 | 27.7 ms | 388 ms | 1,811 ms | 14 (memory) · 66 (file) |
| 5M / 5,000 | 146 ms | 1,193 ms | 2,640 ms | 9 · 18 |
| 25M / 5,000 | 152 ms | 4,309 ms | **13,552 ms** | 29 · **95** |

A file-backed table over 25M rows takes **13.6 s to build and 2.67 GB on disk** — 95 queries of runway
for a job that appends constantly and aggregates rarely.

### The real query battery at 100M rows

`count(*)` is a thermometer, not a workload; warm ms over 100M rows, 30 columns.

| query | view/100f | view/1000f | view/5000f | table (file) |
|---|---|---|---|---|
| `count(*)` [metadata only] | 33 | 33 | 163 | **2** |
| selective filter | 143 | 152 | 251 | **141** |
| broad filter | 29 | 42 | 163 | **10** |
| group by low card | 28 | 41 | 150 | **24** |
| group by high card | 380 | 374 | 521 | **400** |
| sort + limit 1k | 109 | 117 | 706 | **53** |
| project 1 col | 87 | 96 | 227 | **24** |
| project all cols | 56 | 76 | 172 | **84** |

**On real queries the gap is much smaller than `count(*)` suggests** — a selective filter is 143 ms on a
100-file view against 141 ms materialised, and `project all cols` is *faster* on the view. Materialising
100M rows costs **31.9 s and 11.3 GB on disk** file-backed (27.9 s in memory), and the in-memory table
then performs *worse* than the view on several shapes (`project all cols` 1,278 ms against 56 ms).

> ⚠ Payback against a file-backed table is recorded as **158 queries**, which does not reconcile with
> the table above — those eight shapes differ by ~127 ms in TOTAL, not per query. Treat 158 as
> unverified.

### S3 — localhost minio, where the defaults are the whole story

Same image and credentials `ts-scripts` uses (`minio/minio:RELEASE.2024-08-29T01-40-52Z`, port 49000),
round trip ~0, so this isolates protocol and CPU cost. **Every relevant `httpfs` setting is OFF by
default and turning them on changes the answer by an order of magnitude**; 1M rows over 100 files,
requests and bytes taken on an instrumented origin:

| query | default reqs/file | default bytes | **cached** reqs/file | **cached bytes** |
|---|---|---|---|---|
| `count(*)` | 2.0 | 40.7 MB | **0.7** | 13.4 MB |
| search, 2 predicates | 3.0 | 40.7 MB | **1.0** | **5 KB** |
| project 1 col | 3.0 | 44.3 MB | **1.0** | 3.5 MB |
| agg, 1 key + 3 aggs | 5.0 | 47.4 MB | **3.0** | 6.6 MB |
| project all cols | 2.0 | 41.1 MB | **0.0** | 381 KB |

| files (rows each) | local disk | s3 default | **s3 cache-all** |
|---|---|---|---|
| 100 (10k) | 3-4 ms | 16-17 ms | **5-6 ms** |
| 1,000 (1k) | 28-32 ms | 137-145, then FAILED | **42-49 ms** |
| 5,000 (200) | — | could not run | **188-216 ms** |

**Projection and predicate pushdown DO work over S3 — they just cannot work without the metadata
cache**: a two-predicate search goes from transferring the entire 40.7 MB corpus to **5 KB**. **Turn on
`enable_http_metadata_cache`, `parquet_metadata_cache` and `httpfs_connection_caching`** — S3 becomes
~1.5x local disk instead of 4-6x (`prefetch_all_parquet_files` adds nothing), and connection caching
also fixes an outright failure at 1,000 and 5,000 files.

## CONSOLIDATION vs NOT — the decision, measured

`tools/bench/consolidation-matrix.mjs`, 20M rows, three slice profiles, both origins. The architecture
fixes the choice: `qpl-search-api` is **stateless and distributed** (≤100k records per request,
consecutive slices may hit different instances) so **it cannot batch, ever**, and the qpl-worker is the
only stateful component. **Consolidation is NOT free** — landing is a byte copy with no decode, while
consolidating decodes N payloads, merges and re-encodes with zstd.

| land cost | slices | byte copy | → ≥123k rows | → ~2M rows |
|---|---|---|---|---|
| variable (10k-100k, avg 56k) | 354 | 0.37 s | 14.61 s (**39.3x**) | **4.40 s** (11.8x) |
| fixed 10k | 2,000 | 2.19 s | 13.89 s (6.3x) | **4.62 s** (2.1x) |
| fixed 100k | 200 | 0.99 s | 12.27 s (12.4x) | **4.61 s** (4.7x) |

| origin | profile | target | saves/query | extra land | **break-even** |
|---|---|---|---|---|---|
| local | variable | ≥123k | 48 ms | 14.2 s | 295 queries |
| local | variable | ~2M | 60 ms | 4.0 s | **67 queries** |
| local | fixed 10k | ≥123k | 529 ms | 11.7 s | 23 queries |
| local | **fixed 10k** | **~2M** | 521 ms | 2.4 s | **5 queries** |
| local | fixed 100k | ~2M | 3 ms | 3.6 s | 1,424 queries |
| s3 | variable | ~2M | 80 ms | 4.0 s | **51 queries** |
| s3 | fixed 10k | ~2M | 534 ms | 2.4 s | **5 queries** |
| s3 | fixed 100k | ≥123k | **-1 ms** | 11.3 s | **NEVER — slower** |

**Targeting ~2M rows per object is ~3x cheaper to build than targeting the 122,880-row group** (10
outputs against 100-154) and no worse to query, because **the cost is per COPY STATEMENT, not per row**.
At 100k slices consolidation buys nothing (6.1 → 7.1 ms `count(*)`, 13.9 → 12.1 ms selective), at 10k it
is **12x** on selective queries (141.8 → 12.0 ms), and the realistic `variable` profile sits at ~2x.

**The 60 ms is flattered by `top 100 rows`, which is 82% of that battery** — strip it and the variable
profile saves only 30.5 ms (91.9 → 61.4 ms), moving its break-even to **132 queries**. Consolidation
also shrinks the data, since zstd compresses better over larger blocks: fixed 10k 764.5 → **514.0 MB
(33%)**, variable 615.9 → 550.9 MB (11%), fixed 100k 584.2 → 561.5 MB (4%).

### The determination — DEFAULT IS **DO NOT CONSOLIDATE**

1. **Q under ~50 — which is what "aggregates rarely" means — DO NOT CONSOLIDATE**: 0.37 s per 20M to
   persist each payload as received, against 4.4 s to consolidate.
2. **Consolidate only when slices are consistently ~10k** (break-even 5 queries, 12x on selective
   queries, 33% smaller on disk), or when Q is known to exceed ~50-130; **at ~100k slices it is actively
   harmful**, one cell measuring **-1 ms/query** after paying 11.3 s.
3. **If consolidating, target ~2M rows, never ≥123k**, and buffer BEFORE the first write.

**The floor nobody can get under.** Consolidation cannot produce fewer than `total_rows / 122,880` row
groups, so at 1B rows that is **8,138 groups ≈ 285 ms of metadata on every query** however it is
arranged — the one argument for materialising that does not depend on query volume.

## Ingest levers

`tools/bench/append-ingest.mjs`, 2M rows as 40 × 50k Parquet payloads, 30-column corpus, 10 appends in
flight, **automatic checkpointing suppressed for every timed append**. Baseline is what ships (fresh
connection per append, BEGIN/COMMIT, one path per append): **in-memory 1,130 ms (565 ms/M), file-backed
1,783 ms (892 ms/M)**, and per-million cost is **flat in table size** — in-memory 607/626/625/627 ms/M,
file-backed 1,023/1,046/1,049/1,071 ms/M at 1M/2M/4M/8M already filled.

### THE DISCREPANCY, SETTLED (2026-08-24): it was automatic checkpointing, 78% of it

`scale-ingest.mjs` (1.48 s/M) never suppressed automatic checkpointing; `append-ingest.mjs` (892 ms/M)
did. At 5M rows, 100k payloads, 10 in flight, file-backed, two reps agreeing to within 0.1 s:

| | append | per million | disk | RSS | segments |
|---|---|---|---|---|---|
| auto-checkpoint **ARMED** (what ships) | 7.4 s | **1.48 s/M** | 596 MB | 5,141 MB | 5,954 (360 uncompressed) |
| auto-checkpoint **SUPPRESSED** | 5.1 s | **1.02 s/M** | 2,150 MB | 7,409 MB | 11,904 (all uncompressed) |

**Automatic checkpointing is 31% of append cost (1.45x) and 78% of the gap** — ~460 ms/M of the
~590 ms/M, the residual ~130 ms/M being payload shape. **Suppression is a speed/memory trade, not a
win**: 3.6x disk and 1.44x RSS carried until quiesce.

### The levers

| lever | in-memory | file-backed | verdict |
|---|---|---|---|
| **connection pool** vs fresh per append | 1,142 → 1,142 ms | 1,716 → 1,727 ms | **NO GAIN. Creating a DuckDB connection is free** |
| **ONE shared connection** | 2,817 ms | — | **2.5x SLOWER.** Concurrency across connections does real work |
| **drop BEGIN/COMMIT** | 1,107 → 1,093 ms (1.3%) | 1,810 → 1,716 ms (**5%**) | marginal; free to take on file |
| **batch 5 payloads/append** | 1,130 → 301 ms | 1,783 → 1,083 ms | the 3.74x/1.66x reading is **retired** — see the report's §3 |
| **batch 10 payloads/append** | 307 ms | 1,069 ms | same |
| **ALL 40 paths in one append** | 598 ms | 2,499 ms | it was the ORDERING, not the batching |
| **CTAS over all paths** | **561 ms** | 2,536 ms | best on memory, *worst* on file |
| **VIEW over read_parquet, no table** | **0 ms** | **1 ms** | free |

**The per-append overhead is NOT connection setup** — pooling removes exactly none of it and dropping
the transaction removes 1-5%, so the fixed cost lives inside `INSERT … SELECT FROM read_parquet`.

### `preserve_insertion_order` × shape × storage — and the winner inverts

40 × 50k payloads, **5-column** corpus, through the real `DuckFrame.append`, checkpointing suppressed.

| shape | memory, order ON | memory, order OFF | file, order ON | file, order OFF |
|---|---|---|---|---|
| 40 sequential appends | 457 ms | 451 ms | 626 ms | 618 ms |
| 40 concurrent appends | 229 ms | 224 ms | **386 ms** | 403 ms |
| ONE append, all 40 paths | 106 ms | **31 ms** | 444 ms | 546 ms |

**40 separate statements each order 50k rows, which is free; one statement must establish a total order
across every file, which is not.** In memory the fastest shape is one append with ordering off (31 ms),
but **on file that same combination is the SLOWEST (546 ms)** and concurrent per-payload appends win —
and the worker's table is file-backed at any size that matters. (Stacked without re-crossing storage:
in-memory pool + no txn + order off + one append is 183 ms / 91 ms/M / 6.16x, the same combination on
file 3,181 ms / 0.57x, WORSE than baseline; the right file recipe is pool + no transaction + groups of
10, 1,069 ms / 1.68x.)

> ⚠ **CONTRADICTION, unresolved.** This section concludes the cost is **per append CALL** (40 sequential
> = 11.3 ms each; one append of 40 paths = 31 ms total for 2M rows, 64.6M rows/s), while §3 of the
> 2026-08-25 report fits **~2.0 ms/statement + ~1.88 µs/row** and explicitly retires the per-statement
> reading. Different corpora (5-column here, 30-column there) and different storage, never crossed —
> **do not quote the per-call framing without re-running it.**

### Per-append cost, and the arithmetic for a long-running job

`DuckFrame.append` through the real code path, 50k-row payloads, transactions and connections as shipped.

| shape | 5-col, memory | 5-col, file | 30-col, memory | 30-col, file |
|---|---|---|---|---|
| one payload per append, sequential | 11.4 ms | 15.7 ms | ~28 ms | ~45 ms |
| one payload per append, concurrent | 5.7 ms | 9.9 ms | — | — |
| all payloads in ONE append | (31 ms total for 40) | (444 ms total) | — | — |

`DataFrame.appendAll` is **~0.2 ms, flat at any size** (structural sharing) against **DuckFrame's
~790 ms group-by advantage at 1M** (792.1 ms vs 1.7 ms) — so at 15-45 ms per append, **17 to 52 appends
consume one aggregation's worth of advantage**. What survives for append-dominated work: **joins** with
both sides co-located, **query cost** (100-400x on aggregations, only if the job aggregates), and **not
paying the append at all**.

### Checkpoint cadence during ingest

| cadence | in-memory | of which checkpoint | file-backed | of which checkpoint |
|---|---|---|---|---|
| never during ingest | **1,134 ms** | — | **1,798 ms** | 456 ms (one final) |
| every 10 payloads (500k rows) | 1,712 ms | 798 ms | 3,053 ms | 2,310 ms |
| every 5 payloads (250k rows) | 2,365 ms | 2,007 ms | 3,124 ms | 3,622 ms |

**Checkpointing every 250-500k rows doubles-to-triples ingest**, so the recorded "checkpoint every ~1M,
it never slows ingest" holds at 1M but does not generalise downward. **Never checkpoint during ingest IF
the peak footprint fits**, otherwise the coarsest cadence that stays inside the container (the 1B run's
`CHECKPOINT_EVERY=50M`) — and automatic checkpointing is armed by default at a 16 MiB threshold, so
"never" requires an explicit `SET checkpoint_threshold`.

## What the SQL promotions bought — MEASURED 2026-08-21

`PREFER_SQL` (`bench/comparison/lib/harness.js`) runs the same cases both ways, `RUNS=3`, DuckFrame only.

| case | UDF @1M | SQL @1M | gain | UDF @100k | SQL @100k | gain |
|---|---|---|---|---|---|---|
| `validation (isIP)` | 511.4 ms | **57.7 ms** | **8.87x** | 122.8 ms | 83.1 ms | 1.48x |
| `transform (array column)` | 433.0 ms | **57.9 ms** | **7.47x** | 113.9 ms | 82.7 ms | 1.38x |
| `transform (toUpperCase)` | 212.9 ms | **54.2 ms** | **3.93x** | 96.2 ms | 79.6 ms | 1.21x |
| `5 transforms + filter` | 925.2 ms | **310.1 ms** | **2.98x** | 116.8 ms | 121.7 ms | **flat** |
| `transform + filter -> ldjson` | 2,207.6 ms | 1,999.5 ms | 1.10x | 245.7 ms | 238.9 ms | flat |

- **The projected "18x" does not hold on the real corpus** — the comparable five-function pipeline is
  **2.98x at 1M**, so every "18x" elsewhere in these docs is withdrawn, and **the win needs scale**: at
  100k that pipeline is FLAT, ~80 ms of materialising 30 columns swamping 5 × 17 ms of UDF
  (`toUpperCase` at 100k saved 16.6 ms against an independent 100,000 × 171 ns = 17.1 ms).
- **Anything ending in a JS drain barely moves** (1.10x) and **the control holds** — all 18 cases the
  flag cannot touch came out flat. `toUpperCase`/`toLowerCase` dispatch as `sql+udf` (ASCII-guarded,
  the UDF still registered) so their gain scales with the column's ASCII fraction, and **5M was not
  measured** — the scale the old 18x claim was made at.

---

## DataFrame vs DuckFrame — the operation-by-operation comparison

All cells are **`DataFrame / DuckFrame`**, milliseconds unless suffixed `s`; the transform rows are the
UDF path on an uncompressed table (see READ FIRST).

| case | 1k | 5k | 10k | 50k | 100k | 500k | 1M | 3M | 5M |
|---|---|---|---|---|---|---|---|---|---|
| from records (+coercion) | 3.5/8.1 | 17.5/30.3 | 39.5/59.1 | 186.3/287.7 | 369.2/569.2 | 2.19s/2.93s | 5.19s/6.66s | 16.3s/22.5s | 30.9s/42.6s |
| read from the wire | 3.9/2.3 | 18.6/5.7 | 38.4/10.6 | 214.4/46.8 | 413.2/92.3 | 2.53s/74.2 | — | — | — |
| serialize for the wire | 4.4/1.9 | 20.7/4.8 | 42.8/9.3 | 226.1/42.3 | 470.3/76.9 | 2.84s/124.6 | OOM/157.9 | OOM/409.6 | OOM/933.5 |
| transform (toUpperCase) | 0.2/1.8 | 0.6/5.4 | 0.9/10.4 | 3.3/48.3 | 7.9/94.9 | 47.8/98.8 | 103.0/196.5 | 380.1/643.6 | 8.61s/1.39s |
| validation (isIP) | 0.7/2.1 | 2.7/7.2 | 5.0/13.6 | 25.1/60.9 | 50.9/120.3 | 262.5/241.9 | 527.2/491.5 | 1.81s/1.60s | 8.31s/2.84s |
| transform (array column) | 0.3/2.0 | 0.7/6.4 | 1.5/11.8 | 8.8/56.3 | 15.7/112.9 | 104.4/201.3 | 226.0/417.5 | 812.1/1.37s | 11.4s/2.55s |
| **5 transforms + filter** | 2.7/2.1 | 8.0/6.3 | 18.4/12.3 | 87.9/58.1 | 175.5/114.8 | 1.40s/427.5 | 3.75s/894.4 | 11.1s/2.76s | 67.0s/5.47s |
| filter (1 of 5 matches) | 0.9/0.2 | 2.9/0.3 | 5.8/0.3 | 26.8/0.4 | 64.8/0.6 | 513.7/0.8 | 1.43s/1.0 | 3.27s/11.5 | 26.7s/15.8 |
| sort (2 keys) | 4.6/1.8 | 23.2/5.6 | 46.9/10.9 | 252.6/57.4 | 504.7/103.4 | 2.89s/95.0 | 6.14s/112.1 | 26.8s/421.3 | 82.4s/1.65s |
| sort + limit (top 1,000) | 4.4/1.9 | 23.5/2.5 | 50.6/2.9 | 240.2/7.4 | 514.3/12.2 | 3.21s/12.0 | 6.37s/12.7 | 22.0s/27.0 | 73.1s/42.1 |
| dedup (all columns) | 9.6/5.5 | 52.4/7.8 | 104.7/11.3 | 546.4/42.2 | 1.17s/83.7 | 6.44s/296.3 | 16.9s/448.1 | — | — |
| page (limit 1,000) | 0.3/2.0 | 0.3/2.0 | 0.3/2.0 | 0.3/2.1 | 0.3/2.2 | 0.4/2.6 | 0.4/4.0 | — | — |
| output all rows to JS | 4.8/8.5 | 22.3/41.0 | 47.6/81.9 | 256.5/412.3 | 532.1/873.8 | 3.15s/5.50s | 7.39s/9.77s | — | — |

- **`from records` coerces all 30 fields on both sides**; `read from the wire` has each side read its
  OWN format (dfjson `deserialize` against `fromParquet` of Parquet+zstd, **zero coercion**) and must be
  forced with `materialize()` — `size()` is answered from the footer in under a millisecond, which an
  earlier version did, reporting a meaningless 5,939x.
- **DataFrame shares data structurally** on single-column transforms (one column swapped, the other 29
  reused, against all 30 materialised), so those rows compare semantics, not equal labour; `transform
  (array column)` is the only `ProcessMode.INDIVIDUAL_VALUES` case, the path 7 of 30 columns need.
- **The composed pipeline separates the two models** — one materialising pass per function against five
  expressions and a `WHERE` in one pass, 1.3x at 1k rising to 12.2x at 5M — and `sort + limit`, the
  shape a real search request has, widens to 1,735x because DuckDB plans a `TOP_N` heap with a dynamic
  filter that skips row groups where DataFrame sorts EVERY row then slices.
- Filters use each engine's own predicate language, forced with `count(*)`, sorts with `materialize()`;
  **DataFrame's `limit` is a `slice` view over the same vectors** (why `page` favours it).

> ⚠ **The DataFrame column jumps 10-20x between 3M and 5M on every transform row** (and on sort and
> filter) while DuckFrame scales smoothly; nothing in the record explains it and it is consistent with
> GC pressure near the 24 GB heap limit. **The 5M "faster" ratios rest on that discontinuity — do not
> quote them without re-measuring.**

### Output, aggregations, joins and the end-to-end lifecycle

| case | 1k | 5k | 10k | 50k | 100k | 500k | 1M |
|---|---|---|---|---|---|---|---|
| ldjson to a file | 8.1/8.0 | 34.7/27.8 | 75.6/51.2 | 357.0/260.5 | 735.0/519.1 | 4.29s/752.0 | 9.78s/1.06s |
| ldjson streamed | 6.4/5.9 | 32.4/24.4 | 68.3/48.3 | 357.1/231.4 | 767.3/482.6 | 4.24s/2.22s | 9.52s/4.44s |
| transform + filter → ldjson | 4.5/4.6 | 22.1/14.0 | 48.8/25.9 | 247.6/121.4 | 516.4/250.3 | 3.22s/1.06s | 7.49s/2.25s |
| group by 1 key + sum | 0.9/0.4 | 3.7/0.5 | 7.2/0.7 | 33.1/0.8 | 71.9/1.3 | 371.2/1.6 | 792.1/1.7 |
| group by 2 keys + 3 aggs | 1.1/1.0 | 4.9/0.8 | 9.5/0.9 | 47.0/1.6 | 102.6/2.5 | 531.5/3.1 | 1.15s/3.2 |
| combine 5 batches | 0.1/8.1 | 0.1/10.4 | 0.1/16.4 | 0.1/65.6 | 0.1/248.6 | 0.2/639.0 | 0.2/367.6 |
| combine 5 batches, concurrent | n/a/3.7 | n/a/5.1 | n/a/7.7 | n/a/27.6 | n/a/53.6 | n/a/263.0 | n/a/148.9 |
| inner join, 5 children/parent | n/a/0.4 | n/a/0.4 | n/a/0.6 | n/a/2.0 | n/a/3.3 | n/a/8.1 | n/a/13.6 |
| join + count per parent | n/a/0.5 | n/a/0.7 | n/a/0.9 | n/a/2.8 | n/a/6.2 | n/a/15.7 | n/a/22.9 |
| producer: records → wire | 7.9/15.4 | 39.6/40.7 | 78.3/73.9 | 444.3/353.9 | 864.1/693.4 | 5.61s/3.52s | 11.9s/6.80s |
| worker: assemble payloads | 4.6/3.1 | 20.1/5.1 | 39.7/7.5 | 206.4/28.4 | 424.5/53.9 | 2.75s/262.8 | 10.1s/223.9 |
| worker: filter+agg+sort | 3.1/0.8 | 12.4/0.7 | 21.9/0.8 | 107.0/1.3 | 221.7/2.0 | 1.69s/2.5 | 4.61s/4.3 |

- **The ldjson bytes are identical** (all 500 sampled lines checked against DataFrame) even though
  DuckDB's native JSON is not — Dates, a `Long` past `MAX_SAFE_INTEGER`, `"f": null` where DataFrame
  omits the key, `5.0` for an integral float and a bare `Infinity` are each corrected in SQL by the
  export projection, pinned in `test/duck-frame/export-json-spec.ts`, at **7% of the projection**.
- On the file path DataFrame's `toJSON` builds an array of every row first (why it runs out of heap
  there) against a single `COPY`, its lines batched into 1 MB writes so this is not one syscall per row.
- **DataFrame has no join primitive at all**, which is the reason this project exists — spaces emulates
  one with a child search per parent row behind a 10,000-entry LRU that high cardinality defeats.
  `join + count per parent` groups by the PARENT key, since joining two 100k tables on a 5-value column
  is a 2-billion-row cartesian product.
- `combine 5 batches` is `DataFrame.appendAll` over 5 prebuilt frames (offsets only) against 5
  `append({ parquet })` calls that insert into a real, immediately queryable table; the lifecycle rows
  are the only ones measuring the system rather than an operation.

> **Gap, noted 2026-08-21.** A third append case, `combine 5 batches, one append`
> (`append({ parquet: [paths] })`, one `INSERT … BY NAME`), was added after this sweep and has **no
> numbers here at all**; `tools/bench/append-ingest.mjs` measures that shape at ~4x a sequential loop
> (78-90 ms against ~350 ms over 20 payloads at 1M).

---

## Storage formats — what DuckDB's native format is

`tools/bench/storage-formats.mjs`, one file per format, all copied from one generated native table. Its
whole-battery comparison is superseded by §1 of the 2026-08-25 report; for the record, its 15-query warm
totals put parquet+zstd at **1.26x native at 5M and 1.41x at 25M**.

| DuckDB v1.5.5 native, read off the build | |
|---|---|
| file | one database file in **256 KiB blocks** (`default_block_size` 262144), backward compatible to `storage_compatibility_version` v0.10.2 |
| row groups | **122,880 rows** — the *same* constant as its default Parquet row group, which is why the row-group law transfers between the two |
| compression | per-segment, chosen automatically per column; at 25M the corpus picked Constant 10,500 · BitPacking 7,250 · FSST 3,860 · ALP 3,543 · Dictionary 2,000 · ALPRD 750 · RLE 500 · Uncompressed 500, with **1.7% staying Uncompressed** at every scale |
| what Parquet has none of | min/max **zone maps** per row group, ART indexes where declared, MVCC and a WAL — the structural reason native wins on cheap queries |
| `read_duckdb()` | indistinguishable from `ATTACH` (1.00x) |

**At scale, the SMALLEST Parquet file is also the FASTEST to load** — materialising into a native
table, per source format:

| source | @5M | @25M | rows/s @25M |
|---|---|---|---|
| **parquet zstd** | 0.33 s | **1.89 s** | **13.3M** |
| parquet snappy | 0.32 s | 2.73 s | 9.2M |
| parquet uncompressed | 0.36 s | 3.85 s | 6.5M |
| Arrow IPC | 2.81 s | 15.16 s | 1.6M |

At 5M the three codecs are indistinguishable, but **at 25M zstd is 2x faster than uncompressed**,
because I/O dominates decode once the file stops fitting in cache: **the heavier the compression, the
faster the load**, so there is no tension between the wire format and the ingest path.

**Arrow IPC's failure is instructive**: `count(*)` costs **2,237 ms** against Parquet's 5.3 ms and every
query sits on a ~2.1-3.2 s floor, because **it carries no row-group statistics DuckDB can use, so every
query is a full scan** — also why the penalty doubled from 15x to 30x between 5M and 25M while `project
all cols LIMIT 5000` stayed at 54 ms. State it as "**`read_arrow` on this build is not competitive**";
`iceberg`, `delta`, `avro` and `excel` are **not installed on this build** and need network to fetch.

## NATIVE AT ITS BEST — the fair fight, with an index and a sort

`tools/bench/native-advantages.mjs`. The format battery gave native **none of what makes it a database**
— no ART index (native-only; Parquet cannot have one at any price), a scattered corpus so zone maps
prune nothing on either side, and no point lookup. 5M rows, warm ms, median of 4 repeats after the first:

| query | matched | native sort+index | parquet sorted | |
|---|---|---|---|---|
| point lookup (50 rows) | 50 | **1.13** | 9.07 | **8.1x** |
| equality, high-card col | 49 | **0.22** | 1.44 | **6.6x** |
| wide range on sort key | 60% | **1.16** | 3.44 | 3.0x |
| count(*) | — | **0.32** | 0.88 | 2.8x |
| 2 predicates (low card) | 10% | **1.79** | 4.40 | 2.5x |
| narrow range on sort key | 0.1% | **0.75** | 1.67 | 2.2x |
| agg: high-card group | — | **1.78** | 3.21 | 1.8x |

**Native's real advantage is 1.8-8.1x on selective work** (1.2-3.2x plain against plain), so the
earlier 1.41x understated it by hiding the distribution inside an average.

| finding | measured |
|---|---|
| **an index helps equality and nothing else** | 3.61x on a point lookup, 6.43x on high-card equality, **1.0x on every range, aggregate and low-cardinality predicate** |
| **sorting is the bigger lever and is NOT native-only** | 2.3-4.6x on ranges over the sort key, and it helps Parquet as much as native (narrow range: parquet **4.64x** against native's 3.79x), because row-group min/max statistics exist in both. The index is the only exclusive advantage |
| **sorting makes some queries WORSE, and costs disk** | 0.76x native / 0.87x parquet on the low-cardinality two-predicate filter, 0.78x on the point lookup; parquet+zstd 140.2 → 231.0 MB (**+65%**). **It optimises ONE column's locality by destroying every other column's** — the caution the recorded "sort-on-ingest for zonemap pruning (16 s → 1.6 s)" item does not carry |
| build cost per 5M rows | rebuild-sorted **1.5 s**, index on `_key` **1.0 s**, index on `name` **2.2 s**; the file holding two indexes *and* a sorted copy reached 1,364 MB against 563 MB plain — a second full copy of the data, so **not** a clean index-size figure |
| three isolation-run cells are **ARTEFACTS** | 15.68x and 30.73x on `name` equality, 11.23x on a `name` group-by — `name` and `amount` are both functions of the same random `r`, so sorting by one perfectly sorts the other |

**The determination.** Native is meaningfully faster where it counts and an index is a capability
Parquet structurally cannot match, **but the decision is settled on workload, not format** (§3 above):
if native is ever chosen, sort deliberately and index narrowly.

> **A methodology rule that cost three benches.** The shared battery filtered `category = 'cat-3'` and an
> `IN` list while the generator produces `alpha/beta/gamma/delta/epsilon` — both matched **zero rows, and
> always had** — and this bench's own first draft did it twice more (`amount BETWEEN 500000 AND 501000`
> on a 0-1000 domain; a point lookup on a `_key` that never exists, only 100,000 distinct keys existing
> because `i` restarts every generation chunk). **Every bench that filters must PRINT WHAT ITS PREDICATES
> MATCH before it times anything.** The two `search:` rows in `parquet-query.mjs` and
> `storage-formats.mjs` therefore measure less than their labels claim, though their conclusions hold,
> both sides having run the identical query.

## Scale — one table at 100M, 244M and 1B rows

DuckFrame only, measured 2026-08-20 on darwin / 14 cores / 36 GB with `tools/bench/scale-ingest.mjs` (the
real worker ingest path) and `tools/bench/billion.mjs`. **The engine comparison caps at 5M because that
is the harness's configured ceiling**, not because DataFrame stops there — exactly one case OOMs
(`serialize for the wire`, at 1M/3M/5M) while every other completed at 3M and 5M: a dfjson
serialization limit, not a capacity limit.

> **The two runs use DIFFERENT corpora, and the per-row disk figures look contradictory until you
> notice.** `scale-ingest.mjs` streams the **30-column** corpus at **115.4 MiB per million rows**
> (least-squares over 244 checkpoint samples) → ~113 GiB for 1B; `billion.mjs` builds a **12-column**
> table at **31.9 MiB per million** → 31.1 GiB for 1B. Both are right — **never quote a per-row size
> without the schema.**

### Ingest, the real worker path

Streamed as 100k Parquet payloads, 10 appends in flight, checkpointing every 1M, file-backed. The 100M
run completed; a 1B attempt through this path stopped at **244M rows with no error at all**.

| phase, at 100M | time | rate | note |
|---|---|---|---|
| generate (JavaScript) | 81.0 s | 1.23M rec/s | **not ingest** — subtract it; 8% of wall |
| produce (`writeParquet`) | 687.3 s | 145k rows/s | the api-server tier, a DIFFERENT machine |
| **append (worker, one table)** | **147.9 s** | **676k rows/s** | **1.48 s per million**, of which **31% is automatic checkpointing** (2026-08-24) |
| checkpoint (100 of them) | 72.3 s | ~723 ms each | |
| wall clock | 1,008 s | | 16.8 minutes; phases overlap |

Queries on the finished **100M** table: `count(*)` 1 ms, filter + count 12 ms, group by 1 key 14 ms,
sort + limit 1,000 178 ms, `count(DISTINCT name)` 274 ms.

**Sizing rules from the 244M run.** Disk is dead linear — 116.0, 115.8, 115.6, 115.5 MiB per million
across the deciles — so plan from it; **RAM is not**, RSS wandering between 3.8 and 12.7 GiB with the two
defensible fits disagreeing by 1.8x on the 1B projection (10.6 MiB/million → 18.0 GiB versus
28.9 MiB/million over the last 100M → ~33 GiB). Checkpoint cost stayed nearly flat while the table grew
24x (706 ms at 20M, 864 ms at 244M): a per-CHECKPOINT, not per-table, cost model.

**`memory_limit` does NOT bound process RSS**: with the limit verified applied at 3.7 GiB, a 20M ingest
still reached **7,240 MB**, the same as the unlimited run at that point, because Node's heap, the Parquet
writer and DuckDB's non-buffer allocations sit outside it — **do not size a container from it**; it ran ~2x over here.

### A billion rows

`billion.mjs`, one file-backed table, 12 columns, `memory_limit 24GiB`, 14 threads, built server-side
with `range()` because the JavaScript producer path is ~145k rows/s and would take ~114 minutes.
Cardinality spans six orders of magnitude on purpose: `id` unique, `session_id` 100M, `user_id` 10M,
`name` 1M, `city` 50k, `category` 500, `country` 200, `status` 8.

| | |
|---|---|
| build | **686.2 s** (1.46M rows/s), of which CHECKPOINT 0.7 s |
| disk | **31.12 GiB** = 31.9 MiB per million, dead linear across all 20 batches |
| peak RSS | **17.97 GiB** during build, 22.02 GiB overall |
| streaming the whole table out | **1B rows in 12.7 s = 78.5M rows/s**, peak RSS 11.5 GiB |

**RSS sawtooths and the buffer manager does reclaim** — 18.4 GiB at 550M, then 10.3, 7.1, 3.7, finishing
at 4.7 GiB with the table complete. **Size a container from the peak**, ~18 GiB against a 24 GiB limit.

> **A generator that does not SCATTER makes the size figure fiction.** `i % 500` produces a periodic run
> that RLE and dictionary encoding compress unrealistically well: at 20M rows, **16.6 MiB per million
> cyclic versus 31.9 MiB per million** with `hash(i * k) % N` at the same distinctness. Every figure here
> uses the scattered form.

| query on the finished billion-row table | ms | | ms |
|---|---|---|---|
| `count(*)` | 16 | group by `status` (8 keys) | 529 |
| count WHERE selective (`user_id = ?`) | 119 | group by `category` (500) | 469 |
| count WHERE numeric range | 109 | group by `country` (200) | 694 |
| count WHERE date range (one month) | 198 | group by `city` (50k) | 2,555 |
| count WHERE 8-way key | 420 | group by `user_id` (10M) | 7,999 |
| top 100 by amount | 107 | **group by `name` (1M)** | **13,948** |
| `sum + avg + min + max` | 1,171 | group by 2 keys + 3 aggs | 2,166 |
| month histogram | 1,351 | `count(DISTINCT user_id)` exact | 6,047 |
| **filter + group + order (dashboard)** | **2,164** | `approx_count_distinct(user_id)` | **355** |
| `median(amount)` | 24,526 | `quantile_cont([0.5, 0.9, 0.99])` | 29,418 |

**Filters and low-cardinality group-bys are sub-second on a billion rows** and the dashboard shape —
filter by month, filter by status, group, order, limit — is **2.2 s**, while **group-by cost tracks the
KEY COUNT, not the row count** (8 keys 529 ms → 1M keys 13.9 s). **`approx_count_distinct` is 17x faster
than exact** and should be the default wherever an estimate will do; **exact quantiles are the outlier at
24-29 s** because they materialise.

### Streaming a billion-row join

`tools/bench/join-stream.mjs`, two `range()` tables, drained chunk by chunk with RSS sampled in flight.

| N × N | key | distinct | out rows | ms | rows/s | RSS before → peak |
|---|---|---|---|---|---|---|
| 10M | unique | 10M | 10M | 424 | 23.6M/s | 227 → 714 MB |
| 10M | mid | 1M | 100M | 3,541 | 28.2M/s | 714 → 1,123 MB |
| 100M | unique | 100M | 100M | 4,486 | 22.3M/s | 897 → 4,592 MB |

**Streaming the OUTPUT is not the constraint** — emitting 100M rows held peak RSS at 1.1 GB and
throughput is ~22-28M rows/s regardless of result size — while **the hash BUILD side is what scales**
(714 MB → 4,592 MB for 10x the input, slightly sublinear), extrapolating to ~30-46 GB at 1B × 1B, above
this 36 GB box, so it would spill to `temp_directory`.

**Key cardinality decides viability far more than table size**, a join on a key with C distinct values
emitting about N²/C rows:

| 1B × 1B on… | rows out | at 22M rows/s |
|---|---|---|
| a UNIQUE key | 1e9 | **~45 seconds** |
| a 1M-cardinality key | 1e12 | ~12.6 hours |
| a 1k-cardinality key | 1e15 | not a thing |

## Reproducing this

```bash
cd packages/data-mate && pnpm build
OUT=/tmp/perf.md node --max-old-space-size=16384 bench/comparison/run.js
```

`SCALES=1000,10000` for a quick pass, `RUNS=5` for more samples. **Always set `OUT`** — it defaults to
this file; the heap flag matters, because with the default heap DataFrame OOMs far earlier than it needs
to, which would overstate the difference.
