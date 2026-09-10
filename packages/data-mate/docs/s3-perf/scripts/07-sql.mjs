/**
 * STEP 7 — ANY SQL, with the settings as flags.
 *
 * This is `02-battery.mjs` with two things changed: the query comes from you
 * instead of `lib/queries.mjs`, and every engine setting has a flag instead of
 * being read from the env file. Everything else — the profiled cold run, the
 * median of repeats, the result JSON in `RESULTS_DIR` — is the same machinery,
 * so a number from here is comparable with a number from the battery.
 *
 *   ./run.sh sql --sql "SELECT count(*) FROM {{T}}"
 *   ./run.sh sql --file /app/config/my-query.sql --rows json --print 5
 *   ./run.sh sql --sql "..." --threads 4 --memory-limit 512MiB --explain
 *   ./run.sh sql --sql "..." --sweep threads=2,4,8
 *   echo "SELECT * FROM {{T}} LIMIT 10" | ./run.sh sql -
 *
 * **`{{T}}` is the frame.** It expands to the frame's FROM expression, so the
 * same query text runs against any fixture scale by changing `FIXTURE`, and you
 * never paste an s3:// URL into a query.
 *
 * **It runs through DuckFrame, not the raw binding.** The other steps query the
 * binding directly; this one goes through `frame.query()`, because that is what
 * spaces will call. Two consequences worth knowing:
 *
 *   - The frame owns its OWN database, so the settings are pushed in with
 *     `configureDuckDatabase()` and the credentials through `frame.query()`.
 *     Nothing is inherited from the environment. See `05-duckframe.mjs`.
 *   - **There is no streaming JS mode**, because `frame.rows()` hard-codes
 *     `SELECT * FROM <the frame>` and DuckFrame has no "frame from arbitrary
 *     SQL" factory. `--rows json` is the JS path that IS reachable. Adding a
 *     `queryStream(sql)` to DuckFrame would unlock it — a one-method change,
 *     deliberately not made from a harness.
 *
 * **One statement only.** Use the flags for `SET`s rather than prefixing them to
 * the query: a second statement cannot be wrapped for `--rows none`, and a `SET`
 * that ran inside the timed region would be measuring itself.
 */
