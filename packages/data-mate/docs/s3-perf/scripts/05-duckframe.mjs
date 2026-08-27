/**
 * STEP 6 — the DuckFrame API itself, against S3.
 *
 * Every other script here is raw SQL through the DuckDB binding. This one
 * exercises data-mate's real `DuckFrame` from its built `dist`, because that is
 * what spaces will actually call, and "DuckDB is fast against S3" does not by
 * itself establish that the frame is.
 *
 * **Two things about the frame that this script had to work around, and that
 * the worker will hit too:**
 *
 * 1. `fromParquet(config, path)` takes a `DataTypeConfig` FIRST. The frame is
 *    told what the data is; it does not infer it. Correct for the real flow —
 *    the worker knows the config from the search query — but a harness pointed
 *    at unseen objects must reconstruct one. See `lib/data-type.mjs`.
 *
 * 2. **The frame owns its OWN DuckDB database** via an internal `getContext()`,
 *    so it never sees this harness's S3 credentials, and `configureDuckDatabase`
 *    exposes only database/tempDirectory/memoryLimit/threads — no S3 settings.
 *    Credentials therefore go in through `frame.query()`, the escape hatch.
 *    `CREATE SECRET` is instance-scoped, so one call covers every connection the
 *    frame later opens (`rows()` and `append()` each take their own).
 *
 * **What is deliberately NOT tested: ingest.** In the real flow
 * `qpl-search-api` produces Parquet and `qpl-worker` consumes it — `fromRecords`
 * is never called on the worker. Pre-uploaded objects are exactly the worker's
 * view, so the frame is created FROM PARQUET and queried. No records are built.
 */
import { s3Glob, config } from '../lib/env.mjs';
import { open, duckFrame } from '../lib/duck.mjs';
import { configFromSchema } from '../lib/data-type.mjs';
import {
    heading, note, table, ms, save, explain, measure,
} from '../lib/report.mjs';

const glob = s3Glob();

