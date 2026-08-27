# DataFrame vs DuckFrame — performance comparison

Both engines are given **identical records** from a seeded generator, and every case is checked to have produced the same number of rows on both sides, so "faster" cannot mean "did less".

> ## TWO STALENESS WARNINGS — both about the TRANSFORM numbers only
>
> **1. Every transform/validation number here was measured with all 205 functions on the JS UDF
> path.** As of 2026-08-21, **188 of 205 run as native SQL instead**, and a UDF costs a flat
> ~171 ns per value that those emissions remove outright. So the transform sections below are a
> LOWER BOUND on the DuckFrame side. **The margin has now been measured - see §What the SQL
> promotions bought: 3-9x on single-function cases at 1M, 2.98x on the five-function pipeline, and
> flat at 100k.** Multiply the transform sections accordingly rather than re-reading them as
> current.
>
> **What is NOT affected:** frame creation, appending batches, filters, sorts, paging, output,
> group-bys and joins. None of them involve a UDF, so those numbers stand as measured.
>
> **2. Measured on an UNCOMPRESSED in-memory master table (2026-08-18 finding).** DuckDB only compresses
> at `CHECKPOINT`, and the harness never checkpoints. That makes every transform/UDF number here the
> worst case for repetitive columns - a checkpointed table runs a UDF once per distinct value rather
> than once per row (measured 104x on a low-cardinality column, 3.9x on a 30-column transform), and
> uses 5.4x less memory. High-cardinality columns are unaffected. **Re-run after adding the checkpoint
> before quoting these numbers externally.** See `HANDOFF.md` §THE 2026-08-18 MEASUREMENTS.

## THE 2026-08-25 REPORT MEASUREMENTS — READ THIS SECTION FIRST

Run to answer five questions for a boss-facing report (published artifact:
`https://claude.ai/code/artifact/58c8f09f-3cda-4b30-a886-a48a570e1d6a`, rebuilt by
`tools/report/build-report.mjs` from `tools/results/*.json`).

**Five benches, one corpus, run strictly serially:** `tools/bench/report-ladder.mjs` (formats x
scale, and memory-vs-disk), `report-ingest.mjs` (append vs land vs materialise, with break-even),
`report-consolidation.mjs` (file layout, row groups censused), `report-transforms.mjs`
(SQL vs mixed vs UDF, crossed with compression), `report-s3.mjs` (local vs S3 with modelled
latency). Plus three probes: `probe/memory-metric.mjs`, `probe/parquet-memory-limits.mjs`,
`probe/parquet-scan-law.mjs`.

**Envelope:** `memory_limit = 24GiB`, deliberately BELOW this 36 GB box. The shared `WORKER`
constant is 48 GiB, which is ABOVE physical memory here - set above the real cap DuckDB never
spills and the kernel kills the process. **Do not use `WORKER` unchanged on this machine.**

**FOUR RECORDED CLAIMS DID NOT SURVIVE.** Each is corrected in place below and at its original
site.

| recorded claim | status |
|---|---|
| "append cost is per STATEMENT, not per row" | **WRONG.** Fitted: ~2.0 ms/statement + ~1.88 us/row. At a 50k slice the constant is 2% |
| "batching 5-10 payloads per append is the real lever (3.74x)" | **FOLLOWS FROM THE ABOVE AND IS WRONG.** Batching saves only the 2% constant |
| "writing a native table costs LESS than rewriting Parquet" | **REVERSED at a jagged input** - 16.5 s vs 1.69 s. True only from many tiny payloads |
| "real S3 latency could collapse every break-even in favour of consolidation" | **DID NOT HOLD.** A request-count model over-predicts by ~22x |

---

### 1. FORMATS x SCALE - 100k to 100M, the full 15-query battery

Warm battery total, and the ratio against a native table on the identical corpus. Every non-native
format is a `COPY` of the native table, so no generator variance can reach a number.

| format | 100k | 500k | 1M | 10M | 100M | MB/million |
|---|---|---|---|---|---|---|
| **native table (file)** | 86 ms | 112 ms | 143 ms | 533 ms | 4.85 s | 112.6 |
| **parquet + zstd** | 117 ms · 1.37x | 142 ms · 1.27x | 165 ms · 1.15x | 768 ms · 1.44x | 6.69 s · 1.38x | 28.0 |
| **parquet + snappy** | 105 ms · 1.23x | 137 ms · 1.23x | 155 ms · 1.08x | 774 ms · 1.45x | 6.12 s · 1.26x | 68.1 |
| **parquet, uncompressed** | 92 ms · 1.08x | 124 ms · 1.10x | 143 ms · 1.00x | — | — | 221.4 |
| **arrow IPC** | 176 ms · 2.05x | 633 ms · 5.65x | 1.16 s · 8.09x | — | — | 442.5 |
| **CSV** | 1.48 s · 17.32x | 1.92 s · 17.14x | 2.36 s · 16.46x | — | — | 540.5 |
| **NDJSON** | 1.48 s · 17.24x | 1.89 s · 16.83x | 2.35 s · 16.40x | — | — | 800.9 |

- **Parquet+zstd never leaves the 1.15-1.44x band** across three orders of magnitude, at **25% of
  native's disk**. That stability is the plannable part.
- The penalty lands on CHEAP queries (footer reading); expensive shapes converge. At 100M
  `agg: quantiles` is 2.53 s on Parquet against 2.62 s on the table.
- **Arrow IPC is decisively out** and gets worse with scale (2.1x at 100k, 8.1x at 1M); CSV/NDJSON
  ~17x. Arrow was not run above 1M - already settled, and 44 GB to re-prove.

### 2. MEMORY vs DISK - there is NO query advantage to an in-memory table

The SAME data, both checkpointed (or this compares compression against storage).

| rows | table on disk | table in memory | difference | attach/load: disk | load: memory | RAM held |
|---|---|---|---|---|---|---|
| 100k | 86 ms | 86 ms | +1% | 0 ms | 195 ms | 12 MB |
| 500k | 112 ms | 117 ms | +4% | 1 ms | 356 ms | 58 MB |
| 1M | 143 ms | 128 ms | -11% | 0 ms | 595 ms | 116 MB |
| 10M | 533 ms | 598 ms | +12% | 1 ms | 4.33 s | 1.1 GB |
| 100M | 4.85 s | 4.86 s | +0% | 1 ms | 73.9 s | 11.3 GB |

**No consistent direction; all inside noise.** What in-memory costs is one-directional: 74 s to load
100M rows against ~1 ms to attach the file, plus gigabytes held. DuckDB's buffer manager already
caches hot pages from a file-backed table. **Do not hold the master table in memory.**

### 3. APPEND vs LAND vs MATERIALISE - and the per-row correction

Producer leg EXCLUDED from all three (all three pay it identically). 50k-row payloads.

| rows | payloads | A: append, ready | B: land bytes, ready | C: land + materialise | A disk | B disk | median append call |
|---|---|---|---|---|---|---|---|
| 1M | 20 | **2.05 s** | **14 ms** | 1.93 s | 112 MB | 32 MB | 91.7 ms |
| 10M | 200 | **20.2 s** | **108 ms** | 16.4 s | 1.1 GB | 317 MB | 91.9 ms |
| 100M | 2,000 | **4.3 min** | **6.15 s** | 55.1 s | 10.9 GB | 3.1 GB | 107.4 ms |

**Landing bytes is 188x faster at 10M and 42x at 100M.** And if a table IS wanted, build it ONCE at
quiesce: at 100M, appending is 4.3 min against 55.1 s to land-then-materialise - **4.7x cheaper for
a byte-identical result.**

#### THE CORRECTION: append cost is per ROW, not per statement

10M rows, only the slice size changes:

| payload | payloads | append ready | median call | **us per row** | land ready |
|---|---|---|---|---|---|
| 10k | 1,000 | 24.8 s | 23.0 ms | **2.30** | 1.41 s |
| 50k | 200 | 20.2 s | 91.9 ms | **1.84** | 108 ms |
| 100k | 100 | 21.1 s | 191.7 ms | **1.92** | 418 ms |

Least-squares fit: **~2.0 ms per statement + ~1.88 us per row.** At a 50k slice the per-statement
constant is **2%** of the cost. **This inverts the recorded advice**: if cost were per statement,
batching payloads into one call would be a large win; because it is per row, batching saves only the
2%, and the only way to avoid the cost is not to decode the rows at all - which is what landing does.

#### BREAK-EVEN - the number that decides it

Aggregation-shaped battery (top-100 stripped; it is scan-bound and flatters any total).

| rows | option | extra cost, once | saved per query | **queries to break even** |
|---|---|---|---|---|
| 1M | append into a table | 2.04 s | 7.2 ms | **283** |
| 1M | land, materialise once | 1.92 s | 3.5 ms | **546** |
| 10M | append into a table | 20.1 s | 73.9 ms | **272** |
| 10M | land, materialise once | 16.3 s | 69.7 ms | **234** |
| 100M | append into a table | 4.2 min | 538.2 ms | **469** |
| 100M | land, materialise once | 48.9 s | 704.4 ms | **70** |

These jobs are documented as append-dominated and aggregating rarely, so real Q is single/low-double
digits. **Every break-even here is far above it. Land the bytes.**

### 4. FILE LAYOUT - the row group is the unit, and "one big file" has no special property

10M rows. **Row groups CENSUSED** (`parquet_file_metadata`; `count(DISTINCT row_group_id)` from
`pragma_storage_info` for native) - never inferred.

| layout | files | row groups | rows/group | count(*) | us/row group | cheap queries | full battery |
|---|---|---|---|---|---|---|---|
| as landed: 1,000 × 10k | 1,000 | 1,000 | 10,000 | 30.2 ms | 30 | 220 ms | 1.15 s |
| as landed: 200 × 50k | 200 | 200 | 50,000 | 7.1 ms | 35 | 57 ms | 723 ms |
| as landed: 100 × 100k | 100 | 100 | 100,000 | 4.1 ms | 41 | 43 ms | 742 ms |
| as landed: jagged 10k–100k | 178 | 178 | 56,179 | 6.8 ms | 38 | 56 ms | 770 ms |
| consolidated: ~123k rows/object | 82 | 82 | 121,951 | 3.4 ms | 41 | 41 ms | 746 ms |
| consolidated: ~500k rows/object | 20 | 100 | 100,000 | 4.1 ms | 41 | 40 ms | 714 ms |
| consolidated: ~2M rows/object | 5 | 85 | 117,647 | 3.8 ms | 44 | 42 ms | 751 ms |
| consolidated: ONE object | 1 | 81 | 123,456 | 2.2 ms | 27 | 45 ms | 755 ms |
| native TABLE | 1 | 84 | 119,047 | 0.2 ms | 3 | 15 ms | 539 ms |

**THE DECISIVE PAIR.** `as landed: 100 × 100k` holds 100 files / 100 groups and answers
`count(*)` in 4.1 ms. `consolidated: ~500k rows/object` holds
20 files / 100 groups and answers it in
4.1 ms. **Same groups, 5x the file count,
identical cost.** Per row group the cost holds at 26-44 us across a 1,000x range of file count.

- **Only 10k slices are a real problem** (220 ms on cheap queries against 43 ms for 100k slices).
- **The realistic jagged mix is already fine** - indistinguishable from tidy 100k slices.
- **One giant object is NOT better than twenty medium ones.** 82 / 20 / 5 / 1 objects all land within
  a few percent, because they all reach ~81-100 row groups.

**A "us per FILE" column published earlier was WRONG and has been retired** - it is degenerate for a
single file (it is just the query time) and it divides by the wrong thing everywhere else.

#### How the single object is generated

| route | cost |
|---|---|
| **stream through** - `COPY (SELECT * FROM read_parquet([...])) TO one.parquet` | **1.69 s** |
| stage first - `CREATE TABLE AS ...`, then `COPY` it out | 4.35 s |
| native table from the same input (`CREATE TABLE AS` + CHECKPOINT) | 16.5 s |

**Stream it.** And note the third row **reverses the recorded claim** that a native table is cheaper
than rewriting Parquet: from a jagged input it is 9.7x MORE expensive, because it writes several
times more bytes. The recorded result came from 2,000 tiny payloads, where decode dominates.

> **A number deliberately NOT published:** this bench also timed each consolidation target as it
> built, using `LIMIT n OFFSET k` per batch - which rescans from the start and is quadratic in batch
> count. It produced non-monotonic nonsense (12.0 s for 82 objects, 3.5 s for 20, 14.6 s for 5).
> That measures the loop, not consolidation. Measuring per-target build cost honestly needs a
> single-pass partitioned write and has not been done.

### 5. LOCAL vs S3 - with the round trip PUT BACK IN, and the prediction that failed

Every earlier remote number was localhost minio, sub-millisecond RTT - which silently sets the term
that dominates real S3 to ZERO. `report-s3.mjs` puts it back with `lib/latency-proxy.mjs`, a proxy
that injects a fixed delay per request. **Read as "modelled at N ms", never "measured on S3".**

Warm ms for `search: 2 predicates` (the shape spaces issues), caches ON:

| layout | objects | local | s3 @ 0 ms | s3 @ 20 ms | s3 @ 50 ms | s3 @ 100 ms |
|---|---|---|---|---|---|---|
| many payloads | 87 | 7 ms | 7 ms | 33 ms | 65 ms | 133 ms |
| consolidated ~2M | 3 | 5 ms | 4 ms | 27 ms | 59 ms | 127 ms |
| ONE object | 1 | 4 ms | 4 ms | 36 ms | 64 ms | 109 ms |

**THE PREDICTION IN OUR NOTES DID NOT HOLD.** The docs flag real S3 latency as the term that could
*"collapse every break-even in favour of consolidation"*, reasoning 2-5 requests per file x round
trip. At 100 ms and 87 objects that model predicts **2.94 s**; measured, the same query costs
**133 ms** - the model over-predicts by ~**22x**.

Two reasons, both in the data: requests do NOT scale with objects (87 objects drew only
**29.4** requests/query, because row-group statistics prune most objects before they are
fetched), and the surviving requests are issued **concurrently**, so the round trip is paid in
parallel rather than in series.

**Latency raises the floor for every layout at once rather than separating them.** Consolidation is
worth ~1.2x under latency here - real, but nothing like the 8-30x the zero-latency numbers implied,
and **not enough on its own to overturn a break-even.** Still turn the three httpfs caches on
(`enable_http_metadata_cache`, `parquet_metadata_cache`, `httpfs_connection_caching`): ~2x on
metadata-bound queries at low latency, free, and they previously fixed outright connection failures
at high file counts.

