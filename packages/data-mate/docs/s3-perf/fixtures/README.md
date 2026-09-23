# QPL fixtures — generation, layout, and what the sizes actually are

Deterministic Parquet fixtures for the DuckFrame / DuckDB query battery, plus the
real NOAA corpus. **One file per scale**, zstd-compressed.

## THE REAL DEPLOYMENT (verified 2026-09-09)

The bucket is **`duckdb`**, not `qpl-fixtures` — every earlier doc said the
latter, which does not exist, and following it produced a `404` that reads as a
broken config and is not one.

| | |
|---|---|
| S3 API | `minio-dev1.dev.tera4.lan` (**not** the `-console` host, which is the web UI) |
| scheme / style | `https`, `path`-style |
| TLS | private CA, `Terascope Root CA 1`. In the macOS keychain: `security find-certificate -a -c Terascope -p > ~/tera4-ca.pem`, then point `CA_CERT_FILE` at it. A PEM is optional — see the harness README |
| bucket | `duckdb` |

```
s3://duckdb/
  v1/100m/qpl-fixture-v1-100m.parquet    10.34 GiB   synthetic
  v1/1b/qpl-fixture-v1-1b.parquet       103.45 GiB   synthetic
  v1/noaa/noaa-isd-v5.parquet            22.87 GiB   REAL — 691,122,937 NOAA ISD records
```

**Two traps that each cost time.** `host` and `dig` report `NXDOMAIN` for every
`*.tera4.lan` name on a Mac, including ones that plainly work — they bypass the
system resolver's search domains, and only `getaddrinfo` (what Node and curl use)
resolves them. A **404 means the credentials were fine** and the bucket or prefix
is wrong; bad keys give a flat **403**.

---

## The layout, and why

```
s3://duckdb/
  v1/1m/    qpl-fixture-v1-1m.parquet       ← smoke-test scales
  v1/10m/   qpl-fixture-v1-10m.parquet
  v1/100m/  qpl-fixture-v1-100m.parquet
  v1/1b/    qpl-fixture-v1-1b.parquet
  v1/10b/   qpl-fixture-v1-10b.parquet
  v1/noaa/  noaa-isd-v5.parquet             ← real data, not a scale
```

One bucket, one prefix per scale, versioned, in order of how much each reason
matters: (1) **a flat bucket is a correctness hazard** — `S3_GLOB` defaults to
`**/*.parquet`, so with every fixture at the bucket root a run labelled "100M"
would silently answer with 11.1B rows; (2) **switching scale is one word**;
(3) **one bucket is one policy** in production — one set of credentials,
lifecycle rules and quota rather than three; (4) **`v1` lets a regenerated
fixture coexist** with the old one, so old numbers are never silently compared
against new data.

```bash
FIXTURE=100m ./run.sh all       # 1m, 10m, 100m, 1b, 10b, noaa
FIXTURE=1b   ./run.sh battery
```

An explicit `S3_PREFIX` overrides `FIXTURE`, so pointing at real non-fixture data
still works; an unknown value is rejected by name rather than silently producing
an empty glob.

---

## Generating, uploading, verifying

Generated files live in **`~/fixtures/qpl/`** — outside any git repo, on a
durable volume rather than `/private/tmp` (macOS purges it on reboot), and never
in the repo: `.gitignore` is not the guard here, distance is.

