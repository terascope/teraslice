# `tools/` — benchmarks, probes, and the parity generator

Everything here runs with **plain `node`, from anywhere in the repo**:

```bash
node packages/data-mate/docs/tools/bench/append-ingest.mjs
node packages/data-mate/docs/tools/probe/tie-stability.mjs
```

That was not true before. Scripts used to `import … from '@duckdb/node-api'`, which only resolves
if you run them from a directory where that package is installed, so the documented procedure was
"make a scratch dir, `npm init`, `npm install @duckdb/node-api`, copy the script in". One had
given up and hardcoded an absolute path into the pnpm store. They now go through
**`lib/duck.mjs`**, which resolves the binding — and the built `dist` — out of the repo's own
install.

**Anything touching the real `DuckFrame` needs the build first:**

```bash
cd packages/data-mate && npx tsc -b
```

## Layout

| | what is in it |
|---|---|
| `lib/duck.mjs` | the shared harness: `duckdb()`, `open()`, `duckFrame()`, `dataMate()`, timing helpers, and the **envelope** constants |
| `bench/` | performance. The things to re-run when something changes |
| `probe/` | behaviour questions, each already answered — the script is the evidence |
| `parity/` | the generator behind `docs/duckdb-parity.md`. Deterministic; do not hand-edit its output |
| `docker/` | container harnesses (`Dockerfile.join`, `Dockerfile.life`) |
| `archive/` | **dead.** Kept for provenance only — see below |

## Before you quote a number: the envelope

`lib/duck.mjs` exports `WORKER` (48 GiB, all cores) and `API_SERVER` (4 GiB, 2 threads), plus
`applyEnvelope()`, which **prints what it applied** so no run is ambiguous about its conditions.

**Queries and joins run in the forked `spaces_qpl_worker` at ~64 GB, not in the api-server.**
Three sessions in a row produced worthless join numbers by inheriting `MEM=6GB THREADS=2` from an
old probe — a tier that never runs a join — including a bogus "the nested join OOMs and will not
spill" finding that actually came from a `memory_limit` set above the container cap. `WORKER` is
therefore the default everywhere. If you deliberately squeeze it, **say so when reporting.**

Use **binary units**: DuckDB reads `'2GB'` as 2×10⁹ bytes and then reports it back as `1.8 GiB`.


## The 2026-08-25 storage report — five benches, three probes, one generator

These were written to answer the five questions in the boss-facing report
(`https://claude.ai/code/artifact/58c8f09f-3cda-4b30-a886-a48a570e1d6a`). **They write JSON into
`tools/results/`, and `tools/report/build-report.mjs` renders the page from those files** — so the
report cannot drift from the measurements and a transcription error is impossible. Re-run a bench,
rebuild, the report is current.

| script | answers |
|---|---|
| `bench/report-ladder.mjs` | formats x scale (100k-100M) over the full battery, **and** memory-vs-disk for the same table |
| `bench/report-ingest.mjs` | append vs land-the-bytes vs land-then-materialise, with **break-even in queries** and a payload-size sweep |
| `bench/report-consolidation.mjs` | file layout: as-landed vs four consolidation targets vs a native table, **row groups censused** |
| `bench/report-transforms.mjs` | all-SQL vs mixed vs all-UDF, crossed with uncompressed / compressed / parquet-view |
| `bench/report-s3.mjs` | local vs S3 with **modelled round-trip latency**, crossed with the httpfs caches |
| `probe/memory-metric.mjs` | what `duckdb_memory()` actually measures (answer: not resident memory) |
| `probe/parquet-memory-limits.mjs` | which query shape OOMs on Parquet under a tight limit, and at what limit |
| `probe/parquet-scan-law.mjs` | what the Parquet scan's working set is proportional to |
| `lib/latency-proxy.mjs` | the HTTP proxy that injects per-request latency in front of minio |
| `report/build-report.mjs`, `report/charts.mjs` | renders `report.html` from `results/*.json`; hand-authored SVG, no chart library |

`bench/report-layout.mjs` is **superseded by `report-consolidation.mjs`**, which censuses row groups
for every layout (including the native table, which `report-layout` inferred) and adds the
intermediate consolidation targets. Kept for provenance only.

### Traps these runs added, each of which cost a result

- **`memory_limit` must be BELOW the machine's real memory.** The shared `WORKER` constant is 48 GiB
  and this box has 36 GB — above the cap DuckDB never spills and the kernel kills the process. These
  benches set 24 GiB explicitly and print it.
