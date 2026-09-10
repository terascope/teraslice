# `./run.sh sql` — running any query, with the settings as flags

`scripts/07-sql.mjs`. This is `02-battery.mjs` with two things changed: **the query
comes from you** instead of `lib/queries.mjs`, and **every engine setting has a
flag** instead of being read only from the env file. Everything else is the same
machinery — the profiled cold run, the median of repeats, the result JSON in
`RESULTS_DIR` — so a number from here is comparable with a number from the battery.

Every output block below is **real, captured against
`s3://duckdb/v1/noaa/noaa-isd-v5.parquet`** (691,122,937 NOAA ISD records,
22.87 GiB), not illustrative.

---

## Quick start

```bash
cd packages/data-mate/docs/s3-perf
export S3_PERF_ENV_FILE=~/s3-noaa.env      # endpoint, credentials, CA, FIXTURE
export RESULTS_DIR=~/noaa-out/results

./run.sh sql --sql "SELECT count(*) FROM {{T}}"
```

That is the minimum: one flag. Everything else is optional.

## `{{T}}` — always use it

`{{T}}` expands to the frame's FROM expression, resolved from `FIXTURE` /
`S3_BUCKET` / `S3_PREFIX` in the env file. So the same query text runs against any
corpus by changing one setting, and no `s3://` URL is ever pasted into a query.

```
FIXTURE=noaa   ->  {{T}} = (SELECT * FROM read_parquet('s3://duckdb/v1/noaa/**/*.parquet'))
FIXTURE=1b     ->  {{T}} = (SELECT * FROM read_parquet('s3://duckdb/v1/1b/**/*.parquet'))
```

If a query never mentions `{{T}}` the run says so, because a query that reads
nothing still produces a plausible-looking timing.

## It runs through DuckFrame, not the raw binding

The other steps query the DuckDB binding directly; this one goes through
`frame.query()`, because that is what spaces will call. Two consequences:

- The frame owns its **own** database, so settings are pushed in with
  `configureDuckDatabase()` and credentials through `frame.query()`. Nothing is
  inherited from the environment.
- **There is no streaming JS mode.** `frame.rows()` hard-codes
  `SELECT * FROM <the frame>` and DuckFrame has no "frame from arbitrary SQL"
  factory, so `--rows json` is the JS path that is reachable. A `queryStream(sql)`
  on DuckFrame would unlock it.

**One statement only.** Use the flags for `SET`s rather than prefixing them to the
query: a second statement cannot be wrapped for `--rows none`, and a `SET` inside
the timed region would be measuring itself.

---

# Flag reference

## Where the SQL comes from — pick one

| flag | what it does |
|---|---|
| `--sql "<query>"` | the query, inline |
| `--file <path>` | the query, read from a file — see the worked example below |
| `-` | the query, read from stdin |

A trailing `;` is stripped: `--rows none` wraps the query in `CREATE TABLE AS (...)`
and a semicolon inside those parentheses is a syntax error that would read as a
fault in your query rather than in the wrapping.

## What gets measured and shown

| flag | default | what it does |
|---|---|---|
| `--rows none\|json` | `none` | whether result rows cross into JavaScript. See **Rows modes** |
| `--repeats N` | `REPEATS` in the env file | timed runs after a cold run and a discarded warmup; reports the median |
| `--explain` | off | prints the per-operator timing tree |
| `--print N` | off | prints the first N result rows |
| `--tag <name>` | derived from the query | names the result JSON in `RESULTS_DIR` |
| `--sweep <flag>=<v1,v2,...>` | none | re-runs the whole measurement once per value. Repeatable |
| `--help`, `-h` | | the flag list |

## Engine settings — one mechanism, nine names

Each flag writes the env var the harness already reads, **before** `lib/env.mjs` is
imported. So flags are simply the highest-precedence layer of the existing
flag → real env → env file chain, not a second parallel config system. It is also
what makes `--sweep` work: a swept value is just an env var in a child process.