```bash
# generate-fixture.mjs
#   --scale <1m|10m|100m|1b|10b>   one of the shipped scales
#   --rows <n>                     an arbitrary row count instead of a scale
#   --out <dir|s3://bucket/prefix> destination (required unless --dry)
#   --name <file.parquet>          override the generated name
#   --level <n>                    zstd compression level (default 9)
#   --env                          read S3 settings from the harness env file
#                                  — REQUIRED for an s3:// destination
#   --dry                          print the plan and the SQL, write nothing
node fixtures/generate-fixture.mjs --scale 100m --out /data/fixtures
node fixtures/generate-fixture.mjs --scale 1b --out s3://duckdb/v1/1b --env
node fixtures/generate-fixture.mjs --scale 100m --dry
node fixtures/generate-fixture.mjs --rows 5000000 --out /tmp --name probe.parquet

# upload-fixture.mjs — --scale, --from <dir>, --bucket <name> all required
node fixtures/upload-fixture.mjs --scale 100m --from ~/fixtures/qpl --bucket duckdb

# inspect-fixture.mjs — <path|s3://url> [--env]; --env required for s3://
node fixtures/inspect-fixture.mjs ~/fixtures/qpl/qpl-fixture-v1-1b.parquet
node fixtures/inspect-fixture.mjs s3://duckdb/v1/100m/qpl-fixture-v1-100m.parquet --env

# extract-noaa.mjs — builds the real corpus from OpenSearch
node fixtures/extract-noaa.mjs                         # fetch every index to parts
node fixtures/extract-noaa.mjs --index noaa-isd-v5-2026.03   # one index, smoke test
node fixtures/extract-noaa.mjs --merge                 # parts -> one file
node fixtures/extract-noaa.mjs --upload --bucket duckdb
```

`MEMORY_LIMIT`, `TEMP_DIRECTORY` and `THREADS` are read from the environment by
the generator; `extract-noaa.mjs` additionally reads `ES_URL`, `INDEX_PATTERN`,
`OUT_DIR`, `SLICERS`, `FETCHERS`, `FETCH_SIZE`, `RETRIES`, `REQUEST_TIMEOUT_MS`,
`WORKER_MEMORY_LIMIT` and `MERGE_MEMORY_LIMIT`.

Generation runs **entirely inside DuckDB** (`range(n)` plus expressions) and is
deterministic — every value derives from `hash(row_index)`, so any scale
regenerates byte-identically anywhere. `upload-fixture.mjs` verifies the remote
object by re-checking row count and the battery's selectivity, which catches a
truncated transfer without hashing hundreds of gigabytes; `inspect-fixture.mjs`
reports content, layout cost (row groups, footer read time), the widest columns,
and **the battery's selectivity**, which must stay stable across regenerations or
the benchmark quietly changes meaning.

**For the large scales, generate straight to S3.** DuckDB has no S3 PUT of a
local file, so `upload-fixture.mjs` re-encodes (a full read plus a full write),
while `generate-fixture.mjs --out s3://... --env` skips the local round trip.

---

## Sizes — measured, not estimated

**~106 MB per million rows** — 105.96 at 1M, 107.10 at 10M, 105.93 at 100M and
105.78 at 1B, flat across a 1000× range.

| scale | rows | size | generation | row groups | footer read |
|---|---|---|---|---|---|
| 1m | 1,000,000 | 0.11 GB | 2 s | 9 | <1 ms |
| 10m | 10,000,000 | 1.05 GB | 19 s | 82 | ~2 ms |
| **100m** | 100,000,000 | **10.34 GB** | **186 s** | 814 | **12.5 ms** |
| **1b** | 1,000,000,000 | **103.45 GB** | **1,857 s** (31 min) | 8,139 | **129.2 ms** |
| **10b** | 10,000,000,000 | **~1.03 TB** *(projected)* | ~5.2 h | ~81,400 | ~1.25 s |

100M and 1B are measured; 10B is projected, and the projection is trustworthy —
the 1B footer read was predicted at ~125 ms and measured 129.2 ms.

**The footer column is the cost of the single-file choice**: the whole footer is
parsed to plan ANY query, `count(*)` included, before a single value is read, so
at 10B that is roughly 1.25 s on every query.

**10B does not fit on a 1 TB workstation** alongside the other scales, so generate
it straight to S3. The generator already raises `s3_uploader_max_filesize`, which
DuckDB defaults to **800 GB** — a ~1.03 TB object would otherwise fail the write
after five hours.