/* eslint-disable no-console -- this is a CLI; printing is the entire point. */
import { parseArgs } from 'node:util';
import { readFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// ---------------------------------------------------------------- the flags -

/**
 * Every flag maps to the env var the harness already reads.
 *
 * **This is the whole configuration mechanism, and deliberately the only one.**
 * `lib/env.mjs` already resolves real env over the env file, so writing a flag
 * into `process.env` BEFORE importing it makes flags the highest-precedence
 * layer of the existing chain rather than a second, parallel one. It is also
 * what makes `--sweep` work: a swept value is just an env var in a child.
 */
const ENV_FOR = {
    repeats: 'REPEATS',
    'memory-limit': 'MEMORY_LIMIT',
    threads: 'THREADS',
    'temp-dir': 'TEMP_DIRECTORY',
    'max-temp-size': 'MAX_TEMP_DIRECTORY_SIZE',
    'external-file-cache': 'EXTERNAL_FILE_CACHE',
    'http-metadata-cache': 'HTTP_METADATA_CACHE',
    'parquet-metadata-cache': 'PARQUET_METADATA_CACHE',
    'connection-cache': 'HTTPFS_CONNECTION_CACHING',
};

const OPTIONS = {
    sql: { type: 'string' },
    file: { type: 'string' },
    rows: { type: 'string', default: 'none' },
    explain: { type: 'boolean', default: false },
    print: { type: 'string' },
    tag: { type: 'string' },
    sweep: { type: 'string', multiple: true, default: [] },
    help: { type: 'boolean', short: 'h', default: false },
    ...Object.fromEntries(Object.keys(ENV_FOR).map((k) => [k, { type: 'string' }])),
};

const ROWS_MODES = {
    none: 'Run it fully, return nothing to JS. Wrapped in CREATE TABLE AS, so the'
        + ' engine does all the work and no row crosses into JavaScript.',
    json: 'Every row into JS as JSON-rendered arrays, via frame.query(). This is'
        + ' ROW cost on top of query cost — at 100M rows the two differ by two'
        + ' orders of magnitude.',
};

function usage() {
    console.log(`
Usage: ./run.sh sql (--sql "<query>" | --file <path> | -) [flags]

  {{T}} in the query expands to the frame's FROM expression.

  --sql "<query>"        the query, inline
  --file <path>          the query, from a file
  -                      the query, from stdin
  --rows none|json       what reaches JavaScript (default: none)
  --print N              print the first N result rows, as a sanity check
  --explain              print the per-operator timing tree
  --tag <name>           name the result JSON (default: derived from the query)

Engine settings — each overrides the env file for this run only:

  --repeats N            timed runs, after a cold run and a warmup
  --memory-limit 512MiB  use BINARY units; DuckDB reads 2GB as 2x10^9
  --threads N            the documented mitigation for the wide top-N cliff
  --temp-dir <path>      spill directory; without one an over-limit query FAILS
  --max-temp-size 20GiB  cap on the spill (DuckDB's default is 90% of the disk)
  --external-file-cache  true|false — largest avoidable term in peak RSS
  --http-metadata-cache  true|false
  --parquet-metadata-cache true|false
  --connection-cache     true|false

  --sweep <flag>=<v1,v2> run the same query once per value, each in a FRESH
                         process. Repeatable; axes run one at a time, never
                         crossed. e.g. --sweep threads=2,4,8

Rows modes:
${Object.entries(ROWS_MODES).map(([k, v]) => `  ${k.padEnd(6)} ${v}`)
    .join('\n')}
`);
}

const { values, positionals } = parseArgs({ options: OPTIONS, allowPositionals: true });

if (values.help) {
    usage();
    process.exit(0);
}

/**
 * The query text, from whichever source was given.
 *
 * A trailing semicolon is stripped: `--rows none` wraps the query in
 * `CREATE TABLE AS (...)`, and a semicolon inside those parentheses is a syntax
 * error that would read as a fault in the query rather than in the wrapping.
 */
function resolveSql() {
    const fromPositional = positionals.find((p) => p !== '-');
    let text;

    // A sweep child is handed the query through the environment: argv does not
    // round-trip newlines and quotes reliably, and the query is arbitrary text.
    if (process.env.S3_PERF_SWEEP_SQL) text = process.env.S3_PERF_SWEEP_SQL;
    else if (values.sql) text = values.sql;
    else if (values.file) text = readFileSync(values.file, 'utf8');
    else if (positionals.includes('-')) text = readFileSync(0, 'utf8');
    else if (fromPositional) text = fromPositional;
    else if (!process.stdin.isTTY) text = readFileSync(0, 'utf8');

    const trimmed = String(text ?? '').trim()
        .replace(/;+\s*$/, '');
    if (!trimmed) return null;
    return trimmed;
}

const sqlText = resolveSql();

if (!sqlText) {
    usage();
    console.error('No query given. Use --sql, --file, or pipe one in and pass -.');
    process.exit(1);
}
if (!Object.hasOwn(ROWS_MODES, values.rows)) {
    console.error(`--rows must be one of ${Object.keys(ROWS_MODES).join(', ')}, got "${values.rows}"`);
    process.exit(1);
}

/**
 * Flags into `process.env`, before `lib/env.mjs` is imported.
 *
 * `config` there is a snapshot taken at import time, so this has to happen
 * first — which is why the imports below are dynamic. Mutating `process.env` is
 * the process boundary, not shared state: nothing has read it yet.
 */
for (const [flag, envVar] of Object.entries(ENV_FOR)) {
    if (values[flag] !== undefined) process.env[envVar] = values[flag];
}

const { config, s3Glob } = await import('../lib/env.mjs');
const { open, duckFrame, applyEndpointSettings } = await import('../lib/duck.mjs');
const { configFromSchema } = await import('../lib/data-type.mjs');
const {
    heading, note, table, ms, num, bytes, save, explain, measure, time, median,
} = await import('../lib/report.mjs');

// ------------------------------------------------------------ measurement --

const PROFILE_PATH = `/tmp/duck-sql-profile-${process.pid}.json`;
/** Set by readProfile() when it cannot produce stats, so the report can say why. */
let profileFailure = null;
const PROBE_TABLE = '_sql_probe';
const SWEEP_CHILD = 'S3_PERF_SWEEP_VALUE';
const MARKER = '__SQL_RESULT_JSON__';

/**
 * True peak resident memory, from the kernel.
 *
 * `process.memoryUsage().rss` is a POINT sample and understates a run, because
 * peak RSS is a process-lifetime high-water mark — the allocator does not
 * return freed pages to the OS. `VmHWM` is the real high-water mark. Linux
 * only, so it returns null on a Mac rather than pretending.
 */
function peakRssBytes() {
    try {
        const match = readFileSync('/proc/self/status', 'utf8').match(/VmHWM:\s+(\d+)\s+kB/);
        return match ? Number(match[1]) * 1024 : null;
    } catch {
        return null;
    }
}

/**
 * The stats DuckDB's own profiler reports for the last query.
 *
 * The battery pulls exactly one field out of this (`total_bytes_read`) and
 * discards the rest. For a query you wrote, the rest is the interesting part:
 * `system_peak_buffer_memory` and `system_peak_temp_dir_size` are DuckDB's own
 * measurements of the two things every memory question here has had to infer.
 *
 * **`cumulative_rows_scanned` is deliberately NOT reported.** MEASURED: on a
 * 600,000-row corpus it is 2,931,600 for `count(*)`, for one column, for five
 * columns and for a query whose filter rejects 99% of rows — identical in all
 * four. It does not respond to projection or to selectivity, and its ratio to
 * the row count differs per corpus (2.0x on one, 4.9x on another), so it is not
 * a rows-read measurement. An earlier version of this file printed it as "rows
 * scanned" and computed a selectivity from it, which read as a finding about
 * pushdown and was arithmetic on an unrelated counter.
 *
 * The number that IS a pushdown measurement is the scan operator's own output
 * cardinality — see `scanFunnel`.
 */
function readProfile() {
    let profile;
    try {
        profile = JSON.parse(readFileSync(PROFILE_PATH, 'utf8'));
    } catch (err) {
        // A diagnostic, never the measurement — but say WHICH way it failed.
        // "no profile" covers a file that was never written and one that was
        // written and could not be parsed, and those have different causes.
        profileFailure = err.code === 'ENOENT'
            ? `no profile at ${PROFILE_PATH} — the query ran on a connection that was not profiled`
            : `profile at ${PROFILE_PATH} unreadable: ${err.message.split('\n')[0]}`;
        return null;
    }
    return {
        latencyMs: Number(profile.latency ?? 0) * 1000,
        cpuMs: Number(profile.cpu_time ?? 0) * 1000,
        blockedMs: Number(profile.blocked_thread_time ?? 0) * 1000,
        bytesRead: Number(profile.total_bytes_read ?? 0),
        bytesWritten: Number(profile.total_bytes_written ?? 0),
        peakBufferBytes: Number(profile.system_peak_buffer_memory ?? 0),
        peakSpillBytes: Number(profile.system_peak_temp_dir_size ?? 0),
        rowsReturned: Number(profile.rows_returned ?? 0),
        resultSetBytes: Number(profile.result_set_size ?? 0),
        cardinality: Number(profile.cumulative_cardinality ?? 0),
        tree: profile.children ?? [],
    };
}

/**
 * What the scan emitted, and whether the filter reached it.
 *
 * A scan's `operator_cardinality` is rows it PRODUCED, and it does respond to a
 * filter — measured on the same corpus, 600,000 unfiltered against 6,160 for
 * `WHERE score < 10`. That difference is the whole pushdown question: if a query
 * has a WHERE and the scan still emits everything, the filter is being applied
 * above the scan and every row crossed the wire to be thrown away.
 */
function scanFunnel(nodes, found = { rowsOut: 0, filters: [], scans: 0 }) {
    for (const node of nodes) {
        if (/READ_PARQUET|PARQUET_SCAN|TABLE_SCAN|READ_CSV/.test(node.operator_name ?? '')) {
            found.scans += 1;
            found.rowsOut += Number(node.operator_cardinality ?? 0);
            const filters = node.extra_info?.Filters;
            if (filters) found.filters.push(String(filters));
        }
        scanFunnel(node.children ?? [], found);
    }
    return found;
}

/** The per-operator tree, indented. Where the time actually went. */
function printOperatorTree(nodes, depth = 0) {
    for (const node of nodes) {
        const pushed = node.extra_info?.Filters ?? node.extra_info?.Text ?? '';
        note(`${'  '.repeat(depth + 1)}${node.operator_name} `
            + `${(Number(node.operator_timing ?? 0) * 1000).toFixed(2)} ms  `
            + `out ${num(node.operator_cardinality ?? 0)}`
            + `${node.operator_rows_scanned ? `  scanned ${num(node.operator_rows_scanned)}` : ''}`
            + `${pushed ? `  [${String(pushed).slice(0, 60)}]` : ''}`);
        printOperatorTree(node.children ?? [], depth + 1);
    }
}

/**
 * Open the frame, configured and credentialed.
 *
 * Mirrors `05-duckframe.mjs` exactly, and for the reasons documented there: the
 * frame's database is its own, so it gets the engine settings from
 * `configureDuckDatabase` and the S3 credentials through the `frame.query()`
 * escape hatch. Neither is inherited from this process's environment.
 */
async function openFrame({ DuckFrame, configureDuckDatabase }) {
    const glob = s3Glob();

    // The raw binding, used ONLY to read the schema — `fromParquet` is told
    // what the data is, it does not infer it.
    const probe = await open();
    const described = await probe.rows(`DESCRIBE SELECT * FROM read_parquet('${glob}')`);
    probe.close();

    const { config: dataTypeConfig, skipped } = configFromSchema(described);

    await configureDuckDatabase({
        memoryLimit: config.memoryLimit,
        tempDirectory: config.tempDirectory,
        ...(config.maxTempDirectorySize
            ? { maxTempDirectorySize: config.maxTempDirectorySize }
            : {}),
        ...(config.threads ? { threads: Number(config.threads) } : {}),
    });

    const frame = await DuckFrame.fromParquet(dataTypeConfig, glob);

    /*
     * THE SAME settings the harness applies to its own connection, from the same
     * function — not a hand-copied subset.
     *
     * The frame owns a SECOND DuckDB instance that shares nothing with `open()`'s,
     * so it has to be configured separately. The first version of this script
     * copied across only what looked relevant (httpfs, the secret, the CA, the
     * caches) and silently dropped `LOAD aws`, `LOAD parquet`, `LOAD json`, the
     * autoload switches and the HTTP timeout and retry settings. That made this
     * script fail against a configuration `02-battery.mjs` handled fine, which
     * reads as a broken script rather than as a differently-configured database.
     *
     * `applyEndpointSettings` is now the single definition, so the two cannot
     * drift again.
     */
    await applyEndpointSettings((sql) => frame.query(sql));

    return { frame, glob, skipped };
}

/**
 * One execution of the query, in the requested rows mode.
 *
 * `none` wraps in `CREATE OR REPLACE TABLE ... AS`. That is the honest "full
 * execution, nothing transferred" wrapper — note that `SELECT count(*) FROM
 * (<query>)` is NOT, because it lets the optimiser prune columns the query
 * asked for and would time a different plan.
 *
 * The cost of the honesty: a `none` run materialises the result INTO the
 * in-memory database, so a query returning a hundred million rows costs that
 * much memory. For an aggregation — which is most of what gets asked — the
 * result is tiny and this is free.
 */
function execute(frame, sql, mode) {
    if (mode === 'json') return frame.query(sql);
    return frame.query(`CREATE OR REPLACE TABLE ${PROBE_TABLE} AS (${sql})`);
}

// ------------------------------------------------------------------ a run ---

async function runOnce(deps) {
    const { frame, glob, skipped } = await openFrame(deps);
    const T = frame.from;
    const sql = sqlText.replaceAll('{{T}}', T);
    const repeats = Math.max(1, config.repeats);

    heading('THE QUERY');
    note(sql);
    note('');
    if (sqlText.includes('{{T}}')) note(`{{T}} = ${T}`);
    else note('NOTE: the query does not mention {{T}}, so it may not read the corpus at all.');
    for (const s of skipped) note(`schema: SKIPPED ${s.name} (${s.type}) — ${s.reason}`);

    heading('SETTINGS IN FORCE');
    table(
        ['setting', 'value'],
        [
            ['corpus', glob],
            ['rows mode', values.rows],
            ['memory_limit', config.memoryLimit],
            ['threads', config.threads || 'all cores'],
            ['temp_directory', config.tempDirectory],
            ['max_temp_directory_size', config.maxTempDirectorySize || 'DuckDB\'s default (90% of disk)'],
            ['external file cache', String(config.caches.externalFile)],
            ['http metadata cache', String(config.caches.httpMetadata)],
            ['parquet metadata cache', String(config.caches.parquetMetadata)],
            ['connection caching', String(config.caches.connection)],
            ['repeats', String(repeats)],
        ]
    );

    // The COLD run is profiled and reported separately, not folded into the
    // median. The first touch of a remote object pays DNS, TLS and a cold
    // metadata read that do not recur — for an ad-hoc query that number is
    // often the one you care about, so it is kept rather than discarded.
    await frame.query('SET enable_profiling = \'json\'');
    await frame.query(`SET profiling_output = '${PROFILE_PATH}'`);
    /*
     * ARM IT WITH A THROWAWAY QUERY, and this is not superstition.
     *
     * MEASURED: the FIRST query after `SET profiling_output` does not land at
     * the new path. The measured query ran, returned correct timings, and left
     * no profile — so the entire engine table printed "No profile was written"
     * while every other part of the run worked. Inserting any query between the
     * SET and the measured one makes the profile appear, every time.
     *
     * An earlier probe of this mechanism missed it because it happened to read
     * `duckdb_settings()` in between, which armed it by accident.
     *
     * `SELECT 1` is itself profiled and immediately overwritten by the real
     * query's profile, so this costs one trivial statement and nothing else.
     */
    await frame.query('SELECT 1');
    const cold = await time(() => execute(frame, sql, values.rows));
    const stats = readProfile();
    await frame.query('SET enable_profiling = \'no_output\'');

    // Then the timed repeats. `measure` discards its own warmup, so the total
    // number of executions is 1 cold + 1 warmup + repeats.
    const warm = await measure(() => execute(frame, sql, values.rows), repeats);

    const resultRows = values.rows === 'json'
        ? (Array.isArray(cold.value) ? cold.value.length : 0)
        : Number((await frame.query(`SELECT count(*) FROM ${PROBE_TABLE}`))[0][0]);

    /*
     * FIRST-TOUCH OVERHEAD IS THE HEADLINE ON A REMOTE CORPUS, and hiding it
     * inside "cold" made it look like query cost.
     *
     * MEASURED on this corpus: a predicate matching ZERO rows still took
     * 10,209 ms with 0 ms of CPU and read 13.7 MB. That is the Parquet FOOTER —
     * 5,579 row groups x 25 columns of thrift metadata — fetched before any
     * value is read, and it is identical for every query against the file. The
     * cold number is that plus the query; the difference is the query.
     *
     * It is also where the variance lives: the same query's cold run measured
     * 72,306 / 4,477 / 1,509 ms while its warm median never moved off 288 ms.
     */
    heading('TIMING');
    table(
        ['run', 'ms'],
        [
            ['cold (first touch)', ms(cold.millis)],
            [`warm median of ${repeats}`, ms(warm.median)],
            ['warm min', ms(warm.min)],
            ['warm max', ms(warm.max)],
            ['first-touch overhead', ms(Math.max(0, cold.millis - warm.median))],
        ]
    );
    // Every run, not just the summary: a median hides an outlier, and on a
    // remote corpus the outliers are the thing worth seeing.
    note(`every warm run: ${warm.timings.map((t) => `${t.toFixed(1)}`).join(', ')} ms`);
    if (cold.millis > warm.median * 5) {
        note('');
        note(`cold is ${(cold.millis / warm.median).toFixed(0)}x the warm median. On a remote`);
        note('corpus that is the footer fetch and TLS setup, NOT query cost — it is the same');
        note('for a query matching nothing. Treat cold as one noisy sample; re-run before');
        note('quoting it.');
    }
    if (warm.max > warm.min * 3) {
        note('');
        note('The spread is more than 3x. That is not a measurement — something else was');
        note('moving: a cold cache, a busy Ceph node, another tenant. Re-run it.');
    }

    const funnel = stats ? scanFunnel(stats.tree) : { rowsOut: 0, filters: [], scans: 0 };

    heading('WHAT THE ENGINE DID (cold run, from DuckDB\'s profiler)');
    if (!stats) {
        note(`No profile was written. Timing above is still valid.\n     ${profileFailure ?? ''}`);
    } else {
        table(
            ['metric', 'value', 'what it tells you'],
            [
                ['latency', ms(stats.latencyMs), 'engine time, excluding JS'],
                ['cpu time', ms(stats.cpuMs), 'summed across threads'],
                /*
                 * `blocked_thread_time` is reported ONLY when non-zero. MEASURED:
                 * it was 0 across 15 runs including a 3.9 GB, 212-second query,
                 * so printing it unconditionally under the label "stalled — this
                 * is the network" asserted a measurement that was never made.
                 */
                ...(stats.blockedMs > 0
                    ? [['blocked thread time', ms(stats.blockedMs), 'threads stalled on the pipeline']]
                    : []),
                ...(stats.latencyMs > stats.cpuMs
                    ? [['wall time not on CPU',
                        ms(stats.latencyMs - stats.cpuMs),
                        'I/O wait — the footer fetch and the network']]
                    : []),
                ['bytes read', bytes(stats.bytesRead), 'moved over the wire on the cold run'],
                ['bytes written', bytes(stats.bytesWritten), 'spill and table writes'],
                ['peak buffer memory', bytes(stats.peakBufferBytes), 'against memory_limit'],
                ['peak spill', bytes(stats.peakSpillBytes), '0 means it never went to disk'],
                ['rows out of the scan', num(funnel.rowsOut), 'what the scan handed upward'],
                ['rows returned', num(resultRows), 'the answer'],
                ...(values.rows === 'json'
                    ? [['result size', bytes(stats.resultSetBytes), 'converted into JS']]
                    : []),
            ]
        );
        if (funnel.scans > 0 && funnel.rowsOut > 0) {
            note('');
            note(`the scan emitted ${num(funnel.rowsOut)} rows and the query returned `
                + `${num(resultRows)}.`);
            if (funnel.filters.length) {
                note(`filters pushed INTO the scan: ${funnel.filters.join('; ').slice(0, 120)}`);
            } else if (/\bwhere\b/i.test(sql)) {
                // The measurable, expensive case: rows crossed the wire to be discarded.
                note('This query has a WHERE, but NO filter reached the scan — every row was');
                note('read and then discarded above it. Check --explain: a filter on an');
                note('expression, or on a column DuckDB cannot use statistics for, does this.');
            }
        }
        if (stats.peakSpillBytes > 0) {
            note('');
            note(`This query SPILLED ${bytes(stats.peakSpillBytes)} to ${config.tempDirectory}.`);
            note('It fit only because a temp directory exists. Raising --memory-limit would');
            note('avoid the spill and raise peak RSS; the two trade against each other.');
        }
    }

    if (values.explain && stats?.tree?.length) {
        heading('WHERE THE TIME WENT');
        printOperatorTree(stats.tree);
    }

    if (values.print) {
        const n = Math.max(1, Number(values.print));
        heading(`FIRST ${n} ROWS`);
        const sample = values.rows === 'json'
            ? cold.value.slice(0, n)
            : await frame.query(`SELECT * FROM ${PROBE_TABLE} LIMIT ${n}`);
        for (const row of sample) note(JSON.stringify(row));
        if (!sample.length) note('(no rows — the query returned nothing, and was timed doing so)');
    }

    const peak = peakRssBytes();
    if (peak !== null) {
        heading('MEMORY');
        note(`peak process RSS: ${bytes(peak)} (VmHWM — a lifetime high-water mark)`);
        note(`against memory_limit ${config.memoryLimit}. memory_limit bounds DuckDB's buffer`);
        note('pool, NOT the process: a full run lands near 3 GB plus ~2.1x the limit.');
    }

    if (values.rows === 'none') await frame.query(`DROP TABLE IF EXISTS ${PROBE_TABLE}`);

    return {
        sql,
        table: T,
        rowsMode: values.rows,
        coldMs: cold.millis,
        medianMs: warm.median,
        minMs: warm.min,
        maxMs: warm.max,
        timings: warm.timings,
        resultRows,
        scanRowsOut: funnel.rowsOut,
        scanFilters: funnel.filters,
        stats: stats ? { ...stats, tree: undefined } : null,
        peakRssBytes: peak,
        settings: {
            memoryLimit: config.memoryLimit,
            threads: config.threads || null,
            tempDirectory: config.tempDirectory,
            maxTempDirectorySize: config.maxTempDirectorySize || null,
            caches: config.caches,
            repeats,
        },
    };
}

// ------------------------------------------------------------- the sweeps ---

/**
 * Run the query once per swept value, each in a FRESH CHILD PROCESS.
 *
 * A child, not a loop, for the reason `03-caches.mjs` found the hard way: peak
 * RSS is a process-lifetime high-water mark, so several runs in one process
 * report the maximum of all of them and eventually get OOM-killed. A process
 * boundary resets that floor, and it also guarantees the caches start cold.
 *
 * Axes are run one at a time and never crossed. Crossing two axes multiplies
 * the runs, and nothing here has ever needed a surface — it has needed one
 * variable moved at a time.
 */
function sweep(axes) {
    const results = [];

    for (const axis of axes) {
        const [flag, list] = axis.split('=');
        const envVar = ENV_FOR[flag];
        if (!envVar) {
            console.error(`--sweep ${flag}=... is not a settable flag. One of: ${Object.keys(ENV_FOR).join(', ')}`);
            process.exit(1);
        }
        const seriesValues = String(list ?? '').split(',')
            .map((v) => v.trim())
            .filter(Boolean);
        if (!seriesValues.length) {
            console.error(`--sweep ${flag}= needs at least one value, e.g. --sweep ${flag}=4,8`);
            process.exit(1);
        }

        heading(`SWEEP — ${flag} across ${seriesValues.join(', ')}`);
        const series = [];

        for (const value of seriesValues) {
            note(`running ${flag}=${value} in a fresh process…`);
            // Pass the query through the environment: it may contain quotes,
            // newlines and shell metacharacters, none of which survive argv
            // round-tripping reliably.
            const childEnv = {
                ...process.env,
                [envVar]: value,
                [SWEEP_CHILD]: `${flag}=${value}`,
                S3_PERF_SWEEP_SQL: sqlText,
            };
            const argv = [new URL(import.meta.url).pathname, '--rows', values.rows];
            if (values.explain) argv.push('--explain');

            try {
                const out = execFileSync(process.execPath, argv, {
                    env: childEnv, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'],
                });
                const at = out.lastIndexOf(MARKER);
                if (at === -1) throw new Error('the child produced no result');
                series.push({ value, ...JSON.parse(out.slice(at + MARKER.length)) });
            } catch (err) {
                const message = String(err.message).split('\n')[0];
                note(`  ${flag}=${value} FAILED: ${message}`);
                series.push({ value, failed: message });
            }
        }

        table(
            [flag, 'cold', 'median', 'bytes read', 'peak buffer', 'spill', 'peak RSS'],
            series.map((r) => (r.failed
                ? [r.value, 'FAILED', '', '', '', '', '']
                : [
                    r.value,
                    ms(r.coldMs),
                    ms(r.medianMs),
                    bytes(r.stats?.bytesRead),
                    bytes(r.stats?.peakBufferBytes),
                    bytes(r.stats?.peakSpillBytes),
                    r.peakRssBytes === null ? 'n/a' : bytes(r.peakRssBytes),
                ]))
        );

        const ok = series.filter((r) => !r.failed);
        if (ok.length > 1) {
            const fastest = ok.reduce((a, b) => (b.medianMs < a.medianMs ? b : a));
            const slowest = ok.reduce((a, b) => (b.medianMs > a.medianMs ? b : a));
            note('');
            note(`fastest ${flag}=${fastest.value} at ${ms(fastest.medianMs)}, `
                + `slowest ${flag}=${slowest.value} at ${ms(slowest.medianMs)} — `
                + `${(slowest.medianMs / fastest.medianMs).toFixed(2)}x`);
            const spread = median(ok.map((r) => r.medianMs));
            if (slowest.medianMs / fastest.medianMs < 1.1) {
                note(`This axis is FLAT (median ${ms(spread)}). Do not read a ranking into it —`);
                note('the differences are inside the noise of a single run.');
            }
        }
        results.push({ axis: flag, series });
    }

    return results;
}

// ----------------------------------------------------------------- dispatch -

try {
    const { DuckFrame, configureDuckDatabase, closeDuckDatabase } = await duckFrame();

    if (values.sweep.length && !process.env[SWEEP_CHILD]) {
        const results = sweep(values.sweep);
        save(values.tag ? `sql-${values.tag}` : 'sql-sweep', { sql: sqlText, sweeps: results });
        await closeDuckDatabase();
    } else {
        const payload = await runOnce({ DuckFrame, configureDuckDatabase });
        await closeDuckDatabase();

        if (process.env[SWEEP_CHILD]) {
            // A sweep child reports upward rather than saving: the parent owns
            // the result file, so one sweep is one artefact.
            process.stdout.write(MARKER + JSON.stringify(payload));
        } else {
            const tag = values.tag ?? sqlText.replace(/\W+/g, '-').slice(0, 40)
                .replace(/^-|-$/g, '')
                .toLowerCase();
            save(`sql-${tag}`, payload);
            heading('NEXT');
            note('Change one setting and compare, or sweep it in one command:');
            note('  ./run.sh sql --sql "<same query>" --sweep threads=2,4,8');
            note('  ./run.sh sql --sql "<same query>" --rows json   # add the JS row cost');
        }
    }
} catch (err) {
    explain(err);
    process.exit(1);
} finally {
    try {
        unlinkSync(PROFILE_PATH);
    } catch { /* never written */ }
}
