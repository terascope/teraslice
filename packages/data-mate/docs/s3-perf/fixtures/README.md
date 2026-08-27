# QPL fixtures — generation, layout, and what the sizes actually are

Deterministic Parquet fixtures for the DuckFrame / DuckDB query battery, at
100M, 1B and 10B rows. **One file per scale**, zstd-compressed.

---

## The layout, and why

**One bucket, one prefix per scale, versioned:**

```
s3://qpl-fixtures/
  v1/1m/    qpl-fixture-v1-1m.parquet       ← smoke-test scales
  v1/10m/   qpl-fixture-v1-10m.parquet
  v1/100m/  qpl-fixture-v1-100m.parquet
  v1/1b/    qpl-fixture-v1-1b.parquet
  v1/10b/   qpl-fixture-v1-10b.parquet
```

Four reasons, in order of how much they matter:

1. **A flat bucket is a correctness hazard, not just untidy.** `S3_GLOB` defaults
   to `**/*.parquet`. With every fixture at the bucket root, that glob matches
   *all of them* — a run labelled "100M" would silently answer with 11.1B rows.
   A prefix makes that impossible rather than merely unlikely.
2. **Switching scale is one word.** `FIXTURE=1b` sets the prefix; nothing else
   changes. See below.
3. **One bucket is one policy** in production — a single set of credentials,
   lifecycle rules and quota to manage rather than three.
4. **`v1` lets a regenerated fixture coexist** with the old one. If the schema or
   the generators change, old numbers must not be silently compared against new
   data; a new version prefix makes the break explicit.

---

## Running the harness against a fixture

```bash
FIXTURE=100m ./run.sh all      # or 1m, 10m, 100m, 1b, 10b
FIXTURE=1b   ./run.sh battery
```

`FIXTURE` resolves to the prefix above. An explicit `S3_PREFIX` overrides it, so
pointing at real non-fixture data still works. An unknown value is rejected by
name rather than silently producing an empty glob.

---

## Generating

```bash
# local
node fixtures/generate-fixture.mjs --scale 100m --out /data/fixtures

# straight to S3 — CHEAPER for the large scales, see "Uploading" below
node fixtures/generate-fixture.mjs --scale 1b --out s3://qpl-fixtures/v1/1b

node fixtures/generate-fixture.mjs --scale 100m --dry     # print the SQL, write nothing
node fixtures/generate-fixture.mjs --rows 5000000 --out /tmp --name probe.parquet
```

Generation runs **entirely inside DuckDB** (`range(n)` plus expressions). The JS
record generator in `bench/comparison/lib/generate.js` is the right tool for a
5M-row comparison and is not reachable at 1B rows at any price.

Deterministic: every value derives from `hash(row_index)`, so any scale
regenerates byte-identically on any machine.

---

## Sizes — measured, not estimated

**~106 MB per million rows** — 105.96 at 1M, 107.10 at 10M, 105.93 at 100M and
105.78 at 1B. Flat across a 1000x range, for the reason under "Why cardinality
barely moves the number" below.

| scale | rows | size | generation | row groups | footer read |
|---|---|---|---|---|---|
| 1m | 1,000,000 | 0.11 GB | 2 s | 9 | <1 ms |
| 10m | 10,000,000 | 1.05 GB | 19 s | 82 | ~2 ms |
| **100m** | 100,000,000 | **10.34 GB** | **186 s** | 814 | **12.5 ms** |
| **1b** | 1,000,000,000 | **103.45 GB** | **1,857 s** (31 min) | 8,139 | **129.2 ms** |
| **10b** | 10,000,000,000 | **~1.03 TB** *(projected)* | ~5.2 h | ~81,400 | ~1.25 s |

100M and 1B are measured. 10B is projected from them, and the projection is
trustworthy: the 1B footer read was predicted at ~125 ms and measured 129.2 ms.

**The footer column is the cost of the single-file choice.** The whole footer is
parsed to plan ANY query, `count(*)` included, before a single value is read. At
10B that is roughly 1.25 s on every query. Reported, not editorialised — one file
per scale was the requirement, and it is the right call for fixture data that has
to be shipped and mirrored. It is simply worth knowing what it costs.

**10B does not fit on a 1 TB workstation** alongside the other scales. Generate it
STRAIGHT TO S3 (`--out s3://...`), which never lands it on local disk. The
generator already raises `s3_uploader_max_filesize` — DuckDB defaults that to
**800 GB**, and a ~1.03 TB object would otherwise fail the write after five hours.