### Why not 28 MB/million, as the report recorded

That figure came from the JS generator, which builds values with `i % N` and
linear sequences (`total: 1000000 + i * 7`, `email: user${i}@example.com`);
`HANDOFF.md` records the consequence — **it compresses about 2× better than real
data.** The tell is in the report's own table: 29.21, 28.14, 28.11, 28.02, 28.01
MB/million across a **1000×** range means every row is equally novel, which is
what a periodic generator produces and real data never does.

**A fixture that compresses better than production makes every query measured
against it optimistic, permanently.** These fixtures are built to resist that.

### Why cardinality barely moves the number

Measured directly, one VARCHAR column over 1M rows:

| distinct values | bytes/row |
|---|---|
| 100 | 0.9 |
| 10,000 | 2.0 |
| **122,880** (= one row group) | **4.0** |
| 1,000,000 | 4.3 |
| 100,000,000 | 5.9 |

**Parquet dictionaries are scoped to the ROW GROUP, not the file**, so nearly all
the compression benefit is consumed by the time cardinality reaches the row-group
size (122,880) — which is why bytes/row is flat across scales for both generators,
and why cutting `email` from 1e9 to 2e6 distinct changed the total by under 8%.
To compress like production you must drop cardinality **below** ~122,880 per
column or introduce real data's row-level *locality*; raw cardinality is the
wrong lever.

---

## What the battery costs on these fixtures

Local disk, `memory_limit 12GiB`, warm median of 3. The shapes span a **296×
range** at 1B, which is why the fixture needs more than a `count(*)`.

| query | 100M | 1B |
|---|---|---|
| `count(*)` [metadata only] | 13 ms | **138 ms** |
| search: 2 predicates | 68 ms | 681 ms |
| search: range + eq | 132 ms | 1.59 s |
| search: text prefix (`LIKE`) | 224 ms | 2.47 s |
| search: IN list | 111 ms | 1.13 s |
| **search: top 100 rows (`SELECT *`)** | **3.67 s** | **40.81 s** |
| agg: 1 key + 3 aggs | 180 ms | 2.32 s |
| agg: 2 keys + 3 aggs | 239 ms | 2.92 s |
| agg: high-card group | 304 ms | 3.26 s |
| agg: filtered + ordered | 120 ms | 1.56 s |
| agg: count distinct | 278 ms | 3.01 s |
| agg: approx distinct | 157 ms | 1.83 s |
| **agg: quantiles** | **2.28 s** | **29.66 s** |
| project 1 col | 90 ms | 888 ms |
| project all cols (`LIMIT 5000`) | 67 ms | 606 ms |

- **`count(*)` is answered from the footer and scans nothing** — 138 ms at 1B is
  the footer parse, so quoting it as "query performance" measures the metadata
  path only.
- **Two shapes dominate**: the wide top-N (40.81 s) and quantiles (29.66 s) are
  together **74% of the battery total**, so decompose before quoting any "the
  battery improved by X%" claim.
- **`LIMIT` without `ORDER BY` is nearly free** (606 ms for all columns) while
  `LIMIT` *with* `ORDER BY` is the most expensive shape — 67× apart, because one
  streams and the other cannot know the top 100 until every row is seen.

Scaling is close to linear 100M→1B on every shape (9-12× for a 10× row count),
which is the expected result for scan-bound work and a useful check that a
fixture is behaving.

---

## Compression — what helps, what does not

The fixtures are **zstd inside the Parquet**: every one of the 1B fixture's
276,726 column chunks is `ZSTD`, taking 288.84 GB down to 103.30 GB (**2.80×**).

### The full codec matrix, 10M rows

