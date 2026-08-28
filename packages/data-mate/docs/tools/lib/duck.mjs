/**
 * Shared harness for everything in `tools/`.
 *
 * **Why this exists.** Every script here used to `import { DuckDBInstance } from
 * '@duckdb/node-api'`, which only resolves if you happen to run it from a directory where that
 * package is installed - so the documented way to run one was "make a scratch dir, npm init,
 * npm install @duckdb/node-api, copy the script in". One script had given up and hardcoded an
 * absolute path into the pnpm store, which breaks on any version bump. Now they resolve out of
 * the repo's own install and run with plain `node`, from anywhere:
 *
 *     node packages/data-mate/docs/tools/bench/append-ingest.mjs
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

/** Resolves from `packages/data-mate`, so the repo's own dependency tree is used. */
const fromDataMate = createRequire(new URL('../../../package.json', import.meta.url));

/**
 * The DuckDB binding, resolved from the repo.
 *
 * Resolve-then-dynamic-import rather than a bare `import`, because the specifier has to be a
 * real path for Node to find it from outside the package.
*/
export async function duckdb() {
    const entry = fromDataMate.resolve('@duckdb/node-api');
    return import(pathToFileURL(entry).href);
}

/** A fresh in-memory instance and connection, plus the teardown that actually releases them. */
export async function open(path = ':memory:') {
    const { DuckDBInstance } = await duckdb();
    const instance = await DuckDBInstance.create(path);
    const connection = await instance.connect();

    return {
        instance,
        connection,
        /**
         * `closeSync()` on the INSTANCE matters: a process that registered a scalar function
         * will not exit without it. See docs/HANDOFF.md.
        */
        close() {
            connection.disconnectSync();
            instance.closeSync();
        },
    };
}

/**
 * The real `DuckFrame`, from the built dist.
 *
 * Imported by PATH, not by package name: `duck-frame` is deliberately not re-exported from
 * data-mate's `src/index.ts`, so `import { DuckFrame } from '@terascope/data-mate'` gives
 * `undefined` rather than an error - which silently turns a benchmark into a crash later.
*/
export async function duckFrame() {
    const dist = new URL('../../../dist/src/duck-frame/DuckFrame.js', import.meta.url);
    if (!existsSync(dist)) {
        throw new Error(
            'packages/data-mate/dist is missing - run `npx tsc -b` in packages/data-mate first'
        );
    }

    const loaded = await import(dist.href);
    if (typeof loaded.DuckFrame !== 'function') {
        throw new Error('dist has no DuckFrame export - the build is stale, run `npx tsc -b`');
    }
    return loaded;
}

/**
 * data-mate's own build, for scripts that compare against `DataFrame` or the real frame.
 *
 * **The stale-dist trap:** data-mate resolves to its built `dist`, so anything changed in `src`
 * is invisible here until `tsc -b` runs. Worse, `dist` keeps DELETED modules around - which is
 * how ten scripts in `archive/ingest-probe/` still import `coercion-sql.js` and friends whose
 * source no longer exists. If a script here disagrees with the source you are reading, suspect
 * this first.
*/
export async function dataMate() {
    const dist = new URL('../../../dist/src/index.js', import.meta.url);
    if (!existsSync(dist)) {
        throw new Error(
            'packages/data-mate/dist is missing - run `npx tsc -b` in packages/data-mate first'
        );
    }
    return import(dist.href);
}

// ---------------------------------------------------------------- measuring

/** Milliseconds since a `process.hrtime.bigint()` mark. */
export function since(mark) {
    return Number(process.hrtime.bigint() - mark) / 1e6;
}

/** Times an async block, returning `[result, ms]`. */
export async function timed(fn) {
    const mark = process.hrtime.bigint();
    const result = await fn();
    return [result, since(mark)];
}

export function rate(rows, ms) {
    return `${Math.round(rows / (ms / 1000)).toLocaleString()} rows/s`;
}

/** One result line, aligned so a run reads as a table without any rendering. */
export function report(label, ms, rows) {
    const timing = `${ms.toFixed(0)} ms`.padStart(9);
    const suffix = rows == null ? '' : `  ${rate(rows, ms).padStart(14)}`;
    // eslint-disable-next-line no-console
    console.log(`  ${label.padEnd(46)}${timing}${suffix}`);
}

export function heading(text) {
    // eslint-disable-next-line no-console
    console.log(`\n=== ${text}`);
}

export function note(text) {
    // eslint-disable-next-line no-console
    console.log(`  ${text}`);
}

// ---------------------------------------------------------------- envelope

/**
 * Benchmark envelope, from the DEPLOYMENT ENVELOPE section of docs/HANDOFF.md.
 *
 * **Read this before trusting any number.** Joins and queries run in the forked
 * `spaces_qpl_worker` at **~64 GB**, not in the api-server. Three sessions in a row produced
 * invalid join numbers by inheriting `MEM=6GB THREADS=2` from an old probe - that describes no
 * tier that runs a join. So the default here is the WORKER, and anything smaller has to be
 * asked for explicitly and reported as such.
 *
 * `memory_limit` must stay BELOW the container's cap, or DuckDB never spills and the kernel
 * kills the process - the origin of the bogus "OOMs and does not spill" finding.
*/
export const WORKER = { memoryLimit: '48GiB', threads: null };
export const API_SERVER = { memoryLimit: '4GiB', threads: 2 };

/**
 * Applies an envelope and prints what was applied, so no run is ever ambiguous about the
 * conditions it measured under. Use binary units: DuckDB reads `'2GB'` as 2x10^9 bytes.
*/
export async function applyEnvelope(connection, envelope = WORKER, label = 'worker') {
    if (envelope.memoryLimit) {
        await connection.run(`SET memory_limit = '${envelope.memoryLimit}'`);
    }
    if (envelope.threads) {
        await connection.run(`SET threads = ${envelope.threads}`);
    }

    const result = await connection.run(
        "SELECT current_setting('memory_limit') AS mem, current_setting('threads') AS threads"
    );
    const [{ mem, threads }] = await result.getRowObjectsJson();
    // eslint-disable-next-line no-console
    console.log(`envelope: ${label} - memory_limit=${mem}, threads=${threads}\n`);
}