### 6. TRANSFORMS - the CHECKPOINT x PREFER_SQL cross, which was the #1 unrun item

`report-transforms.mjs`. Five chained field transforms, forced with `sum(strlen(...))` (a transform
projection under `count(*)` is DISCARDED by the optimiser). `preferSql: false` forces the UDF path.

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

**ANSWERED: compression narrows the SQL advantage but does NOT collapse it** -
9.6x uncompressed against 7.3x compressed at 10M. Roughly a
quarter of the headline was attributable to measuring on a table nobody queries. The promotion win
stands, reduced ~25%. The checkpoint helps the UDF path only (13.8 s -> 10.1 s)
and does nothing for the SQL path.

**AND: a single unpromoted function dominates a query.** Two UDFs among five cost
**3.1x** the all-SQL pipeline. **The 17 functions still on the UDF path are
not a rounding error** - one of them anywhere in a query erases the benefit of the other four
running natively. That is the argument for finishing the promotions.

### 7. `duckdb_memory()` IS NOT RESIDENT MEMORY - and the Parquet scan memory law

`probe/memory-metric.mjs`, `probe/parquet-memory-limits.mjs`, `probe/parquet-scan-law.mjs`.

**The trap.** `sum(memory_usage_bytes) FROM duckdb_memory()` for an attached native table equalled
the database FILE SIZE to four decimal places at every scale from 100k to 100M. It is **elastic
buffer-manager residency**: given room DuckDB caches the whole table, so the figure converges on the
file size; squeeze `memory_limit` and the identical workload completes holding a fraction of it.
**It is not a requirement, and it must not be compared across storage kinds.**

| case (100M rows) | memory_limit | duckdb_memory() | **peak process RSS** | outcome |
|---|---|---|---|---|
| native table | 24.0 GiB | 11.0 GB | **15.3 GB** | ok |
| native table | 8.0 GiB | 7.7 GB | **13.0 GB** | ok |
| native table | 4.0 GiB | 3.9 GB | **9.2 GB** | ok |
| parquet view | 24.0 GiB | 172 MB | **4.8 GB** | ok |
| parquet view | 4.0 GiB | 172 MB | **4.7 GB** | ok |
| parquet view | 1.0 GiB | 172 MB | **4.5 GB** | ok |

**Peak RSS is the figure to plan with.** By it the gap is **3.2x**
(15.3 GB vs 4.8 GB at 100M), **not the ~65x** an earlier draft
of the report published from `duckdb_memory()`. Note also that Parquet's RSS is FLAT across limits
(~4.8-5.1 GB at 24 GiB and at 1 GiB), which is the documented "`memory_limit` does not bound RSS"
trap in another guise.

#### THE ONE SHAPE THAT FAILS, and the law it obeys

Running every query individually across a limit sweep at 10M: **14 of 15 shapes are fine on Parquet
down to 128 MiB** - every filter, every aggregation, every projection. Exactly one is fragile:

    SELECT * ... ORDER BY "amount" DESC LIMIT 100        -- a WIDE TOP-N

| shape | parquet 512MiB | native 512MiB | parquet 256MiB | native 256MiB | parquet 128MiB | native 128MiB |
|---|---|---|---|---|---|---|
| **wide top-N (`SELECT *`)** | **OOM** | ok | **OOM** | ok | **OOM** | OOM |
| agg high-card | ok | ok | ok | ok | **OOM** | ok |
| count distinct | ok | ok | ok | ok | **OOM** | ok |
| the other 12 shapes | ok | ok | ok | ok | ok | ok |

It is the only query that must materialise **all 30 columns** for every matching row before the
top-N heap can discard; filters and aggregations touch 1-3 columns and stream.

**`temp_directory` defaults to `.tmp` with 90% of disk, so spilling WAS available in every cell -
"it cannot spill" is NOT the explanation.** The mechanism is that the native table keeps a large
**evictable** reserve (1,127 MB of `BASE_TABLE` at a 2 GiB limit) which DuckDB drops instantly when
an operator needs room, while the Parquet view caches almost nothing (`EXTERNAL_FILE_CACHE` peaked
at **17 MB**) and so has nothing to give back.

**THE LAW, confirmed by two predictions:**

| test | result |
|---|---|
| same threshold at 10M (280 MB file) and 100M (2,801 MB file)? | **YES** - ok at 1GiB, OOM at 512MiB, both |
| does projecting 3 columns instead of 30 remove it at 256MiB? | **YES** |
| do threads move it at 256MiB? | 14 OOM, 8 OOM, **4 ok**, 2 ok, 1 ok |

> **A Parquet scan's working set is THREADS x ROW-GROUP SIZE x COLUMNS PROJECTED. It does NOT scale
> with the dataset.** At 14 threads / 122,880-row groups / 30 columns it needs between 512 MiB and
> 1 GiB, identically at 10M and 100M rows. It is a **fixed per-query reservation.**

**Mitigations, in order:** (1) **never emit `SELECT *`** - project only the fields the query
references, which QPL knows; (2) cap `threads` (4 suffices at 256 MiB); (3) budget ~1 GiB headroom
per concurrent wide query. A single job on a 64 GB worker cannot hit this; fifty concurrent ones can.

---

| | |
|---|---|
| corpus | 30 columns (35 declared field paths), across Keyword, Text, Byte, Short, Integer, Long, Float, Double, Number, Boolean, Date, IP, GeoPoint, 7 array types and nested objects |
| scales | 1k, 5k, 10k, 50k, 100k, 500k, 1M, 3M, 5M records (the append cases stop at 1M). **For 100M / 244M / 1B, see §Scale** — DuckFrame only, because that is what was run there, NOT because `DataFrame` cannot reach it |
| timing | median of 3 / 2 / 1 by scale runs, after a discarded warm-up |
| machine | node v24.15.0, 14 cores, 36 GB RAM, JS heap limit 24576 MB |

**How to read the timings.** `DuckFrame` operations are lazy — they build SQL and execute nothing — so every case below ends in an explicit force: `count(*)` for a filter or join, `materialize()` for anything that must yield a usable frame, and a full row drain where the `DataFrame` side also produces JS values. A sort is *never* forced with a count, because that lets the optimiser drop the `ORDER BY` and would measure nothing.

`OOM` means the JS heap was exhausted — a result, not a crash: it is the scale at which the current engine stops working on this machine.

## Frame creation

Building a queryable frame from data, coercion included. This is the api-server's job for records, and the worker's for Parquet.

### from records (+coercion)

Both coerce all 30 fields through the same `coerceToType`.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 3.5 ms | 8.1 ms | 2.3x slower | 122,829/s |
| 5k | 17.5 ms | 30.3 ms | 1.7x slower | 165,099/s |
| 10k | 39.5 ms | 59.1 ms | 1.5x slower | 169,304/s |
| 50k | 186.3 ms | 287.7 ms | 1.5x slower | 173,770/s |
| 100k | 369.2 ms | 569.2 ms | 1.5x slower | 175,690/s |
| 500k | 2.19 s | 2.93 s | 1.3x slower | 170,749/s |
| 1M | 5.19 s | 6.66 s | 1.3x slower | 150,260/s |
| 3M | 16.3 s | 22.5 s | 1.4x slower | 133,626/s |
| 5M | 30.9 s | 42.6 s | 1.4x slower | 117,238/s |

### read from the wire

The **worker's** ingest leg, and the other half of `serialize for the wire`: `DataFrame.deserialize` of a dfjson payload against `fromParquet` of a Parquet+zstd one. Each side reads its OWN wire format, because `DataFrame` cannot read Parquet at all and `DuckFrame` has no dfjson - which is precisely the choice being compared. Parquet is typed and schema-carrying, so this leg does **zero coercion**.

**Forced with `materialize()`, and that is not optional.** `fromParquet` is relation-backed - nothing is read until something asks for rows - and `size()` on its own is answered from the Parquet footer's row-group counts in under a millisecond, which measures no ingest at all. An earlier version of this case did exactly that and reported a meaningless 5,939x.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 3.9 ms | 2.3 ms | **1.7x faster** | 442,821/s |
| 5k | 18.6 ms | 5.7 ms | **3.2x faster** | 872,461/s |
| 10k | 38.4 ms | 10.6 ms | **3.6x faster** | 940,012/s |
| 50k | 214.4 ms | 46.8 ms | **4.6x faster** | 1,067,338/s |
| 100k | 413.2 ms | 92.3 ms | **4.5x faster** | 1,083,632/s |
| 500k | 2.53 s | 74.2 ms | **34.0x faster** | 6,739,544/s |

### serialize for the wire

What each engine hands the network: `DataFrame.serialize()` produces dfjson, `writeParquet` produces Parquet+zstd.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 4.4 ms | 1.9 ms | **2.3x faster** | 513,149/s |
| 5k | 20.7 ms | 4.8 ms | **4.3x faster** | 1,046,746/s |
| 10k | 42.8 ms | 9.3 ms | **4.6x faster** | 1,080,332/s |
| 50k | 226.1 ms | 42.3 ms | **5.3x faster** | 1,181,477/s |
| 100k | 470.3 ms | 76.9 ms | **6.1x faster** | 1,299,699/s |
| 500k | 2.84 s | 124.6 ms | **22.8x faster** | 4,012,184/s |
| 1M | _OOM_ | 157.9 ms | - | 6,334,963/s |
| 3M | _OOM_ | 409.6 ms | - | 7,324,727/s |
| 5M | _OOM_ | 933.5 ms | - | 5,356,253/s |

## Transforms and validations

The 205 QPL functions. Both engines drive the SAME `FunctionDefinitionConfig` through their own adapter - `dataFrameAdapter` builds a new column, `duckFrameAdapter` returns a SQL expression.

> **When these were measured, that expression was ALWAYS a call to a vectorized JS UDF.** It no longer is: 188 of 205 functions now emit native SQL and register no UDF at all (`docs/sql-emission.md`). Every number in this section is therefore the UDF path, which is the slow one. See the staleness warning at the top.

### transform (toUpperCase)

One Keyword column uppercased, all 30 columns projected through. **`DataFrame` shares data structurally.** It is immutable and columnar, so this returns a new frame REFERENCING the existing column vectors - almost no data moves, while `DuckFrame` physically materialises a new result. The two do different amounts of work: the comparison is of semantics, not equal labour, and the deferred cost reappears when the data is read. Here `DataFrame` swaps ONE column and reuses the other 29, while `DuckFrame` writes all 30 - see the composed pipeline case for where that stops being an advantage.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.2 ms | 1.8 ms | 7.3x slower | 555,633/s |
| 5k | 0.6 ms | 5.4 ms | 8.8x slower | 926,469/s |
| 10k | 0.9 ms | 10.4 ms | 11.6x slower | 964,328/s |
| 50k | 3.3 ms | 48.3 ms | 14.8x slower | 1,035,711/s |
| 100k | 7.9 ms | 94.9 ms | 12.0x slower | 1,053,453/s |
| 500k | 47.8 ms | 98.8 ms | 2.1x slower | 5,058,344/s |
| 1M | 103.0 ms | 196.5 ms | 1.9x slower | 5,089,574/s |
| 3M | 380.1 ms | 643.6 ms | 1.7x slower | 4,661,230/s |
| 5M | 8.61 s | 1.39 s | **6.2x faster** | 3,596,748/s |

### validation (isIP)

A failing value is NULLed and the row kept, on both sides.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.7 ms | 2.1 ms | 3.2x slower | 472,023/s |
| 5k | 2.7 ms | 7.2 ms | 2.6x slower | 697,180/s |
| 10k | 5.0 ms | 13.6 ms | 2.7x slower | 737,683/s |
| 50k | 25.1 ms | 60.9 ms | 2.4x slower | 820,692/s |
| 100k | 50.9 ms | 120.3 ms | 2.4x slower | 831,359/s |
| 500k | 262.5 ms | 241.9 ms | **1.1x faster** | 2,067,204/s |
| 1M | 527.2 ms | 491.5 ms | **1.1x faster** | 2,034,476/s |
| 3M | 1.81 s | 1.60 s | **1.1x faster** | 1,871,127/s |
| 5M | 8.31 s | 2.84 s | **2.9x faster** | 1,763,249/s |

### transform (array column)

The same `toUpperCase`, but over `tags` - a Keyword **array**. Both adapters take a separate path for `ProcessMode.INDIVIDUAL_VALUES`: `DataFrame` walks the list inside each row, `duckFrameAdapter` emits `list_transform(col, x -> udf(x))`. Seven of the 30 columns are arrays and no other case exercised that path.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.3 ms | 2.0 ms | 6.8x slower | 506,692/s |
| 5k | 0.7 ms | 6.4 ms | 9.4x slower | 781,948/s |
| 10k | 1.5 ms | 11.8 ms | 7.7x slower | 845,922/s |
| 50k | 8.8 ms | 56.3 ms | 6.4x slower | 887,501/s |
| 100k | 15.7 ms | 112.9 ms | 7.2x slower | 885,940/s |
| 500k | 104.4 ms | 201.3 ms | 1.9x slower | 2,484,137/s |
| 1M | 226.0 ms | 417.5 ms | 1.8x slower | 2,395,457/s |
| 3M | 812.1 ms | 1.37 s | 1.7x slower | 2,189,088/s |
| 5M | 11.4 s | 2.55 s | **4.5x faster** | 1,958,912/s |

## Composed pipelines

The case that separates the two models. A QPL query applies SEVERAL functions and then filters. `DataFrame` makes one materialising pass per function, because each adapter returns a new frame. `DuckFrame` composes them into ONE statement that DuckDB evaluates in a single pass - which is the whole argument for the change.

### 5 transforms + filter

Five field transforms chained, then a filter. `DataFrame`: five passes, each building a new column, then a search. `DuckFrame`: one `SELECT` with five expressions and a `WHERE`, evaluated once.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 2.7 ms | 2.1 ms | **1.3x faster** | 238,569/s |
| 5k | 8.0 ms | 6.3 ms | **1.3x faster** | 394,656/s |
| 10k | 18.4 ms | 12.3 ms | **1.5x faster** | 406,897/s |
| 50k | 87.9 ms | 58.1 ms | **1.5x faster** | 430,386/s |
| 100k | 175.5 ms | 114.8 ms | **1.5x faster** | 435,607/s |
| 500k | 1.40 s | 427.5 ms | **3.3x faster** | 584,835/s |
| 1M | 3.75 s | 894.4 ms | **4.2x faster** | 559,049/s |
| 3M | 11.1 s | 2.76 s | **4.0x faster** | 543,077/s |
| 5M | 67.0 s | 5.47 s | **12.2x faster** | 456,709/s |

