# `./run.sh sql` — running any query, with the settings as flags

`scripts/07-sql.mjs` is `02-battery.mjs` with two things changed: **the query
comes from you** instead of `lib/queries.mjs`, and **every engine setting has a
flag** instead of being read only from the env file. Everything else — the
profiled cold run, the median of repeats, the result JSON in `RESULTS_DIR` — is
the same machinery, so a number from here is comparable with a battery number.

Every measured figure below is real, captured against
`s3://duckdb/v1/noaa/noaa-isd-v5.parquet` (691,122,937 NOAA ISD records,
22.87 GiB).

```bash
cd packages/data-mate/docs/s3-perf
export S3_PERF_ENV_FILE=~/s3-noaa.env      # endpoint, credentials, CA, FIXTURE
export RESULTS_DIR=~/noaa-out/results

./run.sh sql --sql "SELECT count(*) FROM {{T}}"
```

## `{{T}}` — always use it

`{{T}}` expands to the frame's FROM expression, resolved from `FIXTURE` /
`S3_BUCKET` / `S3_PREFIX`, so one query text runs against any corpus and no
`s3://` URL is ever pasted into a query. If a query never mentions `{{T}}` the
run says so, because a query that reads nothing still produces a plausible
timing.

```
FIXTURE=noaa   ->  {{T}} = (SELECT * FROM read_parquet('s3://duckdb/v1/noaa/**/*.parquet'))
FIXTURE=1b     ->  {{T}} = (SELECT * FROM read_parquet('s3://duckdb/v1/1b/**/*.parquet'))
```

## It runs through DuckFrame, not the raw binding

The other steps query the binding directly; this one goes through
`frame.query()`, because that is what spaces will call.

- The frame owns its **own** database, so settings are pushed in with
  `configureDuckDatabase()` and credentials through `frame.query()`. Nothing is
  inherited from the environment.
- **There is no streaming JS mode.** `frame.rows()` hard-codes
  `SELECT * FROM <the frame>` and DuckFrame has no "frame from arbitrary SQL"
  factory, so `--rows json` is the JS path that is reachable. A `queryStream(sql)`
  on DuckFrame would unlock it.
- **One statement only.** Use the flags for `SET`s: a second statement cannot be
  wrapped for `--rows none`, and a `SET` inside the timed region would measure
  itself.

---

# Flag reference

## Where the SQL comes from — pick one

| flag | what it does |
|---|---|
| `--sql "<query>"` | the query, inline. Newlines are fine; a `$` inside double quotes is expanded by bash, so use `--file` instead |
| `--file <path>` | the query, read from a file. `{{T}}` and `--` comments both work there |
| `-` | the query, read from stdin |

A trailing `;` is stripped: `--rows none` wraps the query in
`CREATE TABLE AS (...)`, and a semicolon inside those parentheses would read as a
fault in your query rather than in the wrapping.

## What gets measured and shown

| flag | default | what it does |
|---|---|---|
| `--rows none\|json` | `none` | whether result rows cross into JavaScript |
| `--repeats N` | `REPEATS` in the env file | **warm** runs, after a cold run and a discarded warmup; reports the median. `0` = the cold run only |
| `--explain` | off | prints the per-operator timing tree |
| `--print N` | off | prints the first N result rows — the check that stops you timing a query returning nothing |
| `--tag <name>` | derived from the query | names the result JSON in `RESULTS_DIR` |
| `--sweep <flag>=<v1,v2,...>` | none | re-runs the whole measurement once per value, each in a fresh process. Repeatable |
| `--help`, `-h` | | the flag list |

`--rows none` wraps the query in `CREATE OR REPLACE TABLE ... AS` — full
execution, nothing transferred, but materialised **into the in-memory database**,
so a hundred-million-row result costs that much memory; `--rows json` is
`frame.query()`, every row into JS as JSON-rendered arrays.
`SELECT count(*) FROM (<query>)` is **not** a substitute for `none`: it lets the
optimiser prune columns your query asked for and times a different plan.

### How many times the query actually runs

`--repeats` counts the **warm** runs; the cold run and the warmup are
unconditional, so the total is `1 + 1 + N`.

| `--repeats` | executions | what the report shows |
|---|---|---|
| `0` | 1 — cold | `cold (first touch)` only. No median, no first-touch overhead |
| `1` | 3 — cold, warmup (discarded), 1 timed | a "warm median of 1" that is the **third** execution |
| `3` (default) | 5 — cold, warmup, 3 timed | cold, median, min, max, overhead |

For a single cold execution use `--repeats 0`; it skips `measure()` entirely,
because that function's own warmup would be a second execution.

## Engine settings — one mechanism, nine names