| Parquet codec | size | scan | + `gzip -6` | gzip time |
|---|---|---|---|---|
| **uncompressed** | 2.890 GB | **37 ms** | **1.030 GB** | 66 s |
| snappy | 1.469 GB | 46 ms | 1.165 GB | 48 s |
| gzip *(internal)* | 1.029 GB | 122 ms | 1.018 GB | 18 s |
| lz4_raw | 1.516 GB | 45 ms | 1.089 GB | 59 s |
| zstd L3 | 1.034 GB | 59 ms | 1.031 GB | 16 s |
| **zstd L9** | **0.932 GB** | 56 ms | 0.930 GB | 14 s |

**Gzip on raw Parquet genuinely works** — 2.890 GB to 1.030 GB, a real 2.8× — and
loses anyway: **10.5% BIGGER** than the zstd L9 Parquet at 0.932 GB, at 66 s
against 14 s, so it gives up random access to end up with a larger file. **And a
gzipped Parquet is not a Parquet**: the format is a random-access container
(footer, row-group pruning by statistics, then only the needed column chunks) and
wrapping the whole file destroys all three.

- **gzip as the INTERNAL codec is the worst of both**: 1.029 GB (bigger than zstd
  L9) at **122 ms scan**, 2.2× slower. Never use it.
- **Uncompressed scans fastest** at 37 ms; zstd L9 costs 19 ms more per scan to be
  **3.1× smaller**, which is the trade that makes it the default.

### DO raise the zstd level inside the Parquet

Same corpus, 10M rows:

| level | size | vs default | write | scan |
|---|---|---|---|---|
| 1 | 1.106 GB | +7.0% | 15 s | 71 ms |
| 3 *(DuckDB default)* | 1.034 GB | — | 19 s | 60 ms |
| **9** *(this generator's default)* | **0.932 GB** | **-9.9%** | 36 s | **59 ms** |
| 15 | 0.923 GB | -10.8% | 149 s | 55 ms |

**Level 9 is 33× the gain of gzip and keeps the file a valid Parquet**, costing
1.9× the write time and **reading no slower** — zstd decompression speed is close
to level-independent — while level 15 adds 0.9 points for another 4× on writes.
At level 9 the projected sizes are **~93 GB at 1B** and **~929 GB at 10B**.

**The 100M and 1B fixtures already on disk were written at level 3.**
Regenerating at 9 costs ~6 min and ~59 min respectively to save ~1 GB and ~10 GB
— worth doing before they are stored and transferred repeatedly, not worth doing
to test the harness.

---

## What the fixture supports

30 columns, matching `bench/comparison/lib/generate.js`'s `CONFIG` exactly, so
numbers stay comparable with the recorded benchmarks.

**The report battery** — every predicate keeps its original selectivity:

| query shape | needs | selectivity |
|---|---|---|
| `count(*)` metadata-only | footer | — |
| 2 predicates | `active`, `category` | ~10% |
| range + eq | `amount`, `status` | ~90% / 25% |
| text prefix | `email LIKE 'user1%'` | ~11% |
| IN list | `category` | 40% |
| top 100 rows | `amount`, all columns | — |
| 1 and 2 key aggregates | `category`, `status`, `amount`, `score` | — |
| high-card group | `name` | ~100,000 groups |
| count/approx distinct, quantiles | `name`, `amount` | — |
| project 1 col / all cols | — | — |

**The transform pipelines** — all SQL, mixed SQL+UDF, and all UDF — run
`toUpperCase(category)`, `toLowerCase(status)`, `trim(name)`,
`toUpperCase(email)`, `trim(description)`. All five are VARCHAR, which is what
the UDF path requires: list, JSON and STRUCT types **cannot be UDF parameters**
(DF7).

Also present for wider function coverage: `ip` (IP validations), `location`
(GeoPoint/STRUCT), seven array columns, three `Date` columns, and every numeric
width from `TINYINT` to `HUGEINT`. Two columns are deliberately sparse and should
stay that way — **`subnet` is NULL in every row** (a declared field nothing
populates, the cheapest possible column) and **`expires` is NULL in half**
(neither engine can take an all-or-nothing shortcut).