try {
    const { DuckFrame, closeDuckDatabase } = await duckFrame();

    heading('RECONSTRUCTING A DataTypeConfig FROM THE CORPUS');
    const probe = await open();
    const described = await probe.rows(`DESCRIBE SELECT * FROM read_parquet('${glob}')`);
    probe.close();

    const { config: dataTypeConfig, mapped, skipped } = configFromSchema(described);
    table(
        ['column', 'duckdb type', 'FieldType'],
        mapped.map((m) => [m.name, m.duckType, m.fieldType])
    );
    if (skipped.length) {
        note('');
        for (const s of skipped) note(`SKIPPED ${s.name} (${s.type}) — ${s.reason}`);
    }
    note('');
    note('This mapping is APPROXIMATE — toDuckDB() is not injective, so an IP column');
    note('comes back as Keyword. Fine for timing shapes, wrong for asserting semantics.');

    const results = [];
    const record = async (label, fn, explanation) => {
        try {
            const m = await measure(fn, Math.max(1, Math.min(config.repeats, 3)));
            results.push({ label, median: m.median, note: explanation });
            note(`${label.padEnd(48)} ${ms(m.median)}`);
        } catch (err) {
            const message = String(err.message).split('\n')[0];
            results.push({ label, failed: message, note: explanation });
            note(`${label.padEnd(48)} FAILED: ${message}`);
        }
    };

    heading('CREATING THE FRAME AND GIVING ITS DATABASE THE CREDENTIALS');

    let frame = await DuckFrame.fromParquet(dataTypeConfig, glob);
    note('fromParquet returned — note that NO S3 access has happened yet.');
    note('The frame is a relation: it holds SQL, and reads nothing until asked.');

    /*
     * Now the credentials, through the escape hatch. This must happen before
     * the first read. CREATE SECRET is instance-scoped rather than
     * connection-scoped, so it covers the separate connections rows() opens.
     */
    await frame.query('LOAD httpfs');
    await frame.query(`CREATE OR REPLACE SECRET s3_perf (
        TYPE s3,
        KEY_ID '${config.accessKeyId.replace(/'/g, '\'\'')}',
        SECRET '${config.secretAccessKey.replace(/'/g, '\'\'')}',
        REGION '${config.region}',
        ENDPOINT '${config.endpoint}',
        URL_STYLE '${config.urlStyle}',
        USE_SSL ${config.insecureDiagnostic ? false : config.useSsl}
    )`);
    if (config.caCertFile) await frame.query(`SET ca_cert_file = '${config.caCertFile}'`);
    note('credentials applied to the frame\'s own database via frame.query()');

    heading('FRAME OPERATIONS OVER S3 PARQUET');
    note(`Each is the median of up to ${Math.min(config.repeats, 3)} runs after a warmup.`);
    note('');

    await record('fromParquet(config, glob) — build the frame', async () => {
        await DuckFrame.fromParquet(dataTypeConfig, glob);
    }, 'Builds a relation. Should be near-instant: it reads nothing.');

    await record('size() — row count', async () => {
        await frame.size();
    }, 'The first real S3 access. Answered from Parquet footers.');

    const firstColumn = mapped[0]?.name;
    const q = (name) => `"${String(name).replace(/"/g, '""')}"`;

    if (firstColumn) {
        await record(`select([${firstColumn}]) + size()`, async () => {
            const projected = await frame.select([q(firstColumn)]);
            await projected.size();
        }, 'Projection composes a relation; nothing moves until it is consumed.');
    }

    /*
     * `rows()` returns an ASYNC ITERATOR, not a promise of an array — it streams
     * a DuckDB chunk at a time so a large result never lands in JS at once.
     * `await frame.rows()` therefore returns the iterator having read NOTHING,
     * and times at 0.0 ms. It has to be drained to measure anything.
     */
    const drain = async (iterator) => {
        let count = 0;
        for await (const _row of iterator) count++;
        return count;
    };

    await record('limit(100) + rows() — 100 rows into JS', async () => {
        // limit() is SYNCHRONOUS and returns a new frame; only rows() does I/O.
        const limited = frame.limit(100);
        return drain(limited.rows());
    }, 'The output path, fully drained. rows() streams by chunk and takes its own connection.');

    if (firstColumn) {
        await record('orderBy + limit(100) + rows()', async () => {
            /*
             * orderBy takes an ARRAY, and a bare string supplies the EXPRESSION
             * ONLY — direction goes in the object form. That is deliberate:
             * the frame always emits direction and null placement explicitly
             * (nulls first ascending, last descending, which is DataFrame's
             * rule and not DuckDB's), so appending to a caller's
             * `'id DESC'` would produce `id DESC ASC` — a loud parser error
             * rather than a sort that silently disagrees.
             */
            const sorted = frame.orderBy([{ expression: q(firstColumn), direction: 'desc' }]);
            return drain(sorted.limit(100).rows());
        }, 'Top-N through the frame, drained. NOTE: a tie-heavy sort is not '
        + 'deterministic and paging over one loses rows — append a unique tiebreaker.');
    }

    await record('rows() — drain the WHOLE frame', async () => {
        return drain(frame.rows());
    }, 'Streams every row into JS. The honest cost of the output path at this scale.');

    await record('distinct() + size()', async () => {
        const deduped = await frame.distinct();
        await deduped.size();
    }, 'Full scan and hash. One of the more expensive frame operations.');

    heading('SUMMARY');
    table(
        ['operation', 'median'],
        results.map((r) => [r.label, r.failed ? `FAILED: ${r.failed}` : ms(r.median)])
    );

    heading('WHAT THIS ESTABLISHES');
    for (const r of results) note(`${r.label}\n     ${r.note}`);
    note('');
    note('If frame operations are much slower than the equivalent raw SQL in');
    note('./run.sh battery, the overhead is in the frame rather than in DuckDB or');
    note('the network. Compare battery.json against duckframe.json to tell them apart.');

    save('duckframe', {
        glob,
        dataTypeConfig,
        mapped,
        skipped,
        results,
    });

    await closeDuckDatabase?.();

    heading('NEXT');
    note('./run.sh memory   — the memory-limit sweep and the wide top-N cliff');
} catch (err) {
    explain(err);
    process.exit(1);
}
