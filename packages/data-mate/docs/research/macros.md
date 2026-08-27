# DuckDB macros: scope, persistence, and the traps for a query generator

Researched 2026-08-18. Docs quotes from `duckdb-web/docs/current/...`; behaviours marked MEASURED were
verified on DuckDB 1.5.5 via the installed `@duckdb/node-api`.

## Scope and persistence

- "The `CREATE MACRO` statement defines a named, callable SQL expression as a **database schema
  object**." Non-TEMP macros **persist in the database file**; `TEMPORARY` means "not to be persisted".
- **TEMP macros are connection-scoped.** Normatively documented only for tables/views; for macros it
  appears once, parenthetically, in an example ("will be automatically deleted when the connection
  ends"). Source backs it: `CREATE TEMP MACRO` is routed into the `temp` catalog, which lives in
  `ClientData` (per `ClientContext`, i.e. per connection).
- **On an in-memory database, a non-TEMP macro IS visible to every other connection of that instance**
  (MEASURED: created on c1, callable on c2; a TEMP macro is not). This is NOT documented outside a
  Python `:memory:name` paragraph - relevant because our frames share one `:memory:` instance.
- `duckdb_macros()` does not exist; list via `duckdb_functions()` with `internal = false`. Macros are
  also missing from the CLI's `.schema` (issue #8159, closed stale).

## The traps

1. **A macro silently shadows a built-in.** MEASURED: `CREATE MACRO upper(x) AS 'SHADOWED'` succeeds
   with no warning, and `SELECT upper('a')` returns `'SHADOWED'`. Worse, it **replaces the built-in's
   entire overload set**: after `CREATE MACRO substr(x)`, the 3-arg `substr` is unreachable. Escape
   hatch is full qualification, `system.main.substr(...)`. Precedence measured:
   `temp.main` macro > catalog macro > built-in. **Not documented anywhere.** For a code generator that
   emits macro names, this is a silent-wrong-answer risk - namespace every generated macro.
2. **Unqualified names inside a macro body resolve against the CALLER's search path at call time.**
   MEASURED: a macro in an attached DB that calls a sibling macro fails with
   `Catalog Error: ... does not exist!` unless you `USE` that catalog or set `search_path`. Open bug
   duckdb/duckdb#18437; the "sharing macros" guide promotes exactly the pattern that breaks. So macro
   bodies must be **fully qualified**, or macros must live in the same catalog they are called from.
3. **Typed macro parameters need storage version >= v1.4.0** - source-only error, zero doc mentions.
   Fine for in-memory and TEMP macros; a file created with default `storage_compatibility_version`
   (`v0.10.2`) cannot hold them.
4. **Typed params do NO implicit casting**, not even lossless: `tint(a INTEGER)` rejects `'12'` and
   `1.7` with "does not support the supplied arguments". Bind-time, even for zero rows.
5. **No overloading after creation** - all arities must be in ONE `CREATE MACRO`; a second
   `CREATE MACRO m(a,b)` fails with `Macro Function with name "m" already exists!` even at a different
   arity. `CREATE OR REPLACE` replaces the whole set.
6. **Macros are invisible in EXPLAIN.** MEASURED: logical, optimised, physical and JSON plans show only
   the expanded expression - the macro name appears nowhere (only `EXPLAIN ANALYZE`'s echoed query
   text). Debugging means reading `macro_definition` from `duckdb_functions()` and expanding by hand.
7. Documented limits: no recursion; table macros/subquery macros cannot be arguments to table
   functions; no dot-chaining on the first function; named args use `:=` not `=`; default values are
   evaluated at definition time.

## Verdict for SQL emission

Macros are inlined into the plan ("they are expanded ... and the parameters ... replaced with the
supplied arguments"), so they parallelise exactly like a hand-written expression - no runtime cost
argument against them. But for a generator, **splicing expressions inline avoids traps 1, 2, 3 and 6
entirely**. Macros are worth it only where a name must be shared across queries or exposed to users,
and then only fully qualified and namespaced (e.g. `qpl.to_upper_case`).
