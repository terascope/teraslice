# Client UDF parallelism across DuckDB bindings

Researched 2026-08-18 from primary sources (duckdb.org, github.com/duckdb/*, installed packages).
**Node's serialization is a binding artifact, not a DuckDB C-API constraint.**

## The table

| | node-api (measured here) | duckdb-rs (Rust) | duckdb-java |
|---|---|---|---|
| granularity | chunk (`mainFunction(info, chunk, out)`) | chunk (`DataChunkHandle`) or Arrow `RecordBatch` | chunk (`DuckDBDataChunkReader`), <=2048 rows |
| runs on the DuckDB worker thread? | **No** - hopped to the JS loop, and the worker BLOCKS | **Yes, inline** | **Yes**, after `AttachCurrentThread` |
| lock on the hot path? | effectively serialized | **none** | **none** (lock only at `register()`) |
| concurrency contract | serialized | **documented**: `State: Send + Sync`, "Shared across worker threads" | **undocumented**; proven by source + a `PRAGMA threads=4` test |
| maturity | ships, README-only docs | since v1.2.1, not experimental | since **v1.5.2.0 (2026-04-13)**, 1.5-only, no duckdb.org docs, no STRUCT/LIST |
| per-thread local state | no | not exposed | not exposed |

## The evidence

**Node** - `bindings/src/duckdb_thread_callback.h`: DuckDB calls the callbacks "on worker threads. JS
can only run on the JS thread, so each call is handed to a thread-safe function and **the calling
DuckDB thread blocks until it has run**." `Napi::TypedThreadSafeFunction` created with **1 thread**;
`Invoke` is a condition-variable wait. README (table functions, same mechanism): "Callbacks are always
run on the JS thread, so they are **serialized even when DuckDB scans in parallel**."

**Rust** - `crates/duckdb/src/vscalar/mod.rs` rustdoc on `VScalar::State`: "**Shared across worker
threads and invocations**; any interior mutation must be synchronized" - and `Send + Sync` is
compiler-enforced. The C trampoline builds everything from the raw pointers on the calling thread; the
only lock anywhere in the path is `io::stderr().lock()` in the panic-reporting branch. Caveat: **no
parallelism test in the repo** - parallel execution is asserted by types and docs, not by a test.

**Java** - `src/jni/bindings_scalar_function.cpp` calls `attach_current_thread()` then
`env->CallVoidMethod(...)`: textbook per-worker-thread `JNIEnv` attach, no mutex, no queue. PR #630
states the JNI surface is "JVM thread attach/detach from DuckDB execution threads". There IS a test:
`TestScalarFunctions.test_register_scalar_function_parallel` runs `PRAGMA threads=4` over
`range(1000000)` and asserts the sum. Thread-safety of the callback is NOT documented in `UDF.MD`.

**The core makes it free** - `src/main/capi/scalar_function-c.cpp` has no mutex/lock/thread token in
543 lines; it calls the C function pointer inline and pulls per-thread state from the operator's local
state. `duckdb.h` on `duckdb_scalar_function_set_init`: "**called once for each worker thread that
begins executing the function**" (unstable v1.5.0, stable v1.5.6). Neither Rust nor Java exposes that
init hook yet, so neither offers per-worker-thread local UDF state - a capability gap, not a
serialization one.

## What this does and does not imply

It does **not** follow that hosting the engine elsewhere is worth it - a DuckDB **extension** (C++, or
v2.0's stable versioned C API) gets the same worker-thread parallelism AND native marshalling while
loading into the existing Node process. See `docs/HANDOFF.md` for the cost analysis.