### Why not 28 MB/million, as the report recorded

The report's figure came from the JS generator, which builds values with `i % N`
and linear sequences (`total: 1000000 + i * 7`, `email: user${i}@example.com`).
`HANDOFF.md` records the consequence: **that generator compresses about 2x better
than real data.**

The tell is in the report's own table — 29.21, 28.14, 28.11, 28.02, 28.01
MB/million across a **1000x** range of scales. A compression ratio that constant
means every row is equally novel, which is what a periodic generator produces and
what real data never does.

**A fixture that compresses better than production makes every query measured
against it optimistic, permanently.** These fixtures are deliberately built to
resist that.

### Why cardinality barely moves the number

Measured directly, one VARCHAR column over 1M rows:

| distinct values | bytes/row |
|---|---|
| 100 | 0.9 |
| 10,000 | 2.0 |
| **122,880** (= one row group) | **4.0** |
| 1,000,000 | 4.3 |
| 100,000,000 | 5.9 |

**Parquet dictionaries are scoped to the ROW GROUP, not the file.** Nearly all the
compression benefit is consumed by the time a column's cardinality reaches the
row-group size (122,880); above that, more cardinality costs almost nothing. That
is why bytes/row is flat across scales for *both* generators, and why reducing
`email` from 1e9 to 2e6 distinct changed the total by under 8%.

The practical consequence: to make a fixture compress like production you must
either drop cardinality **below** ~122,880 per column, or introduce the row-level
*locality* real data has (the same user recurring in bursts). Raw cardinality is
the wrong lever.

---

## What the battery actually costs on these fixtures

Local disk, `memory_limit 12GiB`, warm median of 3. This is the reason the fixture
needs more than a `count(*)`: the shapes span a **296x range** at 1B.

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

Three things this table says that a single `count(*)` cannot:

- **`count(*)` is answered from the footer and scans nothing.** At 1B it costs
  138 ms, which is the footer parse and nothing else. Quoting it as "query
  performance" measures the metadata path only.
- **Two shapes dominate everything.** The wide top-N (40.81 s) and quantiles
  (29.66 s) are each an order of magnitude above the rest, and together they are
  **74% of the battery total**. Any "the battery improved by X%" claim is really a
  claim about those two — decompose before quoting one.
- **`LIMIT` without `ORDER BY` is nearly free** (606 ms for all 34 columns), while
  `LIMIT` *with* `ORDER BY` is the most expensive shape in the set. Same clause,
  67x apart, because one streams and the other cannot know the top 100 until every
  row is seen.

Scaling is close to linear 100M→1B on every shape (9-12x for a 10x row count),
which is the expected result for scan-bound work and a useful check that a
fixture is behaving.

---

## Uploading

```bash
node fixtures/upload-fixture.mjs --scale 100m --from /data/fixtures --bucket qpl-fixtures
```

Reads S3 settings from the harness env file, then verifies the remote object by
re-checking row count and the battery's selectivity — which catches a truncated
transfer without hashing hundreds of gigabytes.

**For the large scales, generate straight to S3 instead.** DuckDB has no S3 PUT
of a local file, so `upload-fixture.mjs` re-encodes: a full read plus a full
write. `generate-fixture.mjs --out s3://...` skips the local round trip entirely.

---

## Verifying

```bash
node fixtures/inspect-fixture.mjs /data/fixtures/qpl-fixture-v1-100m.parquet
node fixtures/inspect-fixture.mjs s3://qpl-fixtures/v1/100m/qpl-fixture-v1-100m.parquet
```

Reports content, single-file layout cost (row groups, footer read time), the
widest columns, and **the battery's selectivity** — which must stay stable across
regenerations, or the benchmark quietly changes meaning.

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
`toUpperCase(email)`, `trim(description)`. All five are VARCHAR, which is what the
UDF path requires: list, JSON and STRUCT types **cannot be UDF parameters**
(DF7).

Also present for wider function coverage: `ip` (IP validations), `location`
(GeoPoint/STRUCT), seven array columns, three `Date` columns, and every numeric
width from `TINYINT` to `HUGEINT`.

Two columns are deliberately sparse and should stay that way: **`subnet` is NULL
in every row** (a declared field nothing populates — extremely common, and the
cheapest possible column), and **`expires` is NULL in half** (neither engine can
take an all-or-nothing shortcut).