- **`process.resourceUsage().maxRSS` is in KILOBYTES**, on every platform. Treating it as bytes made a
  717 MB process look like 0.7 MB.
- **DuckDB's `COPY ... TO 's3://...'` does NOT create the bucket** — it fails `NoSuchBucket`, and this
  build has no `mc`. Single-drive minio stores a bucket as a top-level directory, so
  `docker exec <name> mkdir -p /data/<bucket>` creates it.
- **`LIMIT n OFFSET k` in a batching loop is QUADRATIC** — each batch rescans from the start. It
  produced non-monotonic "build cost" numbers (12.0 s for 82 objects, 3.5 s for 20, 14.6 s for 5)
  that measure the loop, not the work. Those figures are excluded from the report and said to be.
- **A `nohup ... &` inside a tool call reports the WRAPPER's exit status, not the job's.** Two
  "completed" notifications arrived while the bench was still running. Check `ps`, or wait on the real
  PID — the §0.7 lesson in another costume.

## `bench/`

**`docs/` is outside the tsconfig, so `npx eslint` reports a parsing error on these `.mjs` files
rather than checking them. Use `node --check`.**

Two traps that have each cost a run:

- **Never run two of these at once.** Two DuckDB benches sharing the cores produce four numbers that
  are all wrong and none obviously so. Serialise.
- **Never inherit a script's defaults.** Reproducing a recorded finding by re-running its script
  reproduced its wrong premise (`join-shapes.mjs` at 6 GB / 2 threads). Set the envelope explicitly.
- **Never time a filter without printing what it MATCHES.** The shared battery filtered
  `category = 'cat-3'` against a generator producing `alpha/beta/gamma/…` and matched **zero rows for
  its whole life**; a zero-match filter returns a plausible small number and is indistinguishable from
  a fast query. `native-advantages.mjs` prints a selectivity table first — copy that.

