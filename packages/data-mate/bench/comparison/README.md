# `bench/comparison/` — DataFrame vs DuckFrame

Produces `docs/PERFORMANCE.md`: the same work asked of both engines, across nine scales.

```bash
cd packages/data-mate && pnpm build
node --max-old-space-size=24576 bench/comparison/run.js

SCALES=1000,10000 RUNS=1 node bench/comparison/run.js    # quick pass
OUT=/tmp/report.md node bench/comparison/run.js          # write it elsewhere
```

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
- **`setup` is not timed.** A case that measures sorting starts from a frame that already exists.
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
| `run.js` | runs everything, prints progress, writes the report |
| `lib/generate.js` | the corpus: config, seeded records, scales |
| `lib/harness.js` | timing, forcing, OOM handling, formatting |
| `lib/cases.js` | the cases themselves, grouped by feature |
| `lib/report.js` | markdown rendering |
| `lifecycle/spaces.js` | the end-to-end spaces flow, today vs DuckFrame |

## Adding a case

```js
{
    name: 'what it does',
    note: 'what the reader needs to know to trust the number',
    async setup(ctx) { /* untimed; build frames here */ return state; },
    async dataFrame(ctx, state) { /* return rows produced, or SKIPPED */ },
    async duckFrame(ctx, state) { /* MUST end in force(...) */ },
    async teardown(ctx, state) { /* destroy frames */ },
}
```

Return `SKIPPED` where an engine genuinely has no equivalent — Parquet and joins for
`DataFrame` — rather than bending the case into something comparable.