## Query operations

Filtering, sorting, paging and dedup - what a search request does after the data is loaded.

### filter (1 of 5 matches)

Each engine uses its own predicate language: xLucene for `DataFrame`, SQL for `DuckFrame`. Forced with `count(*)` - the question is how fast the rows are found.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.9 ms | 0.2 ms | **4.3x faster** | 931,493/s |
| 5k | 2.9 ms | 0.3 ms | **10.6x faster** | 3,705,419/s |
| 10k | 5.8 ms | 0.3 ms | **22.1x faster** | 7,590,133/s |
| 50k | 26.8 ms | 0.4 ms | **64.8x faster** | 24,215,479/s |
| 100k | 64.8 ms | 0.6 ms | **105.9x faster** | 32,670,823/s |
| 500k | 513.7 ms | 0.8 ms | **653.8x faster** | 127,287,192/s |
| 1M | 1.43 s | 1.0 ms | **1439.8x faster** | 201,578,968/s |
| 3M | 3.27 s | 11.5 ms | **285.8x faster** | 52,395,834/s |
| 5M | 26.7 s | 15.8 ms | **1693.6x faster** | 63,387,757/s |

### sort (2 keys)

Forced with `materialize()`, never `count(*)` - a count lets the optimiser drop the ORDER BY and would measure nothing.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 4.6 ms | 1.8 ms | **2.5x faster** | 545,827/s |
| 5k | 23.2 ms | 5.6 ms | **4.2x faster** | 893,163/s |
| 10k | 46.9 ms | 10.9 ms | **4.3x faster** | 921,245/s |
| 50k | 252.6 ms | 57.4 ms | **4.4x faster** | 871,626/s |
| 100k | 504.7 ms | 103.4 ms | **4.9x faster** | 967,283/s |
| 500k | 2.89 s | 95.0 ms | **30.5x faster** | 5,262,555/s |
| 1M | 6.14 s | 112.1 ms | **54.7x faster** | 8,921,167/s |
| 3M | 26.8 s | 421.3 ms | **63.6x faster** | 7,120,945/s |
| 5M | 82.4 s | 1.65 s | **49.9x faster** | 3,025,460/s |

### sort + limit (top 1,000)

The shape a real search request has - `params.sort` plus `size` (`v3/execute/search/fetch-from-frame.ts`), which neither the sort case nor the page case measures on its own. `DataFrame` sorts EVERY row and then slices; DuckDB plans it as `TOP_N` - a heap of 1,000 plus a dynamic filter that skips row groups - so the gap should widen with scale. Forced with `materialize()`, never a count.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 4.4 ms | 1.9 ms | **2.3x faster** | 523,001/s |
| 5k | 23.5 ms | 2.5 ms | **9.6x faster** | 406,669/s |
| 10k | 50.6 ms | 2.9 ms | **17.2x faster** | 340,204/s |
| 50k | 240.2 ms | 7.4 ms | **32.4x faster** | 134,919/s |
| 100k | 514.3 ms | 12.2 ms | **42.1x faster** | 81,811/s |
| 500k | 3.21 s | 12.0 ms | **268.0x faster** | 83,360/s |
| 1M | 6.37 s | 12.7 ms | **502.7x faster** | 78,963/s |
| 3M | 22.0 s | 27.0 ms | **812.6x faster** | 36,982/s |
| 5M | 73.1 s | 42.1 ms | **1735.3x faster** | 23,732/s |

### dedup (all columns)

`DataFrame.unique(every field)` vs `SELECT DISTINCT *`.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 9.6 ms | 5.5 ms | **1.7x faster** | 181,670/s |
| 5k | 52.4 ms | 7.8 ms | **6.7x faster** | 639,349/s |
| 10k | 104.7 ms | 11.3 ms | **9.3x faster** | 887,942/s |
| 50k | 546.4 ms | 42.2 ms | **13.0x faster** | 1,186,044/s |
| 100k | 1.17 s | 83.7 ms | **14.0x faster** | 1,195,373/s |
| 500k | 6.44 s | 296.3 ms | **21.7x faster** | 1,687,270/s |
| 1M | 16.9 s | 448.1 ms | **37.8x faster** | 2,231,883/s |

### page (limit 1,000)

**`DataFrame` shares data structurally.** It is immutable and columnar, so this returns a new frame REFERENCING the existing column vectors - almost no data moves, while `DuckFrame` physically materialises a new result. The two do different amounts of work: the comparison is of semantics, not equal labour, and the deferred cost reappears when the data is read. `DataFrame.limit` is a `slice` view over the same vectors.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.3 ms | 2.0 ms | 6.6x slower | 500,000/s |
| 5k | 0.3 ms | 2.0 ms | 6.4x slower | 502,871/s |
| 10k | 0.3 ms | 2.0 ms | 6.8x slower | 501,882/s |
| 50k | 0.3 ms | 2.1 ms | 6.7x slower | 477,583/s |
| 100k | 0.3 ms | 2.2 ms | 6.3x slower | 462,463/s |
| 500k | 0.4 ms | 2.6 ms | 7.4x slower | 385,047/s |
| 1M | 0.4 ms | 4.0 ms | 11.4x slower | 248,229/s |

### output all rows to JS

The response path: every row converted back to plain JS objects.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 4.8 ms | 8.5 ms | 1.8x slower | 118,110/s |
| 5k | 22.3 ms | 41.0 ms | 1.8x slower | 121,952/s |
| 10k | 47.6 ms | 81.9 ms | 1.7x slower | 122,063/s |
| 50k | 256.5 ms | 412.3 ms | 1.6x slower | 121,264/s |
| 100k | 532.1 ms | 873.8 ms | 1.6x slower | 114,446/s |
| 500k | 3.15 s | 5.50 s | 1.7x slower | 90,830/s |
| 1M | 7.39 s | 9.77 s | 1.3x slower | 102,336/s |

## Output to ldjson

What production actually does with a finished result: write **ldjson** to S3, one JSON object per line. `DataFrame` has to build every row as a JS object and `JSON.stringify` it; `DuckFrame` renders each line in C++ inside the query, so the rows never become JS values at all.

**The bytes are identical** - all 500 sampled lines of this corpus, checked against `DataFrame` itself. DuckDB's native JSON is not `DataFrame`'s: it writes `2026-01-10 00:00:00` for a Date, a bare number for a `Long` past `MAX_SAFE_INTEGER` that `JSON.parse` rounds, `"f": null` where `DataFrame` omits the key, `5.0` for an integral float, and a bare `Infinity` that is not valid JSON at all. The export projection corrects every one of them in SQL before anything is written, pinned in `test/duck-frame/export-json-spec.ts`. That correction is measured: it costs 7% of the projection.

Both sides use spaces' own `remove_null_fields: true` default.

### ldjson to a file

The whole result to one file. Each side writes it the way it can: `DataFrame.toJSON` then `JSON.stringify` per row, batched into 1 MB writes so the measurement is not one syscall per row, against `writeNDJSON`, which is a single `COPY`. Note that `toJSON` builds an array of every row first - that materialisation is part of the cost, and is why this is where `DataFrame` runs out of heap.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 8.1 ms | 8.0 ms | **1.0x faster** | 124,885/s |
| 5k | 34.7 ms | 27.8 ms | **1.2x faster** | 179,771/s |
| 10k | 75.6 ms | 51.2 ms | **1.5x faster** | 195,211/s |
| 50k | 357.0 ms | 260.5 ms | **1.4x faster** | 191,970/s |
| 100k | 735.0 ms | 519.1 ms | **1.4x faster** | 192,637/s |
| 500k | 4.29 s | 752.0 ms | **5.7x faster** | 664,873/s |
| 1M | 9.78 s | 1.06 s | **9.2x faster** | 940,647/s |

### ldjson streamed

The same lines, never held all at once - what the worker needs when the table is already most of its 64 GB. `ndjson()` yields one rendered line at a time, so JavaScript only moves bytes. Byte-identical to the file path; the only question is throughput.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 6.4 ms | 5.9 ms | **1.1x faster** | 168,075/s |
| 5k | 32.4 ms | 24.4 ms | **1.3x faster** | 204,821/s |
| 10k | 68.3 ms | 48.3 ms | **1.4x faster** | 207,015/s |
| 50k | 357.1 ms | 231.4 ms | **1.5x faster** | 216,063/s |
| 100k | 767.3 ms | 482.6 ms | **1.6x faster** | 207,195/s |
| 500k | 4.24 s | 2.22 s | **1.9x faster** | 225,199/s |
| 1M | 9.52 s | 4.44 s | **2.1x faster** | 224,991/s |

### transform + filter -> ldjson

The whole response path in one case, which is the argument the other cases only make in pieces: transform a field, filter, and emit ldjson. `DataFrame` makes a pass per step and then converts every surviving row to JS; for `DuckFrame` the transform, the filter and the JSON rendering are ONE statement, so no intermediate result is ever built.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 4.5 ms | 4.6 ms | 1.0x slower | 107,663/s |
| 5k | 22.1 ms | 14.0 ms | **1.6x faster** | 178,138/s |
| 10k | 48.8 ms | 25.9 ms | **1.9x faster** | 192,700/s |
| 50k | 247.6 ms | 121.4 ms | **2.0x faster** | 205,983/s |
| 100k | 516.4 ms | 250.3 ms | **2.1x faster** | 199,768/s |
| 500k | 3.22 s | 1.06 s | **3.0x faster** | 235,381/s |
| 1M | 7.49 s | 2.25 s | **3.3x faster** | 222,357/s |

## Aggregations

Grouped and global aggregation. For `DuckFrame` this is just a projection with a `GROUP BY`, so it composes with everything else in one statement.

### group by 1 key + sum

5 groups out. Forced with `rows` on both sides, since both produce a small materialised result.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.9 ms | 0.4 ms | **2.5x faster** | 12,994/s |
| 5k | 3.7 ms | 0.5 ms | **6.9x faster** | 9,383/s |
| 10k | 7.2 ms | 0.7 ms | **11.1x faster** | 7,636/s |
| 50k | 33.1 ms | 0.8 ms | **39.9x faster** | 6,032/s |
| 100k | 71.9 ms | 1.3 ms | **57.1x faster** | 3,974/s |
| 500k | 371.2 ms | 1.6 ms | **230.4x faster** | 3,104/s |
| 1M | 792.1 ms | 1.7 ms | **466.6x faster** | 2,945/s |

### group by 2 keys + 3 aggs

20 groups, three aggregate functions at once.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 1.1 ms | 1.0 ms | **1.1x faster** | 20,324/s |
| 5k | 4.9 ms | 0.8 ms | **6.0x faster** | 24,426/s |
| 10k | 9.5 ms | 0.9 ms | **10.3x faster** | 21,656/s |
| 50k | 47.0 ms | 1.6 ms | **30.1x faster** | 12,802/s |
| 100k | 102.6 ms | 2.5 ms | **41.5x faster** | 8,097/s |
| 500k | 531.5 ms | 3.1 ms | **172.0x faster** | 6,473/s |
| 1M | 1.15 s | 3.2 ms | **360.3x faster** | 6,267/s |

## Appending batches

Combining several already-typed batches into ONE frame - what the worker does as its fetches land. Coercion is excluded: the batches are prepared in setup.

### combine 5 batches

`DataFrame.appendAll` over 5 prebuilt frames vs 5 `append({ parquet })` calls into one table. **`DataFrame` shares data structurally.** It is immutable and columnar, so this returns a new frame REFERENCING the existing column vectors - almost no data moves, while `DuckFrame` physically materialises a new result. The two do different amounts of work: the comparison is of semantics, not equal labour, and the deferred cost reappears when the data is read. `appendAll` only recomputes offsets - its own doc says the cost is relatively low - whereas `DuckFrame` inserts the rows into a real table that is queryable with no further cost.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | 0.1 ms | 8.1 ms | 62.8x slower | 122,756/s |
| 5k | 0.1 ms | 10.4 ms | 86.0x slower | 478,494/s |
| 10k | 0.1 ms | 16.4 ms | 132.2x slower | 608,549/s |
| 50k | 0.1 ms | 65.6 ms | 579.5x slower | 762,447/s |
| 100k | 0.1 ms | 248.6 ms | 1890.0x slower | 402,229/s |
| 500k | 0.2 ms | 639.0 ms | 3033.8x slower | 782,472/s |
| 1M | 0.2 ms | 367.6 ms | 1916.4x slower | 2,720,705/s |

### combine 5 batches, concurrent

DuckFrame only: the fetches land at once. `DataFrame` has no concurrent append - `appendAll` is one synchronous pass.

> **Two gaps in this group, noted 2026-08-21.** The harness has a THIRD case, `combine 5 batches, one append` - `append({ parquet: [paths] })`, which `read_parquet` reads as one relation so all five payloads land in a single `INSERT ... BY NAME`. It was added after this sweep and has **no numbers here at all**; `tools/bench/append-ingest.mjs` measures the shape at ~4x a sequential loop (78-90 ms vs ~350 ms over 20 payloads at 1M). And the append cases stop at **1M**, where the rest of this document runs to 5M.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | _n/a_ | 3.7 ms | - | 272,446/s |
| 5k | _n/a_ | 5.1 ms | - | 972,944/s |
| 10k | _n/a_ | 7.7 ms | - | 1,294,938/s |
| 50k | _n/a_ | 27.6 ms | - | 1,814,635/s |
| 100k | _n/a_ | 53.6 ms | - | 1,864,251/s |
| 500k | _n/a_ | 263.0 ms | - | 1,901,039/s |
| 1M | _n/a_ | 148.9 ms | - | 6,717,184/s |

## Join

**`DataFrame` has no join primitive at all** - which is the reason this project exists. Today spaces emulates one by issuing a child search per parent row, cached in a 10,000-entry LRU that high cardinality defeats. For `DuckFrame` a join is ordinary SQL over two tables.

### inner join, 5 children per parent