| flag | env var | notes |
|---|---|---|
| `--memory-limit 512MiB` | `MEMORY_LIMIT` | **use binary units** — DuckDB reads `2GB` as 2×10⁹ bytes |
| `--threads N` | `THREADS` | DuckDB's query parallelism. Unset = one per core |
| `--temp-dir <path>` | `TEMP_DIRECTORY` | without one, an over-limit query FAILS instead of spilling |
| `--max-temp-size 20GiB` | `MAX_TEMP_DIRECTORY_SIZE` | DuckDB's default is 90% of free disk |
| `--external-file-cache true\|false` | `EXTERNAL_FILE_CACHE` | largest avoidable term in peak RSS |
| `--http-metadata-cache true\|false` | `HTTP_METADATA_CACHE` | |
| `--parquet-metadata-cache true\|false` | `PARQUET_METADATA_CACHE` | |
| `--connection-cache true\|false` | `HTTPFS_CONNECTION_CACHING` | |
| `--repeats N` | `REPEATS` | also listed above |

**`--threads` is not only a speed knob.** The wide top-N memory cliff needs
threads × row-group size × columns projected, so lowering it cuts memory too. That
is why it is the documented mitigation.

---

# Worked examples

## 1. Baseline — footer only

```bash
./run.sh sql --sql "SELECT count(*) FROM {{T}}" --memory-limit 2GiB --repeats 2
```

```
TIMING
  run                        ms
  ------------------  ---------
  cold (first touch)  2958.2 ms
  warm median of 2      71.1 ms
  warm min              70.0 ms
  warm max              72.2 ms

WHAT THE ENGINE DID (cold run, from DuckDB's profiler)
  metric                 value                    what it tells you
  --------------------  ------  -----------------------------------
  latency               0.4 ms            engine time, excluding JS
  cpu time              0.0 ms                summed across threads
  blocked thread time   0.0 ms  stalled — on S3 this is the network
  bytes read               0 B  moved over the wire on the cold run
  bytes written            0 B               spill and table writes
  peak buffer memory       0 B                 against memory_limit
  peak spill               0 B        0 means it never went to disk
  rows out of the scan       0          what the scan handed upward
  rows returned              1                           the answer
```

**Expect 0 bytes read.** `count(*)` is answered from the Parquet footer; no column
data is touched, which is why `latency` is 0.4 ms while the cold wall clock is 3 s
— that gap is the TLS handshake and the footer fetch, not query work. 691M rows in
71 ms warm.

Cold varies a lot on this shape: 962 ms, 1,509 ms and 2,958 ms across runs, with
the warm median steady at 49-71 ms. See the cold-outlier gotcha below.

## 2. `--sql` with a multi-line query

`--sql` takes newlines directly — no escaping, no `\` continuations. Plain double
quotes are enough in bash, and single quotes inside the SQL are untouched:

```bash
./run.sh sql --sql "SELECT
    date_trunc('day', date) AS day,
    count(*)                AS observations,
    round(avg(temperature_c), 2) AS avg_c
FROM {{T}}
WHERE date >= TIMESTAMP '2024-07-01'
  AND date <  TIMESTAMP '2024-07-04'
  AND temperature_quality IN ('1', '5')
GROUP BY 1
ORDER BY 1" --memory-limit 2GiB --threads 8 --repeats 2 --print 3
```

The run echoes the query back with `{{T}}` already expanded, so you can see
exactly what executed:

```
THE QUERY
  SELECT
    date_trunc('day', date) AS day,
    count(*)                AS observations,
    round(avg(temperature_c), 2) AS avg_c
FROM (SELECT * FROM read_parquet('s3://duckdb/v1/noaa/**/*.parquet'))
WHERE date >= TIMESTAMP '2024-07-01'
  AND date <  TIMESTAMP '2024-07-04'
  AND temperature_quality IN ('1', '5')
