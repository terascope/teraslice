# `bench/comparison/` — DataFrame vs TealFrame

Runs the same work on both engines at nine scales and writes a markdown report, by default to
`bench/comparison/PERFORMANCE.md` (git-ignored).

```bash
cd packages/data-mate && pnpm build
node bench/comparison/sweep.js                           # the full sweep, supervised

SCALES=1000,10000 RUNS=1 node bench/comparison/run.js    # quick pass, one process
OUT=/tmp/report.md node bench/comparison/run.js          # write the report elsewhere
node bench/comparison/render.js                          # re-render from saved results
```

`CHECKPOINT=1` compresses the TealFrame tables before each case is timed. An in-memory DuckDB
table stays uncompressed until a checkpoint, and compression changes what a scan reads and how
often a UDF is called, so this changes the results rather than just tuning them. To see what it
buys, sweep twice into separate result files:

```bash
RESULTS=bench/comparison/.plain.json  ENGINES=tealframe node bench/comparison/sweep.js
RESULTS=bench/comparison/.ckpt.json   ENGINES=tealframe CHECKPOINT=1 node bench/comparison/sweep.js
```

The checkpoint runs during each case's setup, so it is never part of a timing. After an ingest, a
plain `CHECKPOINT` can return immediately without compressing anything, so the harness first does
a throwaway write to make it run, then checks `pragma_storage_info`. If the table is still
uncompressed, the cell is reported as a failure.

Use `sweep.js` for a full run. At 3M rows, `DataFrame.unique(fields)` does not throw: V8 prints
`Ineffective mark-compacts near heap limit` and aborts the process, which no `try/catch` can
catch. The supervisor runs one scale and one engine per child process. When a child dies, it reads
the in-flight marker to find the case that was running, records that cell as `OOM (fatal abort)`,
and restarts after it. It also kills and reports a child that stops producing output for
`CASE_TIMEOUT` seconds (default 1800).

Run `run.js` directly for a quick pass, or for the lifecycle section, which times both engines as
a pair and so needs one process with both loaded.

These benchmarks are separate from `bench/suites/`, which are benchmark.js micro-benchmarks that
run a case thousands of times. The cases here run a few very large operations, need their own
rules for forcing execution, and must tolerate one engine running out of memory. `index.js` does
not discover them.

## Measurement rules

- The corpus is seeded and identical for both engines. There is no `Math.random()`, so a case at
  1M rows gets the same records on every run.
- Generating records is never timed. Records are built once per scale and given to both engines.
- Each timing is the median of `RUNS` samples after a discarded warm-up. The first call pays for
  DuckDB instance creation and V8 warm-up, which would dominate a 1k-row timing.
- Setup is per engine and untimed. A sort case starts from a frame that already exists, and
  `setupDataFrame` and `setupTealFrame` each build only their own side, so a failure in one
  engine's setup does not remove the other engine's result.
- Row counts are compared. Each case returns how many rows it produced, and the report warns when
  the two engines disagree, so a faster result cannot come from doing less work.
- `TealFrame` is lazy, so every case forces execution, and the method is chosen per case:
  `count(*)` for a filter or join (how fast the rows are found), `materialize()` for anything that
  must produce a usable frame, and a full row drain where the `DataFrame` side also produces JS
  values. A sort is never forced with a count, because the optimizer drops the `ORDER BY` and the
  case would measure nothing.
- An out-of-memory error is a result, not a crash. It is caught and recorded, and the run
  continues. Give Node a large heap so the limit reported is the engine's, not the flag's.

## The corpus

`lib/generate.js` defines 30 top-level columns (35 declared field paths) covering Keyword, Text,
Byte, Short, Integer, Long, Float, Double, Number, Boolean, Date, IP, GeoPoint, seven array types,
and two nested objects.

Two columns are sparse on purpose. Both have types that other columns also cover, so no type
loses coverage:

| column | type | |
|---|---|---|
| `subnet` | Keyword | null in every record: a declared field that nothing populates, which is common in real DataTypes and the cheapest column either engine can hold |
| `expires` | Date | null in half the records, so neither engine can take an all-or-nothing shortcut and per-value branching shows up |

Values stay inside each type's range. The engines handle out-of-range `Byte`/`Short` values and
`Long` values above `MAX_SAFE_INTEGER` differently, so including them would measure error paths
and make one engine fail where the other does not.

## Layout

| | |
|---|---|
| `sweep.js` | supervises the full run: one child per scale and engine, survives a fatal abort |
| `run.js` | runs one pass, prints progress, writes the report |
| `render.js` | renders the report from the saved results |
| `lib/generate.js` | the corpus: config, seeded records, scales |
| `lib/harness.js` | timing, forcing, OOM handling, formatting |
| `lib/cases.js` | the cases, grouped by feature |
| `lib/report.js` | markdown rendering |
| `lib/results.js` | the result file, per-engine merging, and the in-flight marker |
| `lifecycle/search-lifecycle.js` | an end-to-end search request (API process, then worker), DataFrame vs TealFrame |

## Adding a case

```js
{
    name: 'what it does',
    note: 'what the reader needs to know to trust the number',
    setupDataFrame: dfFrame,          // untimed, DataFrame's prerequisites only
    setupTealFrame: duckTable,        // untimed, TealFrame's only
    async dataFrame(ctx, state) { /* return rows produced, or SKIPPED */ },
    async tealFrame(ctx, state) { /* must end in force(...) */ },
    teardownTealFrame: destroyDuck,   // and teardownDataFrame, where one is needed
}
```

`dfFrame`, `duckTable` and `destroyDuck` in `lib/cases.js` cover what most cases need. Each
engine's setup, timing and teardown are caught separately, so a failure is recorded against the
engine that had it and the other engine still reports.

Return `SKIPPED` where an engine has no equivalent, such as Parquet or joins for `DataFrame`,
rather than bending the case into something comparable.