A child table keyed so each parent matches **5** children - the fan-out a real join has. Forced with `count(*)`.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | _n/a_ | 0.4 ms | - | 2,390,434/s |
| 5k | _n/a_ | 0.4 ms | - | 11,933,174/s |
| 10k | _n/a_ | 0.6 ms | - | 16,594,068/s |
| 50k | _n/a_ | 2.0 ms | - | 24,650,773/s |
| 100k | _n/a_ | 3.3 ms | - | 30,473,089/s |
| 500k | _n/a_ | 8.1 ms | - | 61,906,088/s |
| 1M | _n/a_ | 13.6 ms | - | 73,305,270/s |

### join + count per parent

Per-parent counts in ONE statement - the shape the per-row fanout is faking today. Grouped by the parent key, NOT by a low-cardinality field: joining two 100k tables on a 5-value column is a 2-billion-row cartesian product, which measures an explosion rather than a join.

| records | DataFrame | DuckFrame | difference | DuckFrame throughput |
|---|---|---|---|---|
| 1k | _n/a_ | 0.5 ms | - | 1,891,403/s |
| 5k | _n/a_ | 0.7 ms | - | 7,309,055/s |
| 10k | _n/a_ | 0.9 ms | - | 11,107,507/s |
| 50k | _n/a_ | 2.8 ms | - | 17,688,677/s |
| 100k | _n/a_ | 6.2 ms | - | 16,051,470/s |
| 500k | _n/a_ | 15.7 ms | - | 31,771,079/s |
| 1M | _n/a_ | 22.9 ms | - | 43,716,644/s |

## What the SQL promotions bought — MEASURED 2026-08-21

**This is the number the rest of this document was missing.** Everything in §Transforms and
validations was taken with all 205 functions on the JavaScript UDF path. 188 of 205 now emit native
SQL, and `PREFER_SQL` (`bench/comparison/lib/harness.js`, wired the same way as `CHECKPOINT`) runs
the same cases both ways:

```bash
RESULTS=bench/comparison/.udf.json ENGINE=duckframe PREFER_SQL=0 node bench/comparison/run.js
RESULTS=bench/comparison/.sql.json ENGINE=duckframe PREFER_SQL=1 node bench/comparison/run.js
```

`RUNS=3`, DuckFrame side only - the `DataFrame` side is irrelevant to a SQL-versus-UDF question and
doubles the wall clock.

### At 1M rows

| case | UDF path | SQL path | gain |
|---|---|---|---|
| `validation (isIP)` | 511.4 ms | **57.7 ms** | **8.87x** |
| `transform (array column)` | 433.0 ms | **57.9 ms** | **7.47x** |
| `transform (toUpperCase)` | 212.9 ms | **54.2 ms** | **3.93x** |
| `5 transforms + filter` | 925.2 ms | **310.1 ms** | **2.98x** |
| `transform + filter -> ldjson` | 2,207.6 ms | 1,999.5 ms | 1.10x |

### At 100k rows

| case | UDF path | SQL path | gain |
|---|---|---|---|
| `validation (isIP)` | 122.8 ms | 83.1 ms | 1.48x |
| `transform (array column)` | 113.9 ms | 82.7 ms | 1.38x |
| `transform (toUpperCase)` | 96.2 ms | 79.6 ms | 1.21x |
| `5 transforms + filter` | 116.8 ms | 121.7 ms | **flat** |
| `transform + filter -> ldjson` | 245.7 ms | 238.9 ms | flat |

### What it settles

1. **The projected "18x" does not hold on the real corpus.** The comparable case - the five-function
   pipeline - is **2.98x at 1M**. Every "18x" elsewhere in these docs came from a five-function
   synthetic measured before the promotion work; treat it as withdrawn.
2. **The win needs scale.** At 100k the five-function pipeline is FLAT, because ~80 ms of
   materialising 30 columns swamps 5 x 17 ms of UDF. At 1M the same case is 3x. Do not quote a
   small-scale transform ratio.
3. **The per-value cost model predicts these numbers.** `toUpperCase` at 100k saved 16.6 ms, and
   100,000 x 171 ns is 17.1 ms - one UDF's worth, from a completely independent measurement
   (§THE COST OF A UDF IS LINEAR in `HANDOFF.md`).
4. **Anything ending in a JS drain barely moves.** `transform + filter -> ldjson` is 1.10x because
   row output dominates it, not the transform.
5. **The control holds.** All 18 cases the flag cannot touch - creation, filters, sorts, dedup,
   paging, group-bys, appends, joins - came out flat, which is what makes the five above credible.

### Two things to know before quoting these

- **`toUpperCase`/`toLowerCase` dispatch as `sql+udf`, not `sql`.** They are guarded on ASCII and the
  UDF stays registered for anything else (JavaScript uses full case mapping, DuckDB simple), so
  their gain scales with the ASCII fraction of the column. `trim` is pure `sql`. Verified by reading
  the adapter's `dispatch`, not inferred.
- **5M was not measured.** The 100k+1M pair took ~4.5 minutes per path; 5M is the scale the old 18x
  claim was made at and is the obvious next run.

## Ingest levers

### INGEST LEVERS, CROSSED AGAINST STORAGE (2026-08-21) — and the scale-vs-append gap explained

Measured with a one-off harness that has since been folded into `tools/bench/append-ingest.mjs` (which owns the append shapes) - 2M rows as 40 x 50k Parquet payloads, 30-column corpus, 10 appends
in flight, **automatic checkpointing suppressed for every timed append** so no COMMIT can charge
compression to ingest. Every lever isolated against one baseline; storage is the OUTER axis.

**Baseline - what ships today** (fresh connection per append, BEGIN/COMMIT, one path per append):

| | ms | per million |
|---|---|---|
| in-memory | 1,130 | **565 ms/M** |
| file-backed | 1,783 | **892 ms/M** |

**File-backed costs 1.6x in-memory.** That is the single largest fixed difference in this table.

#### THE DISCREPANCY: append cost does NOT grow with table size

The open question was why `append-ingest.mjs` says ~350 ms/M and `scale-ingest.mjs` says 1.48 s/M.
Table size was the leading suspect. It is not the cause - the per-million cost is FLAT:

| filled to | in-memory | file-backed |
|---|---|---|
| 1M | 607 ms/M | 1,023 ms/M |
| 2M | 626 ms/M | 1,046 ms/M |
| 4M | 625 ms/M | 1,049 ms/M |
| 8M | 627 ms/M | 1,071 ms/M |

So the gap is **storage (1.6x) plus the checkpoint, not the table**.

#### THE DISCREPANCY, SETTLED (2026-08-24): it was automatic checkpointing, 78% of it

The suspect was that **`scale-ingest.mjs` never suppressed automatic checkpointing**, so a COMMIT
could trigger compression inside a timed append. It had no knob for it; one was added
(`AUTO_CHECKPOINT=off`, raising `checkpoint_threshold` to 1 TB, mirroring `append-ingest.mjs`'s
`auto-off` mode). 5M rows, 100k payloads, 10 appends in flight, file-backed, no periodic checkpoint.
**Two reps per cell, agreeing to within 0.1 s:**

| | append | per million | disk | RSS | segments |
|---|---|---|---|---|---|
| auto-checkpoint **ARMED** (what ships) | 7.4 s | **1.48 s/M** | 596 MB | 5,141 MB | 5,954 (360 uncompressed) |
| auto-checkpoint **SUPPRESSED** | 5.1 s | **1.02 s/M** | 2,150 MB | 7,409 MB | 11,904 (all uncompressed) |

**Confirmed: automatic checkpointing is 31% of append cost (1.45x), and 78% of the gap.** Of the
~590 ms/M between 1.48 s/M and `append-ingest.mjs`'s 892 ms/M, ~460 ms/M was automatic checkpointing.
The residual ~130 ms/M is payload shape - 100k payloads here against 50k there.

**Two things worth more than the speedup.**

1. **1.48 s/M reproduced exactly at 5M**, against the figure recorded from the 100M run. Independent
   reconfirmation that append cost is flat in table size, from a completely different scale.
2. **Suppression is NOT free, and this is the part to carry.** Disk goes 596 MB → **2,150 MB (3.6x)**
   and RSS 5,141 → **7,409 MB (1.44x)**, because the automatic checkpoint was doing real compression
   work. At 5M that is 1.5 GB of extra disk and 2.2 GB of extra RSS carried until quiesce; at 100M or
   1B it is a container-sizing decision, not a tuning knob. It is a **speed/memory trade**, not a win.

#### The levers, measured

| lever | in-memory | file-backed | verdict |
|---|---|---|---|
| **connection pool** vs fresh per append | 1,142 → 1,142 ms | 1,716 → 1,727 ms | **NO GAIN. Creating a DuckDB connection is free.** |
| **ONE shared connection** | 2,817 ms | — | **2.5x SLOWER.** Concurrency across connections is doing real work |
| **drop BEGIN/COMMIT** | 1,107 → 1,093 ms (1.3%) | 1,810 → 1,716 ms (**5%**) | marginal; free to take on file, not the win |
| **`preserve_insertion_order=false`**, one payload per append | 1,114 → 1,140 ms | 1,787 → 1,784 ms | no change - see the correction below, it depends on the SHAPE |
| **batch 5 payloads/append** | 1,130 → **301 ms** | 1,783 → **1,083 ms** | **3.74x / 1.66x — the real lever** |
| **batch 10 payloads/append** | 307 ms | **1,069 ms** | same, slightly better on file |
| **ALL 40 paths in one append** | 598 ms | **2,499 ms** | looked worse - **it was the ORDERING, not the batching.** See below |
| **CTAS over all paths** | **561 ms** | 2,536 ms | best on memory, *worst* on file |
| **VIEW over read_parquet, no table** | **0 ms** | **1 ms** | free |

**Three findings that contradict what these docs previously said:**

1. **The per-append overhead is NOT connection setup.** An earlier note in this file inferred ~16 ms
   per append of connection + transaction cost from `append-ingest.mjs`'s sequential number. Pooling
   removes exactly none of it, and dropping the transaction removes 1-5%. Whatever the fixed cost is,
   it is inside `INSERT ... SELECT FROM read_parquet` - per-statement planning and per-file open -
   not in the session.
2. **"Batch ALL paths into one append" is wrong past a certain payload count.** The existing advice
   came from 20 payloads in memory. At 40 payloads, one-append-with-everything is **2x worse than
   groups of 5-10** in memory and **2.3x worse** on file. There is an optimum around 5-10 payloads
   per append, and it is not "as many as possible".
3. **CTAS is storage-dependent and inverts.** Fastest table build in memory (561 ms), slowest on
   file (2,536 ms) - worse than 40 separate inserts.

#### CORRECTION (same day): `preserve_insertion_order` interacts with the append SHAPE

The two rows above were measured with **one payload per append**, where turning ordering off changes
nothing - and I wrote it up as "refuted". That was wrong, because the setting was never tested against
the shape where it costs something. Isolated properly in `tools/bench/append-ingest.mjs`, through the
real `DuckFrame.append` so the transaction is held constant at what ships (40 x 50k payloads, 5-column
corpus, in-memory, automatic checkpointing suppressed):

| shape | order ON | order OFF | |
|---|---|---|---|
| 40 sequential appends | 457 ms | 451 ms | no change |
| 40 concurrent appends | 229 ms | 224 ms | no change |
| **ONE append, all 40 paths** | 106 ms | **31 ms** | **3.42x faster** |

**40 separate statements each order 50k rows, which is free. One statement must establish a total
order across every file, which is not.** So "batching everything is slower than groups of 5-10" was
an artefact of leaving ordering on; with it off, one append of everything is the fastest shape by a
wide margin - 2M rows in **31 ms**, 64.6M rows/s.

**And the cost is per-STATEMENT, not per-append-of-rows:**

| shape | total | per append |
|---|---|---|
| 40 sequential appends | 451 ms | **11.3 ms** |
| 40 concurrent appends | 224 ms | 5.6 ms |
| 1 append of 40 paths | 31 ms | — |

That is the number to hold against `DataFrame.appendAll`'s ~0.2 ms, and it is why an
append-dominated job cares: 14.6x separates the worst shape from the best, and it is entirely
about **how many append CALLS** are made, not how many rows move.

**Two things these numbers are not.** They are the **5-column** corpus of `append-ingest.mjs`, where
the 30-column table above is 3-6x heavier per row; and they are **in-memory**, where file-backed cost
1.6x. Both axes are now reproducible in that bench (`DB=` for storage), and neither has been crossed
with the ordering result yet.


#### The per-append cost, and the arithmetic that matters for a long-running job

**This is the question the ingest work exists to answer**, so it is stated as a number rather than a
ratio. `DuckFrame.append` through the real code path, 50k-row payloads, transaction and connection
strategy as they ship:

| shape | 5-column corpus, memory | 5-column, file | 30-column, memory | 30-column, file |
|---|---|---|---|---|
| one payload per append, sequential | 11.4 ms | 15.7 ms | ~28 ms | ~45 ms |
| one payload per append, concurrent | 5.7 ms | 9.9 ms | — | — |
| all payloads in ONE append | (31 ms total for 40) | (444 ms total) | — | — |

`DataFrame.appendAll` is **~0.2 ms**, flat, at any size - it is structural sharing, so it recomputes
offsets and moves nothing.

**The arithmetic, done honestly.** `DataFrame`'s group-by advantage at 1M rows is 788 ms (790 ms
against DuckFrame's 2 ms). At 15-45 ms per append that is **17 to 52 appends** before ingest has
consumed one aggregation's worth of advantage. A job that runs for hours, appends thousands of times
and aggregates occasionally **never gets it back on append cost alone** - and the earlier framing in
these docs ("DuckFrame is ahead after the first query") assumed a read-heavy shape that such a job
does not have.

What survives as a DuckFrame argument for append-dominated work is narrower and should be stated
that way:

- **joins**, but only where both sides are co-located in one process; a fan-out join is the same
  problem `DataFrame` has;
- **query cost**, which is 100-400x on aggregations - decisive only if the job actually aggregates;
- **not paying the append at all** - see the Parquet section, which is the direction this points to.

#### The order x shape cross, on BOTH storages

`preserve_insertion_order` only costs something when one statement has to order many files, and
**which shape wins inverts with storage**:

