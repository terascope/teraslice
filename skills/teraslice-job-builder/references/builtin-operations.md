# Reference: built-in operations

These ops ship with Teraslice core and need **no asset bundle**.

**Authoritative, always-current source — `WebFetch` this:**
`https://terascope.github.io/teraslice/docs/jobs/builtin-operations`

| `_op` | Role | Key fields | Notes |
|---|---|---|---|
| `test-reader` | reader | `fetcher_data_file_path`, `slicer_data_file_path`, `passthrough_slice` | Reads records from a file; for testing pipelines/processors |
| `script` | processor | `command` (required), `args`, `options`, `asset` | Runs a non-JS script in a child process; JSON over stdin/stdout. Not high-performance |
| `noop` | processor | — | Passes data through unmodified; dev/placeholder |
| `stdout` | processor/sink | `limit` (optional) | Console-logs incoming data; inspect between ops or at pipeline end |
| `delay` | processor | `ms` (default `100`) | Waits, then passes data through |

`noop`, `stdout`, and `delay` are the handy placeholders when you need a valid
2nd operation (remember: `operations` must have ≥ 2) but haven't wired up the
real sender yet.

For exact/current field lists fetch the page above.