| script | measures |
|---|---|
| `append-ingest.mjs` | ingest end to end through the real frame — producer (`fromRecords` + `writeParquet`) and worker (`create` + `append`), including the three ways to take N payloads. `PAYLOADS` / `PER` env vars |
| `append-concurrency.mjs` | concurrent appends: interleaved transactions on one connection vs a connection per fetcher, and the throughput of each. **This is the script that found the shared-connection correctness bug** |
| `join-shapes.mjs` | the six join formulations QPL needs, as raw SQL. `P` / `C` / `CARD` / `MEM` / `THREADS` / `SPILL` env vars. **Its defaults were invalid (6 GB / 2 threads) and are now the worker envelope** |
| `checkpoint-effect.mjs` | what a checkpoint DOES, per operation at one size: memory, compression schemes, UDF call counts |
| `checkpoint-strategy.mjs` | WHICH strategy: no checkpoint / one at the end / every 5 payloads / file-backed. In-memory + one at the end wins |
| `checkpoint-cost.mjs` | what a checkpoint COSTS, per size: `SCALES`, `PAYLOADS`, `REPEATS`. Arms and **verifies** the call, because a plain `CHECKPOINT` after the ingest path silently does nothing |
| `checkpoint-payback.mjs` | differences two comparison sweeps (`CHECKPOINT=0` vs `=1`) into a per-operation payback table. Reads result files, measures nothing itself |
| `checkpoint-by-type.mjs` | who actually benefits from a CHECKPOINT: every column TYPE crossed with every CARDINALITY |
| `parquet-query.mjs` | **querying Parquet payloads DIRECTLY versus materialising a table.** `SCALES` / `FILES` / `STORAGE` / `REPEATS`, and **`ROW_GROUP_SIZE`, which is the axis that separates file count from row-group count** — the run that proved the row group is the unit of cost. Censuses row groups with `parquet_file_metadata` before measuring |
| `native-advantages.mjs` | **the FAIR fight**: native with an ART index and/or a sort, against Parquet plain and sorted, on queries chosen to isolate each mechanism (point lookup, high-card equality, narrow/wide range on the sort key). **Prints what every predicate MATCHES before timing anything** — it caught two zero-match bugs in its own first run |
| `consolidation-matrix.mjs` | **the decision bench**: consolidate vs not, crossed with local vs S3, at REAL variable slice sizes. Models the true flow — stateless api returns Parquet over the wire, the worker is the only place that can batch. Reports land cost, query cost and **break-even in queries**. `TOTAL` / `PROFILES` / `ORIGINS` |
| `slice-payloads.mjs` | **the REAL producer constraint**: payloads at 10k/50k/100k — every one under the 122,880-row group — against stitched, one-big-file and a real table. `TOTAL` / `PER`. Censuses row groups and prints predicate selectivity |
| `slice-payloads-s3.mjs` | the same many-vs-one comparison on **real minio**, with the three `httpfs` caches as an axis. Needs the minio container; localhost RTT is sub-ms, so multiply the request count by your own round-trip |
| `storage-formats.mjs` | **DuckDB's native storage against every format it reads** — size, write cost, load cost and the same 15-query battery, for native / Parquet zstd·snappy·none / Arrow IPC / CSV / NDJSON. `ROWS` / `REPEATS` / `TEXT_REPEATS` / `SKIP_TEXT`. Generates the corpus ONCE and `COPY`s it to every format, and **verifies the native checkpoint proportionally** before reading any size |
| `parquet-remote.mjs` | the same over HTTP and against a real minio S3 endpoint, every request counted, with the `httpfs` caches as a measured axis. **The three caches are OFF by default and are the whole story** |
| `scale-ingest.mjs` | how big ONE table gets, what it costs, and when to checkpoint. `TARGET` / `PER` / `CONCURRENCY` / `CHECKPOINT_EVERY` / `MEMORY_LIMIT` / `DB`, and **`AUTO_CHECKPOINT=off`, which raises `checkpoint_threshold` so no COMMIT can charge compression to a timed append** — added 2026-08-24, and it is what explained the 1.48 s/M vs 892 ms/M gap |
| `billion.mjs` | 1B rows in a file-backed table, then real queries against it. Self-cleaning |
| `join-stream.mjs` | whether a join of two very large tables can be STREAMED out without materialising the result |
| `sql-vs-udf.mjs` | the SAME function both ways — spliced SQL expression against a JavaScript UDF |
| `transform-mix.mjs` | what adding a UDF to an otherwise-native projection costs, and whether there is a threshold. **There is not — ~171 ns/value, linear** |
| `udf-cardinality.mjs` | how many times a scalar UDF is actually CALLED. **It is not once per row** — once per DISTINCT value on a dictionary-compressed column |
| `udf-threads.mjs` | whether a transform gets faster with more cores, and whether a JS UDF gets any of it |
| `udf-isolates.mjs` | whether a JS UDF parallelises across Node worker threads, each with its own DuckDB instance. **The partition query was wrong twice; treat results as unproven** |
| `parallel-produce.mjs` | whether the PRODUCER leg goes wider — `fromRecords` on N worker threads |
| `ingest-breakdown.mjs` | why `fromRecords` is slower than `DataFrame.fromJSON` on the 30-field corpus but faster on 7 fields |
| `mutate-in-place.mjs` | what a transform costs mutating in place instead of building a new table. **Hangs after printing everything** — node-neo PR #457 |
| `output-formats.js` | how fast a result can leave the frame. **Has still never been run** |

**Do not benchmark through jest.** Measured: the same ingest bench reports **~4× worse** under
`ts-scripts test` than as a standalone script, because of swc transpilation, the per-file module
registry and coverage instrumentation. Any figure that came from a `*-spec.ts` benchmark is
pessimistic by roughly that factor.

## `probe/`

Each answers one question and prints the evidence. Findings are written up in `../HANDOFF.md`;
these are the scripts that produced them.