Each flag writes the env var the harness already reads, **before** `lib/env.mjs`
is imported, making flags the highest-precedence layer of the existing
flag → real env → env file chain. That is also what makes `--sweep` work: a swept
value is just an env var in a child process.

| flag | env var | notes |
|---|---|---|
| `--repeats N` | `REPEATS` | also listed above |
| `--memory-limit 512MiB` | `MEMORY_LIMIT` | **use binary units** — DuckDB reads `2GB` as 2×10⁹ bytes |
| `--threads N` | `THREADS` | DuckDB's query parallelism. Unset = one per core |
| `--temp-dir <path>` | `TEMP_DIRECTORY` | without one, an over-limit query FAILS instead of spilling |
| `--max-temp-size 20GiB` | `MAX_TEMP_DIRECTORY_SIZE` | DuckDB's default is 90% of free disk |
| `--external-file-cache true\|false` | `EXTERNAL_FILE_CACHE` | largest avoidable term in peak RSS |
| `--http-metadata-cache true\|false` | `HTTP_METADATA_CACHE` | |
| `--parquet-metadata-cache true\|false` | `PARQUET_METADATA_CACHE` | |
| `--connection-cache true\|false` | `HTTPFS_CONNECTION_CACHING` | |

**`--threads` is not only a speed knob.** The wide top-N memory cliff needs
threads × row-group size × columns projected, so lowering it cuts memory too —
which is why it is the documented mitigation.

## `--sweep`

`--sweep` is not run count (that is `--repeats`): it re-runs the whole
measurement once per setting value, each in a **fresh process**, and tabulates.
A fresh process because peak RSS is a process-lifetime high-water mark — several
runs in one process report the maximum of all of them — and because it guarantees
the caches start cold.

```bash
./run.sh sql --sql "..." --sweep threads=2,4,8
./run.sh sql --sql "..." --sweep threads=2,4,8 --sweep external-file-cache=true,false
./run.sh sql --sql "..." --sweep memory-limit=512MiB,1GiB,4GiB
```

Sweepable flags are exactly the nine engine settings, and **axes are never
crossed** — one variable at a time. `peak RSS` reads `n/a` on macOS because it
comes from `/proc/self/status:VmHWM`; on the pod it is populated.

---

# A representative run

```bash
./run.sh sql --file ~/noaa-out/queries/daily-temps.sql \
    --memory-limit 2GiB --threads 8 --repeats 2 --print 3 --tag doc-file
```

```
TIMING
  cold (first touch)  8158.2 ms
  warm median of 2      86.3 ms

WHAT THE ENGINE DID (cold run, from DuckDB's profiler)
  latency               8157.4 ms            engine time, excluding JS
  cpu time              5744.6 ms                summed across threads
  bytes read              27.7 MB  moved over the wire on the cold run
  peak buffer memory     101.0 MB                 against memory_limit
  peak spill                  0 B        0 means it never went to disk
  rows out of the scan    179,044          what the scan handed upward
  rows returned                 7                           the answer

  the scan emitted 179,044 rows and the query returned 7.
  filters pushed INTO the scan: date>='2024-07-01 00:00:00'::TIMESTAMP AND
    date<'2024-07-08 00:00:00'::TIMESTAMP,location.lat>=32.0 AND location.lat<=49

FIRST 3 ROWS
  ["2024-07-01 00:00:00","26077",21.04,2.8,47.3]
  ["2024-07-02 00:00:00","24445",20.19,0,46.9]
  ["2024-07-03 00:00:00","18864",21.01,-0.6,49.6]
```

`--explain` adds a `WHERE THE TIME WENT` tree: indentation is the plan, deepest
first, `out` is rows produced, bracketed text is the filter that reached the
scan. On a July-2024 group-by it read `READ_PARQUET 13438.77 ms out 10,214,288`
against `HASH_GROUP_BY 99.37 ms out 31` — the scan is essentially the whole query.

## Reading the output

| metric | what it is |
|---|---|
| `cold (first touch)` | the first run, profiled. **A single noisy sample** |
| `warm median` | median of `--repeats` after a discarded warmup. Absent at `--repeats 0` |
| `first-touch overhead` | cold − warm median. The run warns when cold exceeds 5× the warm median |
| `latency` | DuckDB's own engine time. Tracks the wall clock to ~1 ms when a profile exists |
| `cpu time` | summed across threads, so it exceeds latency when parallel |
| `wall time not on CPU` | latency − cpu, i.e. I/O wait |
| `blocked thread time` | stalled. Printed **only when non-zero** |
| `bytes read` | moved over the wire on the **cold** run |
| `peak buffer memory` | DuckDB's own measured peak, from the **cold** run. **Not** process RSS |
| `peak spill` | 0 means it never went to disk |
| `rows out of the scan` | what the scan handed upward — the pruning/pushdown signal |
| `rows returned` | the answer's row count |
| `result size` | bytes converted into JS (`--rows json` only) |

