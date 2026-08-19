# `bench/comparison/` — DataFrame vs DuckFrame

Produces `docs/PERFORMANCE.md`: the same work asked of both engines, across nine scales.

```bash
cd packages/data-mate && pnpm build
node bench/comparison/sweep.js                           # the full sweep, supervised

SCALES=1000,10000 RUNS=1 node bench/comparison/run.js    # quick pass, one process
OUT=/tmp/report.md node bench/comparison/run.js          # write it elsewhere
node bench/comparison/render.js                          # re-render what is measured
```

**Use `sweep.js` for a full run.** `DataFrame.unique(fields)` at 3M does not throw - V8 prints
`Ineffective mark-compacts near heap limit` and **aborts the process**, which no `try/catch` can
survive. In one process that cost the 12 cases after it, at 3M and again at 5M: every ldjson case,
both joins and all the aggregations, missing at exactly the scales that make the argument. The
supervisor runs one scale and one engine per child, records the case that died from the in-flight
marker, and restarts after it - so a death becomes an `OOM (fatal abort)` cell instead of a hole.
It also kills and reports a child that stops producing output (`CASE_TIMEOUT`, default 1800s).

`run.js` directly is for a quick pass, and for the **lifecycle** section, which times both engines
as a pair and therefore needs one process with both loaded.

Separate from `bench/suites/` on purpose. Those are benchmark.js micro-benchmarks that run a case
thousands of times; these run a handful of very large operations, need their own forcing rules,
and have to tolerate one engine running out of memory. `index.js` does not discover them.

## Why the numbers can be trusted

Every one of these exists because getting it wrong changes the result:

- **The corpus is seeded and identical for both engines.** No `Math.random()`; a case at 1M rows
  gets the same records today and tomorrow.
- **Generation is never timed.** Records are built once per scale and handed to both engines.
- **Median of `RUNS` after a discarded warm-up.** The first call pays for DuckDB instance
  creation and V8 warm-up; at 1k rows a single timing is mostly that.
- **Setup is per engine, and not timed.** A case that measures sorting starts from a frame that
  already exists - and `setupDataFrame`/`setupDuckFrame` build only their own side's. A shared
  setup hid each engine behind the other's failure: when `DataFrame.fromJSON` could not be built at
  5M, the case was skipped for BOTH, so the report lost DuckFrame's number rather than reporting
  DataFrame's ceiling. It also had `ENGINE=duckframe` building a `DataFrame` it never measured.
- **Row counts are compared.** Each case returns how many rows it produced; a mismatch is printed
  in the report as a warning. "Faster" must never mean "did less".
- **`DuckFrame` is lazy, so every case forces execution** — and the forcing method is chosen per
  case. `count(*)` for a filter or join (how fast are the rows found), `materialize()` for
  anything that must yield a usable frame, a full row drain where the `DataFrame` side also
  produces JS values. **A sort is never forced with a count**, because the optimiser would drop
  the `ORDER BY` and the case would measure nothing.
- **An OOM is a result, not a crash.** It is caught, recorded, and the run continues. Give Node a
  large heap so the limit found is the engine's, not the flag's.

## The corpus

30 top-level columns (35 declared field paths) in `lib/generate.js`, spanning Keyword, Text,
Byte, Short, Integer, Long, Float, Double, Number, Boolean, Date, IP, GeoPoint, seven array
types, and two nested objects.

Two columns are deliberately sparse, both of redundant types so nothing loses coverage:

| column | type | |
|---|---|---|
| `subnet` | Keyword | **null in every record** — a declared field nothing populates, which is very common in real DataTypes and is the cheapest column either engine can hold |
| `expires` | Date | **null in half the records** — neither engine can take an all-or-nothing shortcut, so per-value branching shows up |

Values stay inside their type's range on purpose. `Byte`/`Short` bounds and `Long` above
`MAX_SAFE_INTEGER` are known divergences between the engines (the shelved defect list in
`docs/HANDOFF.md`); feeding those here would measure error paths, and would make one engine fail
where the other does not.

## Layout

| | |
|---|---|
| `sweep.js` | supervises the full run: one child per scale+engine, survives a fatal abort |
| `run.js` | measures one pass, prints progress, writes the report |
| `lib/generate.js` | the corpus: config, seeded records, scales |
| `lib/harness.js` | timing, forcing, OOM handling, formatting |
| `lib/cases.js` | the cases themselves, grouped by feature |
| `lib/report.js` | markdown rendering |
| `lib/results.js` | the result file, per-half merging, and the in-flight marker |
| `lifecycle/spaces.js` | the end-to-end spaces flow, today vs DuckFrame |

## Adding a case

```js
{
    name: 'what it does',
    note: 'what the reader needs to know to trust the number',
    setupDataFrame: dfFrame,          // untimed, DataFrame's prerequisites only
    setupDuckFrame: duckTable,        // untimed, DuckFrame's only
    async dataFrame(ctx, state) { /* return rows produced, or SKIPPED */ },
    async duckFrame(ctx, state) { /* MUST end in force(...) */ },
    teardownDuckFrame: destroyDuck,   // and teardownDataFrame, where one is needed
}
```

`dfFrame` / `duckTable` / `destroyDuck` in `lib/cases.js` are the halves most cases need. Each
half's setup, timing and teardown are caught separately, so one engine's failure is recorded
against that engine and the other still reports.

Return `SKIPPED` where an engine genuinely has no equivalent — Parquet and joins for
`DataFrame` — rather than bending the case into something comparable.
