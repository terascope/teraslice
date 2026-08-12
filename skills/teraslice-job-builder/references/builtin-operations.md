# Reference: built-in operations

These ops ship with Teraslice core and need **no asset bundle**.

**Authoritative, always-current source — `WebFetch` this:**
`https://terascope.github.io/teraslice/docs/jobs/builtin-operations`

| `_op` | Role | Key fields | Notes |
|---|---|---|---|
| `test-reader` | reader | `fetcher_data_file_path`, `slicer_data_file_path`, `passthrough_slice` | Reads records from a file; for testing pipelines/processors |
| `noop` | processor | — | Passes data through unmodified; dev/placeholder |
| `delay` | processor | `ms` (default `100`) | Waits, then passes data through |
| `collect` | processor | `size`, `wait` (ms) | Batches records until `size` collected or `wait` elapses, then emits |

> **`script` and `stdout` are no longer built into Teraslice core.** They were
> removed from `packages/job-components/src/builtin/` (which now ships only
> `noop`, `delay`, `collect`, and `test-reader`). Treat them as
> **standard-assets** ops — the job must list the `standard` asset and fetch
> that bundle's docs for current fields. The published built-in-operations page
> may still list them; the code above is the source of truth. Re-verify before
> relying on either.

`noop` and `delay` are the handy placeholders when you need a valid
2nd operation (remember: `operations` must have ≥ 2) but haven't wired up the
real sender yet.

For exact/current field lists fetch the page above.