| script | the question |
|---|---|
| `order-and-limit.mjs` | does nesting `ORDER BY` in a subquery lose fusion with an outer `LIMIT`? (No — the optimiser flattens it) |
| `order-limit-plans.mjs` | raw `EXPLAIN` for those formulations — the `TOP_N` + rowid-semi-join shape |
| `order-preservation.mjs` | which operators preserve a subquery `ORDER BY`. Projection/`WHERE`/`LIMIT` do; `JOIN` and `GROUP BY` do not — **but only at scale** |
| `tie-stability.mjs` | a tie-heavy `ORDER BY` is not deterministic, so paging over one duplicates and drops rows |
| `null-ordering.mjs` | `default_null_order` is `NULLS_LAST` for **both** directions, unlike `DataFrame` |
| `offset-without-limit.mjs` | is `OFFSET` valid with no `LIMIT`? (Yes) |
| `distinct-types.mjs` | does `DISTINCT` handle LIST/STRUCT columns, treat NULLs as equal, and reorder? (Yes, yes, yes) |
| `unnest-shapes.mjs` | the two `expand_values` shapes — positional zip vs cross product — and that `unnest` drops `[]`/NULL rows |
| `identifier-quoting.mjs` | reserved words need quoting, and a quoted identifier is case-**in**sensitive (opposite of Postgres) |
| `append-transaction.mjs` | does an appender join the connection's transaction? (Yes — which is what makes `append` atomic) |
| `multi-parquet.mjs` | `read_parquet` over a list, `INSERT … BY NAME` vs positional, missing files |
| `conn-isolation.mjs` | a connection cannot hold an open streaming result while another query runs on it — 80% of rows lost, silently |
| `lifecycle.mjs` | startup cost: nothing runs until `create()`; import +45 MB, instance +33 MB |
| `fuzz-sort.mjs` | sort fuzzing from the `dataframe-bug-fix` work |
| `verify-defects.mjs` | the D1–D6 data-mate defect cases |
| `checkpoint-noop.mjs` | why a `CHECKPOINT` can return in 0 ms having compressed nothing. Separates the source of the writes (one connection / a connection per batch / Parquet) from the mode (`CHECKPOINT` vs `FORCE CHECKPOINT`) |
| `view-vs-inline.mjs` | is a `VIEW` over `read_parquet` the same as inlining it, is a glob the same as a path array, and how the gap to a real TABLE moves with row-group fill. **Prints plan operator sequences before any timing** — the view's extra `PROJECTION` node is visible there and costs nothing |
| `auto-checkpoint-trigger.mjs` | WHEN DuckDB's automatic checkpoint fires during ingest, with `checkpoint_threshold` swept so "the 16 MiB default governs it" becomes testable |
| `checkpoint-fragmentation.mjs` | why a checkpoint at 500k rows costs more than one at 2M |
| `sql-semantics.mjs` | whether the recorded "divergences" are a limit of SQL or just of the CAST that was tested |
| `remaining-26.mjs` | what is actually in the way of the unpromoted functions — `to_json` per column type, entropy as a list expression, `strftime`/`strptime`, the extension inventory |
| `group-a-candidates.mjs` | the six "nothing in the way" candidates: hash digests, the BigInt-vs-cast divergence, `round`/`DECIMAL`/`printf` against `toFixed`, `epoch_ms`, both `extract` modes |
| `re2-vs-js-regex.mjs` | where RE2's character classes disagree with JavaScript's, over real values. **Found DF10.** Builds every string from `\uXXXX` escapes — literal invisible characters got mangled on the way to disk twice |
| `ip-semantics.mjs` | whether the IP validations can be SQL, and exactly where `ip-utils` and `inet` disagree |
| `ip-transforms.mjs` | the IP transforms, which THROW where the validations return null |
| `geo-predicates.mjs` | whether the geo predicates disagree with DuckDB's spatial functions, and where. **Found DF8** |
| `export-json-parity.js` | whether DuckDB's own JSON export matches what `DataFrame` produces |
| `export-json-edges.js` | the two export-parity questions the first probe could not answer |
| `json-strip-nulls.js` | whether DuckDB can omit null keys from JSON, and what it costs |

## `archive/` — dead, kept only for provenance

`archive/ingest-probe/` is the abandoned `read_json` ingest design (~2,000 lines, deleted from
`src`). **Ten of its sixteen scripts import modules whose source no longer exists** —
`coercion-sql.js`, `ingest-sql.js`, `object-ingest.js`, `udf/geo-point.js`, `udf/coerce-field.js`.
They resolve only against a **stale `dist`**, so they measure code that is gone. Run from here
they now fail outright (`Cannot find package '@terascope/data-mate'`), which is the honest
outcome.

That includes `measure-parquet.mjs`, the source of the transport table in `HANDOFF.md` Part 8.
Its **conclusion** (Parquet + zstd, never JSON, never gzip) is settled and was re-confirmed
independently by `bench/append-ingest.mjs`; the script itself is not re-runnable.

Nothing here has been deleted. (`docs/` was untracked until 2026-08-27; it is now tracked for the
duration of the `dataframe-duckdb-refactor` branch, so deletion is recoverable — but it still needs
asking first. If the `read_json` history is no longer wanted, `archive/` is the thing to remove.