| shape | memory, order ON | memory, order OFF | file, order ON | file, order OFF |
|---|---|---|---|---|
| 40 sequential appends | 457 ms | 451 ms | 626 ms | 618 ms |
| 40 concurrent appends | 229 ms | 224 ms | **386 ms** | 403 ms |
| ONE append, all 40 paths | 106 ms | **31 ms** | 444 ms | 546 ms |

**In memory the fastest shape is one append with ordering off (31 ms, 3.42x). On file that same
combination is the SLOWEST (546 ms), and the winner is concurrent per-payload appends (386 ms).**
Since the worker's table is file-backed at any size that matters, the memory result is the wrong one
to plan from - and a "combined best" cell that stacks levers without re-crossing them against storage
is how that gets missed.

#### Checkpointing during ingest is expensive, and the cadence advice was too aggressive

| cadence | in-memory | of which checkpoint | file-backed | of which checkpoint |
|---|---|---|---|---|
| never during ingest | **1,134 ms** | — | **1,798 ms** | 456 ms (one final) |
| every 10 payloads (500k rows) | 1,712 ms | 798 ms | 3,053 ms | 2,310 ms |
| every 5 payloads (250k rows) | 2,365 ms | 2,007 ms | 3,124 ms | 3,622 ms |

**Checkpointing every 250-500k rows doubles-to-triples ingest.** §CHECKPOINT CADENCE's "checkpoint
every ~1M, it never slows ingest" was measured AT 1M and is not wrong there - but the cost curve
below 1M is steep, and "nearly free" does not generalise downward. **Never during ingest, once at
quiesce** is the fastest option on both storages.

> **PRICED 2026-08-24, and "fastest" is not "best".** The clause above is confirmed for *ingest speed*
> - suppressing checkpoints entirely is 1.45x on append. But the 5M pair above puts a number on what
> it costs meanwhile: **3.6x disk and 1.44x RSS**, held until quiesce. So the recommendation is a trade
> with two dials, not a rule: **never checkpoint during ingest IF the peak footprint fits**; otherwise
> checkpoint at the coarsest cadence that keeps it inside the container. The 1B run's
> `CHECKPOINT_EVERY=50M` is that reasoning already applied. Note also that DuckDB's *automatic*
> checkpointing is armed by default at a 16 MiB threshold, so "never during ingest" requires an
> explicit `SET checkpoint_threshold` - it is not what happens if you do nothing.

#### No table at all: free to build, and at 2M rows nearly free to query

| | count(*) | filter + count | group by 1 key | project 30 cols, limit 1k |
|---|---|---|---|---|
| in-memory table | 0 ms | 1 ms | 3 ms | 15 ms |
| in-memory VIEW | 2 ms | 2 ms | 2 ms | 16 ms |
| file table | 0 ms | 1 ms | 1 ms | 11 ms |
| file VIEW | 2 ms | 2 ms | 2 ms | 15 ms |

**A view over the Parquet payloads costs ~1 ms to create and queries within a few ms of a real
table.** Ingest becomes free. **This is the most promising direction on the board and it is also the
least tested:** 2M rows over 40 files is nothing like 250M over 5,000, where per-file open cost, the
absence of cross-file zonemaps and repeated Parquet decode per query all scale against the view.
**Do not act on this without the large-N run.**

#### The combination, and a trap in it

| | ms | per million | vs baseline |
|---|---|---|---|
| in-memory: pool + no txn + order off + one append | **183 ms** | **91 ms/M** | **6.16x** |
| file: the same combination | 3,181 ms | 1,591 ms/M | **0.57x - WORSE** |

The file cell is worse because the combination includes "all paths in one append", which is the
losing choice there. **The right file recipe is pool + no transaction + groups of 10**, which is
1,069 ms - 1.68x. Storage changes which levers win, which is the reason this bench crosses them.

## Querying Parquet directly — the "no table" option, measured

`tools/bench/parquet-query.mjs`. The worker's fetches land as Parquet payloads; today they are
appended into one table at 10-45 ms per append, which is the dominant cost of a long-running job. A
`VIEW` over `read_parquet([...])` makes ingest **free** - the question is what it costs at query time.

**The axis is FILE COUNT AT FIXED TOTAL ROWS** - more fetches means more, smaller payloads - crossed
with total rows and with storage. 30-column corpus, 3 repeats, cold (first) and warm (median of the
rest) reported separately.

### THE ROW GROUP IS THE UNIT OF QUERY COST — ~32-45 µs each, and file count is not in the law

> **CORRECTED 2026-08-24 from "~32 microseconds per FILE".** The constant survived; the **unit was
> wrong**, and it made file count look like the thing to design against. Three sections used to argue
> this separately and are merged here.

**The decisive experiment.** `ROW_GROUP_SIZE` is global per process, so two runs of
`parquet-query.mjs` at 25M over the same file counts, differing only in row-group size. Run B forces
5,000-row groups, which makes **all three file counts hold exactly 5,000 row groups** — 100 files of
250k rows becomes 50 groups each. Groups are **censused** with `parquet_file_metadata`, not inferred:

| files × rows/file | row groups A → B | Run A (default) | Run B (forced 5k) |
|---|---|---|---|
| 100 × 250,000 | 300 → 5,000 | **12 ms** | **195 ms** |
| 1,000 × 25,000 | 1,000 → 5,000 | **33 ms** | **181 ms** |
| 5,000 × 5,000 | 5,000 → 5,000 | **160 ms** | **158 ms** |

**Hold row groups constant and cost goes flat across a 50x range of file count** (195/181/158 — flat
to slightly inverted, most likely per-file scan parallelism). Re-chunk *the same 100 files* into more
groups and they go 12 → 195 ms: a **16x regression with file count untouched.**

**The law explains every earlier measurement**, including two cells the per-file reading never could.
DuckDB's default row group is **122,880 rows** and `writeParquet` inherits it (spot-checked: 250k rows
→ 3 groups, 25k → 1, 5k → 1):

| rows / files | rows per file | row groups | measured | **µs per row group** |
|---|---|---|---|---|
| 100k / 100 · 1M / 100 · 5M / 100 | 1k · 10k · 50k | 100 each | 4.0 · 4.2 · 4.1 ms | 40-42 |
| **25M / 100** | **250,000** | **300** | **12.0 ms** | **40** |
| 1M / 1,000 · 5M / 1,000 · 25M / 1,000 | 1k · 5k · 25k | 1,000 each | 33.2 · 33.2 · 33.6 ms | 33-34 |
| 5M / 5,000 · 25M / 5,000 | 1k · 5k | 5,000 each | 166.7 · 222.5 ms | 33 · 45 |
| **5M / 10** · **25M / 10** | 500k · 2.5M | 50 · 210 | 2.4 · 8.9 ms | 48 · 42 |
| 100k / 10 · 1M / 10 | 10k · 100k | 10 each | 0.8 ms | *floor* |
| **100M / 100** vs **100M / 1,000** | 1M vs 100k | **~900 vs 1,000** | **33 ms both** | 33-37 |

**Under a per-file law the `100 files` column had to be flat; 25M cost 12.0 ms against 4.0-4.2 ms**
because it held 3 groups per file instead of 1. And 100M's 100-file and 1,000-file cells are equal not
because "the per-file tax stopped mattering" but because **they hold the same number of row groups.**
The `floor` cells hold ten groups and sit under the ~0.8 ms cost of issuing any query.

**Run A is also the control for the recorded numbers**, taken on the same machine the same day:
100 files 12 ms (recorded 12), 1,000 files 33 ms (recorded 34), 5,000 files 160 ms (recorded 222 —
the noisy cell, and it is the expensive end that carries the effect).

**It is not only the thermometer.** At a constant 100 files, fragmenting the groups degrades the
searches spaces actually issues: `range + eq` 29 → 332 ms (**11.4x**), `2 predicates` 5 → 37 ms
(7.4x), `text prefix` 9 → 61 ms, `IN list` 10 → 55 ms, `agg: 1 key` 29 → 88 ms, `project 1 col`
22 → 47 ms — while `agg: quantiles` is unchanged at 556 ms. **Metadata cost is most of a cheap query
and a rounding error on an expensive one.**

**Materialising heals fragmentation.** Building a table from the fragmented corpus costs 1.44x more
(9,239 → 13,304 ms) but then queries **identically** (`count(*)` 1 ms either way), because
`CREATE TABLE AS` re-chunks into DuckDB's own row groups.

#### The design rule

> **Size payloads to hold at least one full row group (~123k rows), and never lower `ROW_GROUP_SIZE`
> on the producer.**

The second half is what the old framing could not see: **a large payload written with a small row
group is exactly as slow as a swarm of tiny payloads.** `DuckFrame.writeParquet` sets only
`FORMAT parquet, COMPRESSION zstd` and so inherits 122,880 — correct today, and silently load-bearing.

> **THE FIRST HALF IS UNREACHABLE FOR THE REAL PRODUCER — see §REAL SLICE SIZES.** `qpl-search-api`
> caps a slice at **100,000 records**, below the row group, so every payload it can emit is
> under-filled. The reachable form is "**consolidate on accumulated rows**" — and whether that pays is
> a break-even question, answered in §CONSOLIDATION vs NOT.


### VIEW vs inline `read_parquet` vs a real TABLE (2026-08-24)

`tools/probe/view-vs-inline.mjs`. Every Parquet number in these docs was taken through a **VIEW**, and
nobody had checked that a view costs what inlining the table function costs.

**The plans are NOT identical** — a view declared `SELECT * FROM read_parquet(...)` binds an extra
`PROJECTION` node — but the optimiser prunes it to zero columns and it **costs nothing**. 2M rows,
ratios against `inline read_parquet([...])`:

| variant | 10 files (200k rows each) | 500 files (4k rows each) |
|---|---|---|
| **`VIEW` over the list** | **0.94-1.00x** | **0.91-0.99x** |
| inline over a **glob** | 0.91-1.03x | 0.85-0.97x |
| **`VIEW` over the glob** | 0.94-1.02x | 0.85-1.00x |
| **real TABLE** | 0.18-0.87x | **0.02-0.15x** |

1. **A VIEW is the same as inlining `read_parquet`.** The recorded view numbers describe what a caller
   writing `read_parquet` directly would get.
2. **A GLOB is the same as an explicit path array**, including at 500 files where a per-query
   directory listing would have shown. Not a performance decision.
3. **The gap to a real table is entirely ROW-GROUP FILL** — the law again, from a third bench:

| | rows/file | row groups | view `count(*)` | table | table's edge |
|---|---|---|---|---|---|
| 10 files | 200,000 | ~20 | 1.16 ms | 0.26 ms | 4.5x |
| 500 files | 4,000 | 500 | 17.26 ms | 0.31 ms | **56x** |

> **"A view matches a table on real queries" is TRUE ONLY AT GOOD ROW-GROUP FILL.** The 100M
> measurement behind that claim used 100 files of 1M rows — 9 full groups each. Quoting it for a worker
> writing 4k-row payloads would be wrong by a factor of 50.

### When materialising pays for itself

Build cost against the per-query penalty, averaged over the eight query shapes:

| rows / files | view penalty per query | table build (memory) | table build (file) | queries to pay back |
|---|---|---|---|---|
| 1M / 1,000 | 27.7 ms | 388 ms | 1,811 ms | 14 (memory) · 66 (file) |
| 5M / 5,000 | 146 ms | 1,193 ms | 2,640 ms | 9 · 18 |
| 25M / 5,000 | 152 ms | 4,309 ms | **13,552 ms** | 29 · **95** |

A file-backed table over 25M rows takes **13.6 s to build and 2.67 GB on disk**. For a job that
appends constantly and aggregates rarely, that is 95 queries of runway before materialising wins.

### The real query battery at 100M rows

`count(*)` is a thermometer, not a workload - it touches no column data. Warm milliseconds over
100M rows, 30 columns:

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

**On real queries the gap is much smaller than `count(*)` suggests.** A selective filter is 143 ms on
a 100-file view against 141 ms on a materialised table - identical. `group by high card` is 380 vs
400, and `project all cols` is *faster* on the view. The table only wins decisively on the queries
that are already cheap.