---

# What the numbers actually contain

Audited 2026-09-10 against this corpus.

## `bytes read` has a fixed ~13.7 MB floor, and it is the footer

**Measured: a predicate matching ZERO rows still reads 13.7 MB.**

| query | rows scanned | bytes read | data beyond the floor |
|---|---|---|---|
| `WHERE date >= '2030-01-01'` (matches nothing) | 0 | **13.7 MB** | ~0 |
| 1 hour, 1 column | 15,556 | 13.9 MB | ~0.2 MB |
| 3 days, 1 column | 950,922 | 16.0 MB | **~2.3 MB** |
| 3 days, 5 columns | 950,922 | 18.4 MB | ~4.7 MB |
| July 2024, 3 columns | 10,214,288 | 35.7 MB | ~22 MB |
| geo box, no pruning | 19,227,161 | 3.6 GB | ~3.59 GB |

That floor is the Parquet **footer**: 5,579 row groups × 25 columns = 139,475
column-chunk metadata entries at roughly 98 bytes each, fetched before any value
is read. **So `bytes read` minus ~13.7 MB is the query's data cost** — subtract
before comparing two queries, or the footer swamps the difference.

Cross-checked: `parquet_metadata()` says the row groups overlapping
2024-07-01..04 are **9 of 5,579, 1,116,125 rows, 2.4 MiB across the three needed
columns** — matching the ~2.3 MB measured. Row-group pruning and projection
pushdown both work, and they work *through* `{{T}}`'s `SELECT *` subquery.

## Cold time is dominated by the footer, not by your query

The zero-match query above, which reads no data at all, spent **6,398.9 ms cold
against 61.0 ms warm median, with 0.1 ms of CPU** — all of it fetching the footer
over TLS. This is why cold swings wildly: one query measured **72,306 / 4,477 /
1,509 ms** cold while its warm median never moved off 288 ms.

**Rule: quote the warm median. Treat cold as one noisy sample.**

Cold is slow *every* time because **nothing that makes a run warm survives the
process** — the httpfs connection pool (with DNS and the TLS handshake),
`parquet_metadata_cache`, `http_metadata_cache` and the external file cache all
live in the DuckDB *instance*, and `openFrame()` even discards one instance
(`DESCRIBE` for the schema) before `DuckFrame.fromParquet()` builds a second.
`--repeats` measures warm-within-a-process; running the script twice measures
cold-per-process — different questions, both numbers right.

## The profiler goes stale

**DuckDB does not always write a profile, and when it does not, the file still
holds the previous query's.** Measured against DuckDB 1.5.5, checking the profile
file's mtime after every statement:

| query | profile written? | what the file held |
|---|---|---|
| local parquet, `parquet_metadata_cache=false` | yes, every run | its own plan, `latency` ≈ wall |
| local parquet, cache on, run 1 | yes | its own plan |
| local parquet, cache on, runs 2-4 | **no** | run 1's, `latency` frozen at 38.5 ms while the wall clock fell to 15.2 ms |
| remote https parquet, `count(*)` | **no, ever** | `SELECT 1`'s — `PROJECTION > DUMMY_SCAN`, latency 0.4 ms, 0 B read, against a 983 ms wall clock |
| remote https parquet, `WHERE passenger_count > 2` | yes, every run | its own plan, `latency` 3159.9 ms against a 3160.2 ms wall |

**A query answered from cached Parquet metadata is not profiled** — a bare
`count(*)` included. The harness now deletes the arming query's profile before
the measured run, so an absent file is reported as "DuckDB wrote no profile"
rather than printed as a measurement.

**The timing was never affected.** `cold` and the warm runs are a
`process.hrtime.bigint()` wall clock around the real call: 3,159.9 ms profiled
against 3,160.2 ms measured cold, and 296.0 against 296.8 warm.

## Other things in the numbers, deliberately

- **`--rows none` includes a materialisation** into the in-memory database:
  nothing for a 31-row aggregation, not pure query cost for a large result set.
- **`bytes read` and `peak buffer memory` are cold-run only.** A profiled repeat
  would report the cached run and print near-zero, so the warm median has no byte
  count beside it.
- **"Cold" is DuckDB-cold, not server-cold.** It is the first touch by *this*
  instance, which is the reproducible thing to measure.
- **`cpu time` exceeds `latency` on parallel queries** — it is summed across
  threads. The geo query showed 1,634,982 ms of CPU against 212,421 ms of latency
  on 8 threads.