GROUP BY 1
ORDER BY 1

  {{T}} = (SELECT * FROM read_parquet('s3://duckdb/v1/noaa/**/*.parquet'))

TIMING
  cold (first touch)  6142.4 ms
  warm median of 2      85.8 ms
  bytes read           16.1 MB

FIRST 3 ROWS
  ["2024-07-01 00:00:00","319614",20.52]
  ["2024-07-02 00:00:00","314835",20.2]
  ["2024-07-03 00:00:00","291989",20.17]
```

**The one thing to avoid** is a `$` in the SQL inside double quotes, which bash
expands. Use single quotes around the whole argument if you need one, and then
double the SQL's own single quotes — which is the point at which `--file` is
easier.

## 3. `--file` — a multi-line query from a file

Inline SQL with quotes and newlines is painful through a shell, especially over
SSH. Put it in a file. `{{T}}` works there too, and `--` comments are fine.

`~/noaa-out/queries/daily-temps.sql`:

```sql
-- July 2024, daily temperature summary for the western US.
-- {{T}} expands to the frame, so this file works against any FIXTURE.
SELECT
    date_trunc('day', date)          AS day,
    count(*)                         AS observations,
    round(avg(temperature_c), 2)     AS avg_c,
    round(min(temperature_c), 1)     AS min_c,
    round(max(temperature_c), 1)     AS max_c
FROM {{T}}
WHERE date >= TIMESTAMP '2024-07-01'
  AND date <  TIMESTAMP '2024-07-08'
  -- quality '1' and '5' are the passing codes; '9' means missing
  AND temperature_quality IN ('1', '5')
  AND location.lat BETWEEN 32.0 AND 49.0
  AND location.lon BETWEEN -125.0 AND -104.0
GROUP BY 1
ORDER BY 1
```

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

`--print 3` is the sanity check that stops you timing a query that returns nothing.

## 4. `--explain` — where the time went

The summary table says the query cost 6.2 s; `--explain` says which operator spent it.

```bash
./run.sh sql --sql "SELECT date_trunc('day', date) AS d, count(*) AS obs,
    round(avg(temperature_c), 2) AS avg_c
  FROM {{T}}
  WHERE date >= TIMESTAMP '2024-07-01' AND date < TIMESTAMP '2024-08-01'
    AND temperature_quality IN ('1','5')
  GROUP BY 1 ORDER BY 1" \
  --memory-limit 2GiB --threads 8 --repeats 2 --explain
```

```
TIMING
  cold (first touch)  6196.6 ms
  warm median of 2     103.7 ms