**Materialising 100M rows costs 31.9 s and 11.3 GB on disk** (file-backed), or 27.9 s in memory -
and the in-memory table then performs WORSE than the view on several shapes (`project all cols`
1,278 ms against the view's 56 ms), because an 11 GB table on a 36 GB box is under memory pressure.
**At 100M, materialising in memory is counterproductive.** Payback against a file-backed table is
**158 queries**.

### S3 — measured against real minio, and the defaults are the whole story

Same image, version and credentials `ts-scripts` uses (`minio/minio:RELEASE.2024-08-29T01-40-52Z`,
port 49000, `minioadmin`), on localhost - so the round-trip is ~0 and this isolates protocol and CPU
cost with the network removed.

**Every relevant `httpfs` setting is OFF by default, and turning them on changes the answer by an
order of magnitude.** The first version of this section reported that remote Parquet issues 2-5
requests per file per query and transfers the whole corpus regardless of projection. That was true,
and it was measuring the absence of caching rather than a property of remote Parquet.

| profile | settings |
|---|---|
| `default` | everything off, as shipped |
| `metadata-cache` | `enable_http_metadata_cache`, `parquet_metadata_cache` |
| `cache-all` | the above plus `httpfs_connection_caching` |
| `prefetch-all` | the above plus `prefetch_all_parquet_files` |

#### What the caches do to requests and bytes

Counted on an instrumented HTTP origin, 1M rows over 100 files:

| query | default reqs/file | default bytes | **cached** reqs/file | **cached bytes** |
|---|---|---|---|---|
| `count(*)` | 2.0 | 40.7 MB | **0.7** | 13.4 MB |
| search, 2 predicates | 3.0 | 40.7 MB | **1.0** | **5 KB** |
| project 1 col | 3.0 | 44.3 MB | **1.0** | 3.5 MB |
| agg, 1 key + 3 aggs | 5.0 | 47.4 MB | **3.0** | 6.6 MB |
| project all cols | 2.0 | 41.1 MB | **0.0** | 381 KB |

**Projection and predicate pushdown DO work over S3 - they just cannot work without the metadata
cache.** A two-predicate search goes from transferring 40.7 MB, the entire corpus, to **5 KB**: that
is row-group pruning doing exactly what it is supposed to. Without the cache the reader re-reads
every footer on every query and falls back to bulk fetches. (Byte figures are averaged over three
repeats including the cold one that populates the cache, so steady-state is lower still.)

#### What that does to the numbers

Warm ms, 1M rows:

| files (rows each) | local disk | s3 default | **s3 cache-all** |
|---|---|---|---|
| 100 (10k) | 3-4 | 16-17 | **5-6** |
| 1,000 (1k) | 28-32 | 137-145, then FAILED | **42-49** |
| 5,000 (200) | — | could not run | **188-216** |

**With the caches on, S3 is ~1.5x local disk instead of 4-6x**, and at 100 files it is within a
couple of milliseconds of local. `prefetch_all_parquet_files` adds nothing over `cache-all`;
`metadata-cache` alone captures most of the win and connection caching supplies the rest.

**`httpfs_connection_caching` also fixes a failure, not just a slowdown.** At 1,000 files the default
profile exhausted connections mid-run (`Could not connect to server`) and 5,000 files would not start
at all. With connection caching both complete. A single-node minio on localhost is not S3, so read
that as "socket churn is a real failure mode at high file counts", not as a specific limit.

#### What this means for real S3

The round-trip here is ~0. On real same-region S3 add 20-100 ms per cold request, and the multiplier
is the **cached** request count, not the default one:

    extra latency per query  ~=  requests/file x files x round-trip / parallelism

At 1 request per file, 20 ms RTT, 1,000 files and ~14-way concurrency that is **~1.4 s of latency per
query** - against ~20 s if the caches are left off at 3 requests per file. **The single highest-value
configuration decision for remote payloads is turning these on**, and they are off by default.

File count still dominates remotely - 100 files is 5 ms and 5,000 files is 200 ms on a zero-latency
endpoint - so the local design rule (**at least one row group per payload, ~123k rows**) matters more
on S3, not less.

### What is NOT affected by file count

`group by high card` is 115-136 ms at 10, 100 and 1,000 files, and 230 ms at 5,000 - the aggregation
dominates the scan, so the metadata tax is a smaller share of an expensive query than of a cheap one.
The tax hurts *cheap* queries most, proportionally, which is the opposite of the usual intuition.
Confirmed independently by the 2026-08-24 fragmentation run, where `agg: high-card group` moved 1.1x
and `agg: quantiles` not at all, while a two-predicate search moved 7.4x.

One anomaly worth not reading into: a single `group by low card` cold sample at 25M / 100 files /
file-backed came in at 904 ms against a 124 ms warm - a first-touch page-cache effect, not a pattern;
every other cold/warm pair in that row is within 2x.

## Storage formats — the NATIVE format against every format DuckDB reads (2026-08-24)

`tools/bench/storage-formats.mjs`. The "Parquet as the table" work above compares exactly two things,
a native table and a Parquet view, and never asked what the native format *is* or whether some other
format DuckDB reads would beat Parquet at the worker. This measures all of them on one corpus.

**Method, and the fairness rules it holds.** The corpus is generated ONCE into the native table; every
other format is a `COPY` of that same table, so no generator variance can reach a size or query number.
The native table is checkpointed, **armed and verified** before its size or queries are read (an
uncompressed native table is a different artefact, and a plain `CHECKPOINT` silently declines at some
sizes). Row group size is left at the default everywhere — it is the unit of query cost, so varying it
here would confound this question with a settled one. **One file per format**, because file count is a
separate measured axis and mixing it in would repeat the confound that produced the per-file error.
The battery is the same 15 queries as `parquet-query.mjs`.

### What DuckDB's native format actually is (v1.5.5, read off the build)

- a **single database file** in **256 KiB blocks** (`default_block_size` = 262144), written backward
  compatible to `storage_compatibility_version` **v0.10.2**
- columns in **row groups of 122,880 rows** — the *same* constant as DuckDB's default Parquet row
  group, which is why §THE ROW GROUP IS THE UNIT transfers between the two
- **per-segment compression, chosen automatically per column.** At 25M rows the 30-column corpus
  picked: Constant 10,500 · BitPacking 7,250 · FSST 3,860 · ALP 3,543 · Dictionary 2,000 · ALPRD 750 ·
  RLE 500 · Uncompressed 500. **1.7% stays Uncompressed** at every scale measured — some segments have
  no scheme that beats it
- min/max **zone maps** per row group, ART indexes where declared, MVCC and a WAL. **None of that
  exists in Parquet**, which is the structural reason it wins on cheap queries

Against that, native gets no credit for being open — nothing else reads it, and the format is
version-pinned.

### Size — Parquet+zstd is 4x SMALLER than native, and the ratio is scale-invariant

| format | @5M | @25M | vs native | MB per million |
|---|---|---|---|---|
| **parquet + zstd** | 140 MB | **700 MB** | **0.25x** | **28.0** |
| parquet + snappy | 341 MB | 1,703 MB | 0.60x | 68.1 |
| **native `.db`** | 563 MB | **2,816 MB** | 1.00x | 112.6 |
| parquet uncompressed | 1,107 MB | 5,533 MB | 1.96x | 221.3 |
| Arrow IPC | 2,212 MB | 11,061 MB | 3.93x | 442.5 |
| CSV | 2,702 MB | — | 4.80x | 540.5 |
| NDJSON | 4,005 MB | — | 7.11x | 801.0 |

**The ratios are identical at 300k, 5M and 25M** — 0.25x / 0.60x / 1.96x / 3.93x across an 83x range.
And they agree with two measurements taken months apart by different scripts: 112.6 MB/million native
against the 244M run's 116 MiB/million, and 28.0 MB/million for Parquet+zstd against the wire's
22.8 MB/million. Three independent confirmations — treat these as planning numbers.

### Query — native wins, but by far less than its 4x disk premium

Whole-battery warm totals, 15 queries:

| source | @5M | vs native | @25M | vs native | `count(*)` @25M |
|---|---|---|---|---|---|
| native `.db` via `ATTACH` | 360 ms | 1.00x | **1,187 ms** | 1.00x | 0.2 ms |
| native via `read_duckdb()` | 355 ms | 0.99x | 1,182 ms | **1.00x** | 2.0 ms |
| TABLE from parquet (in memory) | 309 ms | **0.86x** | 1,201 ms | 1.01x | 0.7 ms |
| parquet uncompressed | 379 ms | 1.05x | 1,428 ms | 1.20x | 5.1 ms |
| parquet snappy | 421 ms | 1.17x | 1,578 ms | 1.33x | 5.0 ms |
| **parquet zstd** | 452 ms | **1.26x** | **1,671 ms** | **1.41x** | 5.3 ms |
| Arrow IPC | 5,503 ms | 15.29x | 35,485 ms | **29.91x** | 2,237 ms |
| CSV | 6,028 ms | 16.75x | — | — | 530 ms |
| NDJSON | 6,323 ms | 17.57x | — | — | 868 ms |

**Parquet+zstd costs 26-41% on queries to save 75% of disk**, and the penalty grows with scale
(1.26x → 1.41x), so extrapolate upward, not flat.

**The penalty lands entirely on queries that are already cheap.** At 25M, native against Parquet+zstd:

| query | native | pq zstd | |
|---|---|---|---|
| `count(*)` | 0.2 ms | 5.3 ms | 27x |
| project 1 col | 4.4 ms | 26.4 ms | 6.0x |
| agg: 1 key + 3 aggs | 11.0 ms | 35.9 ms | 3.3x |
| search: top 100 rows | 265 ms | 552 ms | 2.1x |
| **agg: high-card group** | 126.5 ms | **124.2 ms** | **parquet faster** |
| **agg: quantiles** | 512 ms | 530 ms | **equal** |

Same shape as the row-group law: metadata cost is a large fraction of a cheap query and a rounding
error on an expensive one. **If the workload is aggregations, the format barely matters.**

### Two results worth acting on

**1. At scale, the SMALLEST Parquet file is also the FASTEST to load.** Materialising into a native
table, per source format:

| source | @5M | @25M | rows/s @25M |
|---|---|---|---|
| **parquet zstd** | 0.33 s | **1.89 s** | **13.3M** |
| parquet snappy | 0.32 s | 2.73 s | 9.2M |
| parquet uncompressed | 0.36 s | 3.85 s | 6.5M |
| Arrow IPC | 2.81 s | 15.16 s | 1.6M |

At 5M the three codecs are indistinguishable; **at 25M zstd is 2x faster than uncompressed**, because
I/O dominates decode once the file stops fitting comfortably in cache. This inverts the intuition that
compression costs ingest time — **the heavier the compression, the faster the load**. So there is no
tension between the wire format and the ingest path: zstd is right for both.

**2. In-memory materialisation stops paying between 5M and 25M.** `TABLE from parquet` is **0.86x** at
5M — faster than the native file — and **1.01x** at 25M with 2.76 s of setup. That is the same crossover
already recorded at 100M, where an 11 GB in-memory table performed *worse* than the view. **Materialise
in memory only at small scale.**

### Arrow IPC is decisively out — and the reason is instructive

It looked like the dark horse: columnar, no decode step. It is the worst columnar option on every axis
— **16x the size** of Parquet+zstd, **30x slower** to query at 25M, and **8x slower to load than
Parquet, slower even than CSV**.

The diagnosis is in the thermometer: `count(*)` costs **2,237 ms** against Parquet's 5.3 ms, and every
single query sits on a ~2.1-3.2 s floor. **Arrow IPC carries no row-group statistics DuckDB can use, so
there is no pruning and no metadata shortcut — every query is a full scan of the whole file.** That the
penalty doubled from 15x to 30x between 5M and 25M is exactly what a full scan predicts. Meanwhile
`project all cols LIMIT 5000` is 54 ms, right alongside every other format, which confirms raw read
speed is not the problem.

> **State this carefully.** Loading slower than CSV points at **`nanoarrow`'s reader**, not at Arrow
> IPC as a format — Arrow ought to be near-zero-copy. The supportable conclusion is "**`read_arrow` on
> this build is not competitive**". It is out either way, because that reader is what we would have to
> use.

### The determination

> **REVISED 2026-08-24, same day — see §NATIVE AT ITS BEST below.** Two things below were too strong.
> The **1.41x** is an unweighted sum over 15 queries, two of which are format-blind and contribute half
> the total; on queries where format matters native is **~2x**, and **native at its best is 1.8-8.1x**.
> And this whole section measured native with **both of its structural advantages switched off** — no
> index, and a scattered corpus so zone maps prune nothing. "Parquet+zstd on every axis" is not
> supportable. The conclusion that survives is narrower and is restated at the end of that section.

1. **Keep Parquet+zstd, for the wire AND for storage.** Smallest by 4x, within 26-41% of native on
   queries, and the fastest source to materialise from. Nothing here challenges the wire decision.
2. **Query the payloads directly; materialise only when query volume justifies it** — and at scale
   materialise to a *file*, not memory.
3. **The native format earns its 4x disk premium only through query volume.** `read_duckdb()` is
   indistinguishable from `ATTACH` (1.00x), so it is a free convenience if one is ever held.
4. **Drop Arrow IPC, CSV and NDJSON.** Also: `iceberg`, `delta`, `avro` and `excel` are **not installed
   on this build** and need network to fetch, so no table format is currently reachable.
5. **Codec is a real dial if a worker re-queries hot local payloads**: snappy is 1.33x query at 2.4x
   zstd's size. But zstd wins on load, so this only pays for a read-heavy, disk-cheap deployment.

**What this does NOT measure:** one file per format (the multi-file axis is settled only for Parquet,
via the row-group law), and local disk with a warm cache. **On S3 the balance shifts further toward
Parquet+zstd**, since transfer volume starts to dominate and it moves a quarter of native's bytes.

## NATIVE AT ITS BEST — the fair fight, with an index and a sort (2026-08-24)

`tools/bench/native-advantages.mjs`. §Storage formats concluded "Parquet+zstd on every axis" while
giving the native format **none of what makes it a database**:

1. **no INDEX was ever created.** An ART index is native-only — Parquet cannot have one at any price —
   so every selective query in that battery was a full scan on *both* sides;
2. **the corpus is SCATTERED**, so min/max zone maps span the whole domain in every row group and
   prune nothing, on either format;
3. **the battery had no point lookup**, the one shape an index wins by orders of magnitude.

### THREE ZERO-MATCH PREDICATES — a defect in the shared battery, and the fix that matters

The shared battery filtered `category = 'cat-3'` and `category IN ('cat-1','cat-3','cat-7')` while the
generator produces **`alpha/beta/gamma/delta/epsilon`**. Both matched **zero rows, and always had** —
they timed scans whose filter never passed anything. Fixed in `parquet-query.mjs` and
`storage-formats.mjs`; the two `search:` rows in those tables measure less than their labels claim,
though every conclusion drawn from them holds, because both sides ran the identical query and the
other queries agreed.

Then this bench's own first draft did it **twice more**: `amount BETWEEN 500000 AND 501000` when
`amount`'s domain is **0-1000**, and a point lookup on `key-1234567` when `_key` is `key-${i}` with `i`
**restarting every generation chunk** — so only 100,000 distinct keys exist, each repeating ~50 times,
and that value never exists at any scale.

> **So: every bench that filters must PRINT WHAT ITS PREDICATES MATCH before it times anything.** A
> zero-match filter does not fail, it returns a plausible small number, and it is indistinguishable
> from a fast query in any output that reports only milliseconds. `native-advantages.mjs` prints a
> selectivity table first and flags any zero — it caught both of its own bugs on the first run.

### The variants, and what each isolates

| variant | | who can do it |
|---|---|---|
| `native plain` | the table as built | both |
| `native sorted` | rebuilt `ORDER BY amount` | both |
| `native+index` | ART indexes on `_key` and `name` | **native only** |
| `native sort+index` | both at once | index part is native only |
| `parquet` / `parquet sorted` | `COPY … zstd` | both |

### Best against best — native is 1.8-8.1x, not 1.41x

5M rows, warm ms, median of 4 repeats after the first:

| query | matched | native sort+index | parquet sorted | |
|---|---|---|---|---|
| point lookup (50 rows) | 50 | **1.13** | 9.07 | **8.1x** |
| equality, high-card col | 49 | **0.22** | 1.44 | **6.6x** |
| wide range on sort key | 60% | **1.16** | 3.44 | 3.0x |
| count(*) | — | **0.32** | 0.88 | 2.8x |
| 2 predicates (low card) | 10% | **1.79** | 4.40 | 2.5x |
| narrow range on sort key | 0.1% | **0.75** | 1.67 | 2.2x |
| agg: high-card group | — | **1.78** | 3.21 | 1.8x |

Plain against plain is 1.2-3.2x. **So native's real advantage is 1.8-8.1x on selective work, and the
earlier 1.41x understated it by hiding the distribution inside an average.**

### Each advantage isolated — and the sort is the bigger lever, for BOTH formats

| query | index alone | native sort | native both | **parquet sort** |
|---|---|---|---|---|
| point lookup | **3.61x** | 0.78x | 5.08x | 0.92x |
| equality, high-card | **6.43x** | 15.68x* | 30.73x* | 6.21x* |
| narrow range on sort key | 1.04x | 3.79x | 3.91x | **4.64x** |
| wide range on sort key | 1.01x | 3.16x | 2.95x | 2.29x |
| 2 predicates (low card) | 1.14x | **0.76x** | **0.73x** | **0.87x** |
| count(*) | 1.11x | 1.07x | 0.86x | 1.00x |
| agg: high-card group | 1.01x | 11.23x* | 10.98x* | 7.08x* |

**\* ARTEFACT — do not generalise these three rows.** `name` is `name ${Math.floor(r * 100000)}` and
`amount` is `Math.round(r * 1000000) / 1000`: **both are functions of the same `r`**, so sorting by
`amount` perfectly sorts by `name` too. The 15.68x on a `name` equality and 11.23x on a `name`
group-by are correlated synthetic columns, not a property of sorting. Real data would have to be
genuinely correlated to see this.

The rows that DO generalise:

- **An index helps equality and nothing else** — 3.61x on a point lookup, 6.43x on high-card
  equality, and **1.0x on every range, aggregate and low-cardinality predicate**. Exactly what an ART
  index is for, and no more.
- **Sorting is worth 2.3-4.6x on ranges over the sort key, and it helps Parquet as much as native**
  (narrow range: parquet **4.64x** against native's 3.79x). Row-group min/max statistics exist in both
  formats. **Sorting is not a native-only advantage — the index is the only exclusive one.**
- **Sorting makes some queries WORSE** — 0.76x native / 0.87x parquet on the low-cardinality
  two-predicate filter, 0.78x on the point lookup.

### The cost of sorting, which nobody had priced

| | plain | sorted | |
|---|---|---|---|
| parquet zstd on disk | 140.2 MB | **231.0 MB** | **+65%** |

**Sorting by one column cost 65% more disk**, because `category`, `status`, `active` and the rest were
generated in `i` order — periodic, and ideal for RLE and dictionary encoding. Sorting by `amount`
scatters all of them. That is the same mechanism that makes some queries slower after sorting, and it
is the caution the recorded "sort-on-ingest for zonemap pruning (16 s -> 1.6 s)" item does not carry:
**sorting optimises ONE column's locality by destroying every other column's.**

Build costs, per 5M rows: rebuild-sorted **1.5 s**, index on `_key` **1.0 s**, index on `name`
**2.2 s**. The native file holding two indexes *and* a sorted copy reached 1,364 MB against 563 MB
plain — but that includes a second full copy of the data, so it is **not** a clean index-size figure
and should not be quoted as one.

### The determination, restated

1. **Native is meaningfully faster where it counts: 1.8-8.1x on selective and point-shaped queries**,
   and an index is a capability Parquet structurally cannot match.
2. **It still loses for THIS worker**, and for a reason that has nothing to do with query speed:
   the workload is **append-dominated**. Querying payloads directly makes ingest free, and 17-52
   appends already consume one aggregation's worth of advantage. Native's 2-8x on selective queries
   only pays if queries are frequent relative to appends.
3. **So the decision is a workload question, not a format question** — and the workload has never
   been characterised. The open item "instrument real queries for which of the 205 functions they use
   and at what cardinality" should also capture **query shape** (point/selective/aggregate) and the
   **append:query ratio**. That single measurement decides this.
4. **If native is ever chosen, sort deliberately and index narrowly.** The sort costs 65% disk and
   slows unrelated predicates; the index only ever helps equality on the indexed column.
5. **Nothing here changes the wire format.** Parquet+zstd remains smallest, fastest to load, and the
   sort advantage is available in Parquet too.

## REAL SLICE SIZES — the 100k cap, and why stitching is dominated by materialising (2026-08-24)

`tools/bench/slice-payloads.mjs` and `slice-payloads-s3.mjs`.

### The constraint that invalidates the recorded design rule

**`qpl-search-api` cannot return more than 100,000 records in a slice, and 10k-50k is common.**
DuckDB's default Parquet row group is **122,880 rows**. So **every payload the producer can possibly
emit is an under-filled row group** — 81% full at best, 8% full at 10k.

The rule recorded above — *"size payloads to at least one full row group, then stop worrying about
file count"* — was written for a producer that can choose its payload size. **This one cannot.** The
ceiling is below the row group, so the rule is unreachable by construction and the question becomes
whether the worker should **stitch payloads together**, and when.

### The law holds a third time, at real slice sizes

20M rows, `count(*)` warm, row groups censused:

| payload | files | row groups | µs per row group |
|---|---|---|---|
| 10,000 | 2,000 | 2,000 | **33.4** |
| 50,000 | 400 | 400 | **33.0** |
| 100,000 | 200 | 200 | **33.8** |

### What stitching buys, and it is entirely decided by slice size

Per query, raw payloads → stitched to full row groups. **Read per-query, not as a battery total** —
the total is dragged toward 1.0x by `top 100 rows`, which is scan-bound rather than metadata-bound:

| query | 10k payloads | 50k payloads | 100k payloads |
|---|---|---|---|
| `count(*)` | 66.7 → 5.7 ms — **11.7x** | 13.2 → 7.1 — 1.9x | **no-op** |
| selective filter | 132.8 → 12.1 — **11.0x** | 28.5 → 14.2 — 2.0x | **no-op** |
| range + eq | 130.8 → 24.1 — 5.4x | 32.1 → 23.9 — 1.3x | **no-op** |
| project 1 col | 68.8 → 18.0 — 3.8x | 23.5 → 18.4 — 1.3x | **no-op** |
| top 100 rows | 574 → 307 — 1.9x | 344 → 297 — 1.2x | **no-op** |

**At 100k payloads stitching is a genuine no-op**: 200 payloads already make 200 row groups and the
best any merge can reach is 163, so there is nothing to win. **At 10k it is 11x on exactly the queries
spaces issues.** Slice size alone decides it — which means **the worker must trigger stitching on
ACCUMULATED ROWS, not on a payload count**, because slice size varies with what the query returns.

### One big file ties stitched-many, is cheaper to build, and wins on metadata

| | files | row groups | `count(*)` | selective | build |
|---|---|---|---|---|---|
| stitched | 167 | 167 | 5.7 ms | 12.1 ms | **14.7 s** |
| **ONE big file** | 1 | 162 | **2.8 ms** | 13.4 ms | **4.3 s** |

Identical on real queries — **file count confirmed irrelevant for the fourth time** — but 2x cheaper
on `count(*)`, because one footer is parsed instead of 167, and **3.4x cheaper to build**, being one
`COPY` instead of 167. Per-group cost drops to 17-28 µs in a single file against 33-36 µs spread
across many, so consolidating files is worth something *on top of* filling row groups. It is the one
place file count is not entirely free.

### THE RESULT THAT CHANGES THE RECOMMENDATION: a table is cheaper than stitching

| from 2,000 payloads at 20M | build | `count(*)` | selective | top 100 |
|---|---|---|---|---|
| stitch → 167 files | 14.7 s | 5.7 ms | 12.1 ms | 307 ms |
| merge → 1 file | 4.3 s | 2.8 ms | 13.4 ms | 308 ms |
| **`CREATE TABLE AS`** | **2.6 s** | **0.4 ms** | **8.6 ms** | **140 ms** |

**Writing a native table costs LESS than rewriting Parquet** — **NOT GENERALLY TRUE; see §THE
2026-08-25 REPORT MEASUREMENTS §4, where it is 9.8x the other way from a jagged input.** This holds
only when consolidating MANY TINY payloads, where decode dominates. Original reasoning: because Parquet+zstd's compression is
the expensive half and the native format uses lightweight schemes. So the table is **cheaper to
produce AND 2-20x faster to query** than either Parquet layout.

**The whole case for querying payloads directly was "ingest is free".** The moment stitching enters,
ingest is not free — a full rewrite has been paid — and at that point a table would have been the
better buy. **Stitching is dominated by materialising**, and the three options collapse to:

1. **Do not stitch.** Correct at ~100k slices, where the tax is already near its floor.
2. **Materialise.** Correct whenever a rewrite was going to be paid anyway.
3. **Stitch.** Justified only when the data must STAY Parquet — S3, restartability, portability, or
   sharing across workers.

### The floor nobody can get under

Stitching cannot produce fewer than `total_rows / 122,880` row groups. At 1B rows that is **8,138
groups ≈ 285 ms of metadata on every query**, no matter how it is arranged. That is the one argument
for materialising that does **not** depend on query volume: a table's row-group metadata is resident,
where Parquet's is re-parsed per query.

### On S3 — the consolidation win is larger, not smaller

5M rows as 500 payloads of 10k, against one merged file, on real minio:

| origin | | `count(*)` | selective | project 1 col | top 100 |
|---|---|---|---|---|---|
| local | many payloads | 17.0 | 36.6 | 16.8 | 140.2 |
| local | ONE big file | 0.9 | 4.3 | 5.6 | 87.0 |
| s3, caches OFF | many payloads | 30.3 | 31.7 | 30.9 | 139.1 |
| s3, caches OFF | ONE big file | 1.7 | 4.0 | 6.5 | 85.9 |
| **s3, caches ON** | many payloads | 6.2 | 29.4 | 30.4 | 129.9 |
| **s3, caches ON** | **ONE big file** | **0.2** | **2.0** | **4.6** | **83.1** |

One file against many: **19.1x local, 17.7x S3 caches-off, 29.4x S3 caches-on** on `count(*)`; 8.5x /
7.9x / 14.4x on a selective filter. **Consolidation matters MORE on S3 than locally, and most of all
once the caches are on.** The caches help many-payloads on metadata (30.3 → 6.2 ms) but barely at all
on a selective filter (31.7 → 29.4).

> **Do not read these as "S3 is as fast as local disk".** This is **localhost minio with a
> sub-millisecond round-trip**, which deliberately removes the network to isolate protocol and CPU
> cost. Real same-region S3 adds **20-100 ms per cold GET**, and the per-file request count from
> `parquet-remote.mjs` is 2-5. At 500 payloads that is 1,000-2,500 requests for a single query.
> **The many-payload layout is far worse on real S3 than these numbers show; the one-file layout is
> the one that survives.**

## CONSOLIDATION vs NOT, crossed with LOCAL vs S3 (2026-08-24) — the decision, measured

`tools/bench/consolidation-matrix.mjs`. 20M rows, three slice profiles, both origins.

**The architecture, because it was gotten wrong repeatedly before this bench existed.**
`qpl-search-api` is **stateless and distributed** — one request, ≤100k records, Parquet returned over
the wire; consecutive slices may hit different instances, so **it cannot batch, ever**. The
**qpl-worker is the only stateful component**, and it **receives every payload's bytes**. So the only
choice available is what the worker does with a payload in hand: persist it as-is, or hold several and
write one bigger object.

**Consolidation is NOT free** — an earlier note here said it was, and that was wrong. The two paths are
different operations:

| path | what the worker does | cost |
|---|---|---|
| no consolidation | persists received bytes **verbatim** | a byte copy, no decode |
| consolidation | **decode N payloads → merge → re-encode + zstd** | real CPU, scales with DATA |

### Land cost — and consolidating into FEWER, BIGGER objects is ~3x cheaper

| profile | slices | byte copy | → ≥123k rows | → ~2M rows |
|---|---|---|---|---|
| variable (10k-100k, avg 56k) | 354 | 0.37 s | 14.61 s (**39.3x**) | **4.40 s** (11.8x) |
| fixed 10k | 2,000 | 2.19 s | 13.89 s (6.3x) | **4.62 s** (2.1x) |
| fixed 100k | 200 | 0.99 s | 12.27 s (12.4x) | **4.61 s** (4.7x) |

**Targeting ~2M rows per object is 3x cheaper to build than targeting the 122,880-row group**, because
the cost is **per COPY STATEMENT, not per row** — 10 outputs against 100-154. Same lesson the append
work learned. **So "stitch to one row group" was the wrong target; bigger batches are cheaper AND
query faster.**

### Query cost — the payoff is entirely decided by slice size

Warm ms, LOCAL:

| profile | layout | objects | groups | `count(*)` | selective | range+eq | agg | top 100 |
|---|---|---|---|---|---|---|---|---|
| **fixed 10k** | no consolidation | 2,000 | 2,000 | 58.0 | 141.8 | 142.6 | 65.9 | 510.9 |
| **fixed 10k** | **→ ~2M** | **10** | **170** | **7.4** | **12.0** | **23.1** | 23.8 | 331.3 |
| variable | no consolidation | 354 | 354 | 11.1 | 24.8 | 32.3 | 23.7 | 408.0 |
| variable | **→ ~2M** | **10** | **168** | **7.1** | **11.5** | 23.1 | 19.7 | 378.5 |
| fixed 100k | no consolidation | 200 | 200 | 6.1 | 13.9 | 23.8 | 20.7 | 391.9 |
| fixed 100k | → ~2M | 10 | 170 | 7.1 | 12.1 | 22.7 | 19.3 | 392.7 |

**At 100k slices consolidation buys nothing** — the two rows are identical within noise. **At 10k it is
12x** on selective queries. The realistic `variable` profile sits at ~2x.

### BREAK-EVEN — the number that actually decides it

Queries before consolidation repays its extra land cost:

| profile | local | S3 |
|---|---|---|
| **fixed 10k → ~2M** | **5 queries** | **5 queries** |
| variable → ~2M | **67 queries** | **51 queries** |
| fixed 100k → ~2M | 1,424 queries | 588 queries |
| any profile → ≥123k | 295 / 23 / 1,721 | 237 / 23 / NEVER |

### Consolidation also SHRINKS the data, which matters most on S3

| profile | unconsolidated | → ~2M | saved |
|---|---|---|---|
| fixed 10k | 764.5 MB | **514.0 MB** | **33%** |
| variable | 615.9 MB | 550.9 MB | 11% |
| fixed 100k | 584.2 MB | 561.5 MB | 4% |

zstd compresses better over larger blocks and shares dictionaries across more rows. **At 10k slices
that is a third off the S3 bill and a third less to transfer on every cold read** — a benefit that
exists independently of query speed, and that the break-even table above does not count.

### The determination — DEFAULT IS **DO NOT CONSOLIDATE**

> **A first version of this section recommended consolidating at the realistic slice mix. That was
> WRONG and is withdrawn.** The error is worth naming because it has now happened three times in this
> document: **the cost is paid ONCE PER JOB and the benefit is PER QUERY, so the decision needs the
> query count — and the recommendation was made without it.** These jobs are documented as
> append-dominated and *"aggregate rarely"*. A break-even of 67 queries is never reached by a job that
> runs a handful, so consolidation is pure loss there.

**The arithmetic, in full**, because break-even IS the decision and not a footnote to it:

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

**And the 60 ms is flattered by `top 100 rows`, which is 82% of that battery.** For aggregation-shaped
work, strip it: 91.9 ms → 61.4 ms saves only **30.5 ms**, and the variable break-even becomes
**132 queries**, roughly twice as bad as the headline.

So, with Q = queries run against the dataset:

1. **Q under ~50, which is what "aggregates rarely" means: DO NOT CONSOLIDATE.** Persist each payload
   as received — a byte copy, 0.37 s per 20M against 4.4 s to consolidate.
2. **Consolidate only when slices are consistently ~10k** (break-even **5 queries**, 12x on selective
   queries, and **33% smaller on disk**), or when Q is known to exceed ~50-130.
3. **At ~100k slices consolidation is actively harmful** — one cell measured **-1 ms/query** after
   paying 11.3 s.
4. **If consolidating, target ~2M rows, never ≥123k**, and buffer BEFORE the first write. ~2M is 3x
   cheaper to build (cost is per COPY STATEMENT, not per row) and no worse to query. Buffering before
   the first write avoids reading everything back out of storage.
5. **The one unmeasured term that could flip this** is real S3 per-object request latency: 354 objects
   x 2-5 requests x 20-100 ms RTT, against localhost minio's sub-millisecond round trip. If that is
   large, every break-even collapses and consolidation wins. **It needs a real S3 endpoint and has not
   been measured — do not assume it either way.**

> **What these numbers are NOT.** Land cost is local disk, isolating the byte-copy-vs-re-encode CPU
> difference — the portable finding. **Localhost minio has a sub-millisecond round trip and cannot
> represent real S3.** Real same-region S3 adds 20-100 ms per cold GET at 2-5 requests per file
> (`parquet-remote.mjs`), so multiply the OBJECT COUNT: 2,000 objects against 10 is the term that
> dominates on real S3 and every break-even above moves DOWN, in consolidation's favour.

## Scale — one table at 100M, 244M and 1B rows

**Everything above caps at 5M records because 5M is this harness's configured scale ceiling**, not
because `DataFrame` stops working there. That correction matters: an earlier version of this section
said `DataFrame` "does not reach further - several cases OOM before 5M", and the results file says
otherwise. **Exactly one case OOMs - `serialize for the wire` - at 1M, 3M and 5M.** Every other
`DataFrame` case completed at both 3M and 5M (`sort (2 keys)` 26.8 s at 3M, `from records` 30.9 s at
5M). So the OOM is a **dfjson serialization** limit, not a capacity limit, and `DataFrame` handles
millions to hundreds of millions of rows in production.

**And that one case does not reflect production either**: spaces STREAMS a result of that size rather
than serializing it whole, so `serialize for the wire` at 1M+ measures a shape nobody runs. Read it
as an upper bound on a path that is not taken, not as a limit.

This section is DuckFrame only because that is what was run at these sizes, and it answers a
different question: how big can ONE table get, and what does it cost to hold and query.

Measured 2026-08-20 on darwin / 14 cores / 36 GB. Full detail, including the reasoning and the two
earlier readings these corrected, is in `HANDOFF.md` §ONE TABLE AT SCALE, §A BILLION ROWS, MEASURED
and §RAM vs DISK AT A BILLION ROWS. Scripts: `tools/bench/scale-ingest.mjs` (the real worker ingest
path) and `tools/bench/billion.mjs` (a billion-row table end to end).

> **The two runs use DIFFERENT corpora, and the per-row disk figures look contradictory until you
> notice.** `scale-ingest.mjs` streams the **30-column** corpus used everywhere else in this document
> and measures **115.4 MiB per million rows** (least-squares over 244 checkpoint samples), so a 1B
> table of it is **~113 GiB**. `billion.mjs` builds a **12-column** table and measures **31.9 MiB per
> million**, so 1B of THAT is **31.1 GiB**. Both are right. Quote the one whose column count matches
> the question, and never quote a per-row size without the schema.

### Ingest, the real worker path

`scale-ingest.mjs`, streamed as 100k Parquet payloads with 10 appends in flight, checkpointing every
1M, into a file-backed database. The 100M run completed; a 1B attempt through this path was stopped
at **244M rows with no error at all** - no OOM, no disk exhaustion, nothing in the log.

| phase, at 100M | time | rate | note |
|---|---|---|---|
| generate (JavaScript) | 81.0 s | 1.23M rec/s | **not ingest** - subtract it. 8% of wall |
| produce (`writeParquet`) | 687.3 s | 145k rows/s | the api-server tier, a DIFFERENT machine |
| **append (worker, one table)** | **147.9 s** | **676k rows/s** | the number that matters: **1.48 s per million** — of which **31% is automatic checkpointing**, measured 2026-08-24 |
| checkpoint (100 of them) | 72.3 s | ~723 ms each | never slows ingest |
| wall clock | 1,008 s | | 16.8 minutes |

Queries on the finished **100M** table: `count(*)` 1 ms, filter + count 12 ms, group by 1 key 14 ms,
sort + limit 1,000 178 ms, `count(DISTINCT name)` 274 ms.

**Sizing rules from the 244M run.** Disk is dead linear - 116.0, 115.8, 115.6, 115.5 MiB per million
across the deciles - so it is a number to plan from. RAM is **not**: RSS wandered between 3.8 and
12.7 GiB with no stable trend, and the two defensible fits disagree by 1.8x on the 1B projection
(10.6 MiB/million → 18.0 GiB, versus 28.9 MiB/million over the last 100M → ~33 GiB). Checkpoint cost
stayed nearly flat while the table grew 24x - 706 ms at 20M, 864 ms at 244M - confirming a
per-CHECKPOINT rather than per-table cost model.

**`memory_limit` does NOT bound process RSS**, and this is the trap worth carrying: with the limit
verified applied at 3.7 GiB, a 20M ingest still reached **7,240 MB** - the same as the unlimited
run at that point. It bounds DuckDB's buffer manager; Node's heap, the Parquet writer and DuckDB's
non-buffer allocations sit outside it. **Do not size a container from `memory_limit`** - it ran ~2x
over here.

### A billion rows

`billion.mjs`, one file-backed table, 12 columns, `memory_limit 24GiB`, 14 threads. Built
server-side with `range()`: the JavaScript producer path is ~145k rows/s and would take ~114
minutes. Cardinality spans six orders of magnitude on purpose - `id` unique, `session_id` 100M,
`user_id` 10M, `name` 1M, `city` 50k, `category` 500, `country` 200, `status` 8.

| | |
|---|---|
| build | **686.2 s** (1.46M rows/s), of which CHECKPOINT 0.7 s |
| disk | **31.12 GiB** = 31.9 MiB per million, dead linear across all 20 batches |
| peak RSS | **17.97 GiB** during build, 22.02 GiB overall |
| streaming the whole table out | **1B rows in 12.7 s = 78.5M rows/s**, peak RSS 11.5 GiB |

**RSS sawtooths and the buffer manager does reclaim.** It climbed to 18.4 GiB at 550M, then fell to
10.3, 7.1, 3.7 and finished at 4.7 GiB with the table complete. It is bounded by
`memory_limit`-ish behaviour rather than by table size - but **size a container from the peak**,
~18 GiB against a 24 GiB limit.

> **A generator that does not SCATTER makes the size figure fiction.** `i % 500` produces a periodic
> run that RLE and dictionary encoding compress unrealistically well: measured at 20M rows,
> **16.6 MiB per million cyclic versus 31.9 MiB per million** with `hash(i * k) % N` at the same
> distinctness. Every figure here uses the scattered form; the cyclic one was overstating compression
> by 2x.

#### Queries on the finished billion-row table

| query | ms |
|---|---|
| `count(*)` | 16 |
| count WHERE selective (`user_id = ?`) | 119 |
| count WHERE numeric range | 109 |
| count WHERE date range (one month) | 198 |
| count WHERE 8-way key | 420 |
| top 100 by amount | 107 |
| `sum + avg + min + max` | 1,171 |
| month histogram | 1,351 |
| **filter + group + order (dashboard shape)** | **2,164** |
| group by `status` (8 keys) | 529 |
| group by `category` (500) | 469 |
| group by `country` (200) | 694 |
| group by `city` (50k) | 2,555 |
| group by `user_id` (10M) | 7,999 |
| **group by `name` (1M)** | **13,948** |
| group by 2 keys + 3 aggs | 2,166 |
| `count(DISTINCT user_id)` exact | 6,047 |
| `approx_count_distinct(user_id)` | **355** — 17x faster, same question |
| `median(amount)` | 24,526 |
| `quantile_cont([0.5, 0.9, 0.99])` | 29,418 |

Four things to take from this:

1. **Filters and low-cardinality group-bys are sub-second on a billion rows**, and a
   dashboard-shaped query - filter by month, filter by status, group, order, limit - is **2.2 s**.
2. **Group-by cost tracks the KEY COUNT, not the row count**: 8 keys 529 ms, 500 keys 469 ms, 50k
   keys 2.6 s, 1M keys 13.9 s. The jump is the hash table leaving cache, not the scan.
3. **`approx_count_distinct` is 17x faster than exact** and should be the default wherever an
   estimate will do.
4. **Exact quantiles are the outlier at 24-29 s** - they materialise. Prefer `approx_quantile`
   unless exactness is required.

### Streaming a billion-row join

`tools/bench/join-stream.mjs`, two `range()` tables, result drained chunk by chunk with RSS sampled
while rows are in flight.

| N x N | key | distinct | out rows | ms | rows/s | RSS before → peak |
|---|---|---|---|---|---|---|
| 10M | unique | 10M | 10M | 424 | 23.6M/s | 227 → 714 MB |
| 10M | mid | 1M | 100M | 3,541 | 28.2M/s | 714 → 1,123 MB |
| 100M | unique | 100M | 100M | 4,486 | 22.3M/s | 897 → 4,592 MB |

1. **Streaming the OUTPUT is not the constraint.** Emitting 100M rows held peak RSS at 1.1 GB;
   nothing accumulates, and throughput is ~22-28M rows/s regardless of result size.
2. **The hash BUILD side is what scales** - 714 MB → 4,592 MB for 10x the input, slightly
   sublinear. Extrapolated to 1B x 1B that is **~30-46 GB**, above this 36 GB box, so it would spill
   to `temp_directory` rather than run in memory.
3. **Key cardinality decides viability far more than table size.** A join on a key with C distinct
   values emits about N²/C rows:

   | 1B x 1B on… | rows out | at 22M rows/s |
   |---|---|---|
   | a UNIQUE key | 1e9 | **~45 seconds** |
   | a 1M-cardinality key | 1e12 | ~12.6 hours |
   | a 1k-cardinality key | 1e15 | not a thing |

   So "can we stream a join of two billion-row tables" is **yes on a unique or high-cardinality
   key**, and on a low-cardinality one the result set is the problem, not the memory.

## The spaces query lifecycle, end to end

The only section that measures the system rather than an operation. **Today** the api-server builds a `DataFrame` and serializes it to dfjson, and the worker deserializes every payload, appends them, and runs the query in JS. **On DuckFrame** the api-server writes Parquet+zstd, the worker inserts the payloads into one table with no coercion at all, and the whole query is one SQL statement.

The fetch itself is not simulated — that cost is identical either way.

### producer: records -> wire

| records | today | DuckFrame | difference |
|---|---|---|---|
| 1k | 7.9 ms | 15.4 ms | 1.9x slower |
| 5k | 39.6 ms | 40.7 ms | 1.0x slower |
| 10k | 78.3 ms | 73.9 ms | **1.1x faster** |
| 50k | 444.3 ms | 353.9 ms | **1.3x faster** |
| 100k | 864.1 ms | 693.4 ms | **1.2x faster** |
| 500k | 5.61 s | 3.52 s | **1.6x faster** |
| 1M | 11.9 s | 6.80 s | **1.8x faster** |

### worker: assemble payloads

| records | today | DuckFrame | difference |
|---|---|---|---|
| 1k | 4.6 ms | 3.1 ms | **1.5x faster** |
| 5k | 20.1 ms | 5.1 ms | **4.0x faster** |
| 10k | 39.7 ms | 7.5 ms | **5.3x faster** |
| 50k | 206.4 ms | 28.4 ms | **7.3x faster** |
| 100k | 424.5 ms | 53.9 ms | **7.9x faster** |
| 500k | 2.75 s | 262.8 ms | **10.5x faster** |
| 1M | 10.1 s | 223.9 ms | **44.9x faster** |

### worker: filter+agg+sort

| records | today | DuckFrame | difference |
|---|---|---|---|
| 1k | 3.1 ms | 0.8 ms | **3.9x faster** |
| 5k | 12.4 ms | 0.7 ms | **16.8x faster** |
| 10k | 21.9 ms | 0.8 ms | **27.3x faster** |
| 50k | 107.0 ms | 1.3 ms | **79.7x faster** |
| 100k | 221.7 ms | 2.0 ms | **112.1x faster** |
| 500k | 1.69 s | 2.5 ms | **672.6x faster** |
| 1M | 4.61 s | 4.3 ms | **1059.9x faster** |

## Reproducing this

```bash
cd packages/data-mate && pnpm build
node --max-old-space-size=16384 bench/comparison/run.js
```

`SCALES=1000,10000` for a quick pass, `RUNS=5` for more samples, `OUT=path.md` to send the report elsewhere. The heap flag matters: with the default heap `DataFrame` OOMs far earlier than it needs to, which would overstate the difference.