- **`blocked thread time` was removed from the default output.** It read 0 across
  all 15 runs, including a 3.9 GB query that spent 212 s mostly on the network;
  `wall time not on CPU` carries the I/O story instead.

## Rows modes — query cost vs row cost

Same query, 319,614 rows returned:

| | `--rows none` | `--rows json` |
|---|---|---|
| warm median | **77.0 ms** | **288 ms** |
| bytes read | 15.7 MB | 15.7 MB |
| rows returned | 319,614 | 319,614 |
| result size | — | 9.8 MB converted into JS |

Identical engine work; the difference is **~211 ms to turn 319,614 rows into JS
objects, about 0.66 µs/row**.

## The wide top-N — and the cliff that did NOT fire

`SELECT * FROM {{T}} ORDER BY temperature_c DESC LIMIT 100` at
`--memory-limit 512MiB --threads 8`:

```
cold (first touch)     665,007 ms   (11.1 min)
warm run               620,179 ms   (10.3 min)
cpu time             5,311,670 ms   summed across 8 threads
bytes read              22.49 GiB   the ENTIRE file
peak buffer memory      1,016 MiB   against a 512 MiB limit
peak spill                    0 B   it never went to disk
rows out of the scan  691,122,937
rows returned                 100
```

**It completed** — no failure, no spill, just eleven minutes. **The cliff is
corpus-dependent**: the law is threads × row-group size × columns projected, and
NOAA is 25 narrow columns where the corpus that produced the recorded
512 MiB–1 GiB threshold carries 42 leaf values per row including wide strings,
`HUGEINT` and arrays. Peak buffer reached **1,016 MiB under a 512 MiB limit**
(1.98×, matching the recorded ~2.1× slope) while spilling nothing —
`memory_limit` is not a hard bound.

| query, same file and session | bytes read | warm |
|---|---|---|
| projected + date-filtered | 35.7 MB | **103.7 ms** |
| `SELECT *` top-N | 22.49 GiB | **620,179 ms** |

A **~6,000× difference**, and cold ≈ warm on the top-N (665 s vs 620 s) where the
small queries were ~100× faster warm: the cold/warm gap tells you whether the
working set fits the cache, and 22.5 GiB does not.

## Pushdown is not pruning

Both of these had their filters pushed *into* the scan, and the tool says so:

| query | pushed down? | bytes read | of which data | warm |
|---|---|---|---|---|
| `WHERE date BETWEEN ...` | yes | 35.7 MB | ~22 MB | 103.7 ms |
| `WHERE location.lat/lon BETWEEN ...` | yes | 3.6 GB | ~3.59 GB | 106,184 ms |

The date predicate skips row groups because the file is clustered by time;
lat/lon are scattered across every row group, so the identical mechanism
eliminates nothing. **Check `bytes read` minus the ~13.7 MB floor, not whether
the filter pushed.**

---

# Gotchas, each of which cost a real measurement

| gotcha | detail |
|---|---|
| **`memory_limit` does not bound the process** | the geo query peaked at **3.9 GB of buffer memory under a 2 GiB `--memory-limit`**; a full run lands near 3 GB plus ~2.1× the limit |
| **The first query after `SET profiling_output` does not land at the new path** | the script issues a throwaway `SELECT 1` to arm it. Without that, the run printed "No profile was written" for the whole engine table — do not remove it as dead code |
| **A CA certificate is not required** | leave `CA_CERT_FILE` empty and the harness sets `enable_curl_server_cert_verification = false`, which connects to a private CA without a PEM. `SSL peer certificate ... was not OK` means `CA_CERT_FILE` points at a missing or wrong file — clear it |
| **`_key` is not unique in this corpus** | and neither is `(date, _key)`, so do not build a paging cursor on them. See `fixtures/extract-noaa.mjs` |

Check `duckdb_settings()` before accepting that the engine cannot do something.

---

# NOAA-specific: filter on the quality code

**Do not chase sentinel values, filter on `<field>_quality`.** Measured:
`dew_point_temperature_c = 999.9` occurs 106,782,280 times and
`dew_point_quality = '9'` accounts for 106,781,186 of them; `'1'` and `'5'` are
the passing codes.

```sql
WHERE temperature_quality IN ('1','5')
```

| | unfiltered | quality-filtered |
|---|---|---|
| `temperature_c` range | −91.1 .. 99.9 | **−90.4 .. 80.5** |
| rows | 691,122,937 | 670,909,961 |

Other raw sentinels, all flagged by their own quality column: `visibility_m` has
9999 (×72.8M) and a max of 1,609,333; `ceiling_height_m` has 22000 (×160M) and a
max of 999999; `slp_hPa` goes negative. `location` is a
`STRUCT(lat DOUBLE, lon DOUBLE)`, so address it as `location.lat` /
`location.lon`.