WHAT THE ENGINE DID (cold run, from DuckDB's profiler)
  latency                6195.8 ms            engine time, excluding JS
  cpu time              13711.1 ms                summed across threads
  bytes read               35.7 MB  moved over the wire on the cold run
  peak buffer memory      126.3 MB                 against memory_limit
  rows out of the scan  10,214,288          what the scan handed upward
  rows returned                 31                           the answer

WHERE THE TIME WENT
    BATCH_CREATE_TABLE_AS 0.28 ms  out 1
      ORDER_BY 2.02 ms  out 31
        PROJECTION 4.20 ms  out 31
          HASH_GROUP_BY 99.37 ms  out 31
            PROJECTION 41.99 ms  out 9,911,644
              PROJECTION 0.32 ms  out 9,911,644
                FILTER 124.16 ms  out 9,911,644
                  READ_PARQUET 13438.77 ms  out 10,214,288  [date>='2024-07-01...]
```

How to read it: indentation is the plan, deepest first. `READ_PARQUET` at
13,438 ms of CPU is essentially the whole query — the aggregation is 99 ms. The
bracketed text is the filter that **reached the scan**. `out` is rows produced.

**35.7 MB read from a 22.87 GiB file** is the headline — but read it as
**~14 MB of footer plus ~22 MB of data**, not 35.7 MB of data. See
[What the numbers actually contain](#what-the-numbers-actually-contain).

The scan emitted 10,214,288 rows — exactly the record count of
`noaa-isd-v5-2024.07` — so it read that month's row groups and skipped the other
68. The file is clustered by time because the extraction sliced by date.

## 5. Rows modes — query cost vs row cost

```bash
Q="SELECT station_id, date, temperature_c FROM {{T}}
   WHERE date >= TIMESTAMP '2024-07-01' AND date < TIMESTAMP '2024-07-02'
     AND temperature_quality IN ('1','5')"

./run.sh sql --sql "$Q" --rows none --memory-limit 2GiB --threads 8 --repeats 2
./run.sh sql --sql "$Q" --rows json --memory-limit 2GiB --threads 8 --repeats 2
```

| | `--rows none` | `--rows json` |
|---|---|---|
| warm median | **77.0 ms** | **288 ms** |
| bytes read | 15.7 MB | 15.7 MB |
| rows returned | 319,614 | 319,614 |
| result size | — | 9.8 MB converted into JS |

Identical engine work; the difference is **~211 ms to turn 319,614 rows into JS
objects, about 0.66 µs/row.** That is the separation the flag exists for.

- **`none`** wraps the query in `CREATE OR REPLACE TABLE ... AS`. Full execution,
  nothing transferred. Note it materialises the result **into the in-memory
  database**, so a query returning a hundred million rows costs that much memory.
  For an aggregation the result is tiny and it is free.
- **`json`** is `frame.query()` — every row into JS as JSON-rendered arrays.

`SELECT count(*) FROM (<query>)` is **not** a substitute for `none`: it lets the
optimiser prune columns your query asked for, so it times a different plan.

## 6. `--sweep` — one setting, several values

`--sweep` is **not** run count (that is `--repeats`). It re-runs the whole
measurement once per setting value, each in a **fresh process**, and tabulates.

```bash
./run.sh sql --sql "<the July query>" --memory-limit 2GiB --repeats 2 \
    --sweep threads=2,4,8
```

```
SWEEP — threads across 2, 4, 8
  running threads=2 in a fresh process…
  running threads=4 in a fresh process…
  running threads=8 in a fresh process…
  threads       cold   median  bytes read  peak buffer  spill  peak RSS
  -------  ---------  -------  ----------  -----------  -----  --------
  2        1649.7 ms  97.9 ms     18.7 MB      71.8 MB    0 B       n/a
  4        2476.1 ms  81.0 ms     18.7 MB      74.5 MB    0 B       n/a
  8        1299.4 ms  76.2 ms     18.7 MB      82.1 MB    0 B       n/a

  fastest threads=8 at 76.2 ms, slowest threads=2 at 97.9 ms — 1.28x
```

A **fresh process per value**, not a loop, because peak RSS is a process-lifetime
high-water mark: several runs in one process report the maximum of all of them and
eventually get OOM-killed. It also guarantees the caches start cold.

`peak RSS` reads `n/a` on macOS — it comes from `/proc/self/status:VmHWM`, which
is Linux-only. On the pod it is populated.

Repeatable, and **axes are never crossed** — one variable at a time:

```bash
./run.sh sql --sql "..." --sweep threads=2,4,8 --sweep external-file-cache=true,false
./run.sh sql --sql "..." --sweep memory-limit=512MiB,1GiB,4GiB
```

Sweepable flags are exactly the nine engine settings.

## 7. The wide top-N — and the cliff that did NOT fire

The documented memory cliff is a wide `SELECT * … ORDER BY … LIMIT` under a tight
limit, which is recorded as **failing rather than degrading** between 512 MiB and
1 GiB. Run against this corpus:

```bash
./run.sh sql --sql "SELECT * FROM {{T}} ORDER BY temperature_c DESC LIMIT 100" \
    --memory-limit 512MiB --threads 8 --repeats 1
```

```
cold (first touch)     665,007 ms   (11.1 min)
warm run               620,179 ms   (10.3 min)

latency                665,006 ms
cpu time             5,311,670 ms          summed across 8 threads
bytes read              22.49 GiB          the ENTIRE file
peak buffer memory      1,016 MiB          against a 512 MiB limit
peak spill                    0 B          it never went to disk
rows out of the scan  691,122,937
rows returned                 100
```

**It completed.** No failure, no spill — it just took eleven minutes. Two findings
worth recording:

**The cliff is corpus-dependent, and this corpus does not trip it.** The law is
threads × row-group size × columns projected, and NOAA is 25 narrow columns. The
corpus where the cliff was originally found carries 42 leaf values per row
including wide strings, `HUGEINT` and arrays, so its per-row working set is several
times larger. Do not assume the recorded 512 MiB–1 GiB threshold transfers; it is a
property of the schema, not of DuckDB.

**Peak buffer reached 1,016 MiB under a 512 MiB limit** — 1.98×, matching the
recorded ~2.1× slope — while spilling nothing. `memory_limit` is not a hard bound.

**And this is what `SELECT *` costs.** Same file, same session:

| query | bytes read | warm |
|---|---|---|
| projected + date-filtered | 35.7 MB | **103.7 ms** |
| `SELECT *` top-N | 22.49 GiB | **620,179 ms** |

A **~6,000× time difference** on one corpus. This is the "never emit `SELECT *`"
rule as a measurement rather than a maxim.

Note also that cold ≈ warm here (665 s vs 620 s), where the small queries were
~100× faster warm. **The cold/warm gap tells you whether the working set fits the
cache** — 22.5 GiB does not, so there is nothing to warm.

---

# What the numbers actually contain

Audited 2026-09-10 against this corpus, because several figures did not add up
until they were decomposed.

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
is read. It is identical for every query against the file, and it is the direct
cost of the one-big-file choice — `fixtures/README.md` predicted it in time terms
("~1.25 s on every query" at 10B rows); this is the same effect in bytes.

**So `bytes read` minus ~13.7 MB is the query's data cost.** Subtract before
comparing two queries, or the footer swamps the difference.

**Cross-checked independently.** Querying `parquet_metadata()` for the row groups
whose `date` stats overlap 2024-07-01..04 gives **9 row groups of 5,579,
1,116,125 rows, 2.4 MiB across the three needed columns** — matching the ~2.3 MB
measured above. Row-group pruning and projection pushdown both work, and they work
*through* `{{T}}`'s `SELECT *` subquery. That was worth proving: had the subquery
defeated projection pushdown, every byte figure in the harness would be wrong.

## Cold time is dominated by the footer, not by your query

The same zero-match query, which reads no data at all:

```
cold (first touch)    6398.9 ms
warm median of 3        61.0 ms
first-touch overhead  6337.9 ms
every warm run: 57.2, 61.0, 65.1 ms

latency               6398.4 ms
cpu time                 0.1 ms
wall time not on CPU  6398.3 ms   <- I/O wait
```

**6.4 seconds of wall time with 0.1 ms of CPU.** All of it is fetching the footer
over TLS, and none of it is attributable to the query. This is why cold readings
swing wildly — measured on one query: **72,306 / 4,477 / 1,509 ms**, while its
warm median never moved off 288 ms.

The run now prints `first-touch overhead` (cold − warm median), lists **every**
warm run rather than only the median, and warns explicitly when cold exceeds 5×
the warm median.

**Rule: quote the warm median. Treat cold as one noisy sample.**

## `blocked thread time` was removed from the default output

It read **0 across all 15 runs**, including a 3.9 GB query that spent 212 seconds
mostly waiting on the network. Printing it under the label "stalled — on S3 this is
the network" asserted a measurement that was never taken. It now appears only when
non-zero, and `wall time not on CPU` (latency − cpu) carries the I/O story instead.

## Other things included in the numbers, deliberately

- **`--rows none` includes a materialisation.** It wraps the query in
  `CREATE OR REPLACE TABLE ... AS`, so a query returning 319,614 rows also pays to
  write them into the in-memory database. For an aggregation returning 31 rows this
  is nothing; for a large result set it is not pure query cost. The honest
  alternative — `SELECT count(*) FROM (<query>)` — is worse, because it lets the
  optimiser prune columns the query asked for and times a different plan.
- **`bytes read` and `peak buffer memory` come from the COLD run only.** The warm
  median has no byte count beside it, because a profiled repeat would report the
  cached run and print near-zero. The two columns describe different executions.
- **"Cold" is DuckDB-cold, not server-cold.** `openFrame()` reads the schema with
  `DESCRIBE` on a separate connection first, and the object store and OS may hold
  their own caches. It is the first touch by *this* DuckDB instance, which is the
  reproducible thing to measure, not a guaranteed cache miss end to end.
- **`cpu time` exceeds `latency` on parallel queries** — it is summed across
  threads. The geo query shows 1,634,982 ms of CPU against 212,421 ms of latency
  on 8 threads.

---

# Reading the output

| metric | what it is |
|---|---|
| `cold (first touch)` | the first run, profiled. **A single measurement** — see the gotcha below |
| `warm median` | median of `--repeats` after a discarded warmup |
| `latency` | DuckDB's own engine time, excluding JS |
| `cpu time` | summed across threads, so it exceeds latency when parallel |
| `blocked thread time` | stalled. On a remote corpus this is the network |
| `bytes read` | moved over the wire on the cold run |
| `peak buffer memory` | DuckDB's own measured peak. **Not** process RSS |
| `peak spill` | 0 means it never went to disk |
| `rows out of the scan` | what the scan handed upward — the pruning/pushdown signal |
| `rows returned` | the answer's row count |
| `result size` | bytes converted into JS (`--rows json` only) |

---

# Gotchas, each of which cost a real measurement

**Pushdown is not pruning.** Both of these had their filters pushed *into* the
scan, and the tool says so. One read 35.7 MB in 104 ms; the other read 3.6 GB in
106 s — a 1,000× gap:

| query | pushed down? | bytes read | of which data | warm |
|---|---|---|---|---|
| `WHERE date BETWEEN ...` | yes | 35.7 MB | ~22 MB | 103.7 ms |
| `WHERE location.lat/lon BETWEEN ...` | yes | 3.6 GB | ~3.59 GB | 106,184 ms |

The date predicate can skip row groups because the file is clustered by time.
Latitude and longitude are scattered across every row group, so the identical
mechanism eliminates nothing. **Check `bytes read` minus the ~13.7 MB footer
floor, not whether the filter pushed.**

**Cold readings are one noisy sample**, dominated by the footer fetch rather than
your query — see [What the numbers actually contain](#what-the-numbers-actually-contain).
Quote the warm median.

**`memory_limit` does not bound the process.** The geo query above peaked at
**3.9 GB of buffer memory under a 2 GiB `--memory-limit`**. The limit governs
DuckDB's buffer pool, not RSS; a full run lands near 3 GB plus ~2.1× the limit.

**The first query after `SET profiling_output` does not land at the new path.**
The script issues a throwaway `SELECT 1` to arm it. Without that, the run produced
correct timings and printed "No profile was written" for the entire engine table.
Do not remove the arming query as dead code.

**`_key` is not unique in this corpus**, and neither is `(date, _key)` — so do not
build a paging cursor on them. See `fixtures/extract-noaa.mjs`.

---

# NOAA-specific: filter on the quality code

**Do not chase sentinel values, filter on `<field>_quality`.** Measured:
`dew_point_temperature_c = 999.9` occurs 106,782,280 times, and
`dew_point_quality = '9'` accounts for 106,781,186 of them. `'1'` and `'5'` are the
passing codes.

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
`STRUCT(lat DOUBLE, lon DOUBLE)`, so address it as `location.lat` / `location.lon`.
