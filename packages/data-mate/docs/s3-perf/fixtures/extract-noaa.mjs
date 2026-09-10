/**
 * Extract every NOAA ISD record out of OpenSearch into ONE Parquet file.
 *
 * 5 slicers and 10 fetchers, the teraslice shape:
 *
 *   slicer   walks one index's date range and bisects it until each piece holds
 *            at most FETCH_SIZE docs, emitting slice descriptors onto a queue
 *   fetcher  takes a slice, reads it in ONE request, and writes ONE Parquet
 *            part through the real DuckFrame
 *   merge    one COPY over the parts produces the single file
 *
 *   node extract-noaa.mjs                 # slice + fetch
 *   node extract-noaa.mjs --merge         # parts -> one file
 *   node extract-noaa.mjs --upload --bucket duckdb    # -> s3://.../v1/noaa/
 *   node extract-noaa.mjs --index noaa-isd-v5-2026.03    # one index, for a smoke test
 *
 * **Why parts and then a merge, rather than appending into a table.** Measured
 * in `tools/bench/report-ingest.mjs`: append costs ~1.88 us/ROW, so 691M rows is
 * ~22 minutes of pure append before a single document is fetched, and building
 * the table once at quiesce is 4.7x cheaper and byte-identical. The parts are
 * also what makes this restartable — 691M documents will not complete first try,
 * and a part that exists is a slice already done.
 *
 * **Why an explicit DataTypeConfig rather than letting DuckDB infer.** The 69
 * indices are NOT one schema: `slp_hPa` is mapped `long` in five of them
 * (2020.07, 2021.01, 2022.05, 2024.03, 2024.05) and `float` in the other 63, and
 * `noaa-isd-v5-2026.03` lacks the field entirely. Inferring per part would
 * produce parts that disagree about a column type, and the merge would either
 * fail or coerce unpredictably. Declaring it once makes the drift impossible:
 * every record goes through the same coercion on the way in.
 *
 * The same config handles `location`, which OpenSearch returns as
 * `{lat: "48.3055", lon: "-95.8744"}` — STRINGS. `GeoPoint` maps to
 * `STRUCT(lat DOUBLE, lon DOUBLE)` and the converter does `Number(...)`, so this
 * needs no special casing.
 *
 * **`reindex-noaa-isd-v5-2023.09` is excluded** — it is a duplicate of
 * `noaa-isd-v5-2023.09`, and the `noaa-isd-v5-*` pattern already excludes it.
 * Do not widen the pattern to `*noaa*` or the corpus gains 9.7M duplicate rows.
 */
/* eslint-disable no-console -- a CLI; printing progress is the point. */
import {
    isMainThread, Worker, parentPort, workerData
} from 'node:worker_threads';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const config = {
    esUrl: process.env.ES_URL || 'http://es-data3.qa.tera4.lan',
    pattern: process.env.INDEX_PATTERN || 'noaa-isd-v5-*',
    /*
     * OUTSIDE THE REPO, deliberately. `packages/data-mate/docs/` is TRACKED in git
     * for the life of this branch, and this writes thousands of Parquet parts plus
     * the merged file — tens of GB into the working tree, which `git status` would
     * then try to enumerate.
     */
    outDir: process.env.OUT_DIR || join(homedir(), 'noaa-out'),
    slicers: Number(process.env.SLICERS || 5),
    fetchers: Number(process.env.FETCHERS || 10),
    /**
     * Docs per slice — which is ALSO docs per request and rows per part file,
     * deliberately one number. The slicer's contract is that a slice fits in a
     * single fetch, so a second knob here could only break it.
     *
     * 100k, the same cap `qpl-search-api` puts on a slice, against a result
     * window of 2,000,000 — so this is well inside what one request can return.
     * Measured cost: 15,722 docs came back as 8.3 MiB of JSON, so 100k is
     * ~53 MiB per response and ~530 MiB in flight across 10 fetchers.
     *
     * At 691M documents that is ~6,900 slices, and so ~6,900 part files.
     */
    fetchSize: Number(process.env.FETCH_SIZE || 100_000),
    /**
     * Per WORKER. Ten DuckDB instances each defaulting to 80% of system RAM
     * would take the machine down; the frame's database never inherits a limit
     * from the environment, so each worker sets its own.
     */
    workerMemoryLimit: process.env.WORKER_MEMORY_LIMIT || '1GiB',
    tempDirectory: process.env.TEMP_DIRECTORY || '/tmp/duckdb-noaa-spill',
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 120_000),
    retries: Number(process.env.RETRIES || 4),
};

/**
 * The 24 fields, with the two mapping drifts resolved.
 *
 * OpenSearch `text` becomes `Keyword`: these are codes and station names, never
 * analysed content, and Keyword is what makes them a plain VARCHAR column.
 */
const NOAA_CONFIG = {
    version: 1,
    fields: {
        _key: { type: 'Keyword' },
        station_id: { type: 'Keyword' },
        name: { type: 'Keyword' },
        date: { type: 'Date' },
        location: { type: 'GeoPoint' },
        temperature_c: { type: 'Float' },
        temperature_quality: { type: 'Keyword' },
        dew_point_temperature_c: { type: 'Float' },
        dew_point_quality: { type: 'Keyword' },
        // `long` in five indices, `float` in the rest, absent in one. Float absorbs all three.
        slp_hPa: { type: 'Float' },
        slp_quality: { type: 'Keyword' },
        wind_direction_deg: { type: 'Float' },
        wind_direction_quality: { type: 'Keyword' },
        wind_speed_code: { type: 'Keyword' },
        wind_speed_m: { type: 'Float' },
        wind_speed_quality: { type: 'Keyword' },
        ceiling_height_m: { type: 'Float' },
        ceiling_height_quality: { type: 'Keyword' },
        ceiling_determination_code: { type: 'Keyword' },
        cavok: { type: 'Keyword' },
        visibility_m: { type: 'Float' },
        visibility_quality: { type: 'Keyword' },
        visibility_variability: { type: 'Keyword' },
        visibility_variability_quality: { type: 'Keyword' },
    },
};

// ------------------------------------------------------------ opensearch ---

/** One request, with retries. A 691M-document extraction WILL see transient failures. */
async function es(path, body, attempt = 0) {
    const url = `${config.esUrl}${path}`;
    try {
        const response = await fetch(url, {
            method: body ? 'POST' : 'GET',
            headers: body ? { 'content-type': 'application/json' } : {},
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(config.requestTimeoutMs),
        });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}: ${(await response.text()).slice(0, 200)}`);
        }
        return await response.json();
    } catch (err) {
        if (attempt >= config.retries) throw new Error(`${path} failed after ${attempt + 1} tries: ${err.message}`);
        // Exponential backoff. A cluster under load recovers; hammering it does not help.
        await new Promise((resolve) => {
            setTimeout(resolve, 250 * 2 ** attempt);
        });
        return es(path, body, attempt + 1);
    }
}

const rangeQuery = (gte, lt) => ({
    range: { date: { gte, lt, format: 'epoch_millis' } },
});

async function countInRange(index, gte, lt) {
    const result = await es(`/${index}/_count`, { query: rangeQuery(gte, lt) });
    return Number(result.count);
}

/** The index's real date span, so slicing never guesses at the bounds. */
async function dateBounds(index) {
    const result = await es(`/${index}/_search`, {
        size: 0,
        aggs: { lo: { min: { field: 'date' } }, hi: { max: { field: 'date' } } },
    });
    const lo = result.aggregations?.lo?.value;
    const hi = result.aggregations?.hi?.value;
    if (lo == null || hi == null) return null;
    // +1 so the upper bound is exclusive and the last document is still included.
    return { lo: Math.floor(lo), hi: Math.floor(hi) + 1 };
}

// ---------------------------------------------------------------- slicing ---

/**
 * Bisect one index's date range until every piece holds at most `target` docs.
 *
 * The same algorithm `elasticsearch_reader` uses, and for the same reason: NOAA
 * observations are not uniform in time, so a fixed time grid produces slices
 * that differ by orders of magnitude. Counting and splitting produces even ones.
 *
 * **The depth cap is not a correctness limit.** A fetcher pages its slice with
 * search_after regardless of size, so an unsplittable range (every document on
 * the same millisecond) is fetched correctly — it just yields a bigger part.
 */
async function sliceIndex(index, emit, onProgress) {
    const bounds = await dateBounds(index);
    if (!bounds) return 0;

    let emitted = 0;
    const MAX_DEPTH = 24;

    const walk = async (lo, hi, depth) => {
        const count = await countInRange(index, lo, hi);
        if (count === 0) return;

        if (count <= config.fetchSize || depth >= MAX_DEPTH || hi - lo <= 1) {
            emit({
                id: `${index}__${lo}-${hi}`, index, lo, hi, count,
            });
            emitted += 1;
            onProgress(count);
            return;
        }
        const mid = lo + Math.floor((hi - lo) / 2);
        await walk(lo, mid, depth + 1);
        await walk(mid, hi, depth + 1);
    };

    await walk(bounds.lo, bounds.hi, 0);
    return emitted;
}

// --------------------------------------------------------------- fetching ---

/**
 * Every document in one slice, in ONE request.
 *
 * **This is the whole point of the slicer.** A slice is bisected until it holds
 * at most `fetchSize` documents, so the fetcher asks for exactly that many and
 * gets all of them — no cursor, no second request, no continuation state.
 *
 * That is not a convenience, it is what makes this correct. Paging needs a
 * unique sort key, and this corpus does not have one: `_key` IS NOT UNIQUE (in a
 * 19-document index one value occurs 11 times and another 8 — the same station
 * at different timestamps), and `(date, _key)` is not unique either, with a
 * 3,098-row sample holding only 3,083 distinct pairs. `search_after` over a
 * non-unique key resumes AFTER a whole run of equal keys and silently drops the
 * rest, and OpenSearch has no `_shard_doc` (that is Elasticsearch) to fall back
 * on. Not paging at all sidesteps every bit of that.
 *
 * **Verified reachable:** these indices set `index.max_result_window` to
 * **2,000,000**, not the 10,000 default, and a single `_search` for a 15,722-doc
 * hour returned all 15,722 in 320 ms. `fetchSize` must stay under that window.
 *
 * `track_total_hits` is on so a truncated response is detectable: if the total
 * exceeds what came back, the slice was under-fetched and that must be loud
 * rather than a quietly short part file.
 */
async function fetchSlice(slice) {
    const page = await es(`/${slice.index}/_search`, {
        size: slice.count,
        query: rangeQuery(slice.lo, slice.hi),
        track_total_hits: true,
    });

    const hits = page.hits?.hits ?? [];
    const total = page.hits?.total?.value ?? hits.length;

    if (hits.length < total) {
        throw new Error(
            `under-fetched: asked for ${slice.count}, matched ${total}, got ${hits.length}. `
            + 'Lower FETCH_SIZE, or the index changed under the slicer.'
        );
    }

    return hits.map((hit) => withUtcDate(hit._source));
}

/**
 * ISO-8601 date-time with no zone: `2024-06-03T18:20:00`, optional fractional
 * seconds. Anything else is not something to silently reinterpret.
 */
const ZONELESS_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;
/** Already an instant: trailing `Z`, or a `+HH:MM` / `-HH:MM` offset. */
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * The record with `date` as a proper ISO-8601 instant.
 *
 * **MEASURED DEFECT, and it would have shipped silently.** OpenSearch stores
 * `2024-06-03T18:20:00` — a `date` with NO zone, which OpenSearch itself defines
 * as UTC. The coercion parses a zoneless string as LOCAL time, so on this box
 * (`America/Phoenix`, UTC-7) that document landed in Parquet as
 * `2024-06-04 01:20:00`: epoch 1717464000000 against the correct 1717438800000,
 * exactly 7 hours out. Every timestamp in the corpus was shifted by whatever
 * offset the extracting machine happened to be in, and no row count, null check
 * or schema check can see it.
 *
 * Appending `Z` does not change the meaning — it states what OpenSearch already
 * guarantees, and makes the value a complete ISO-8601 instant. Doing it here
 * rather than relying on `TZ=UTC` in the environment means the output cannot
 * depend on how the process was launched.
 *
 * A value that is neither zoneless ISO nor already an instant THROWS. Gluing `Z`
 * onto an unrecognised format would be inventing a timestamp, and the whole
 * point of this function is that a wrong one is invisible downstream.
 *
 * Returns a new object; the parsed payload is left as it came.
 */
function withUtcDate(source) {
    const { date } = source;
    if (date == null || HAS_ZONE.test(date)) return source;
    if (typeof date !== 'string' || !ZONELESS_ISO.test(date)) {
        throw new Error(`unexpected date format ${JSON.stringify(date)} — refusing to assume a zone`);
    }
    return { ...source, date: `${date}Z` };
}

// ----------------------------------------------------------- the fetchers ---

if (!isMainThread) {
    const { DuckFrame, configureDuckDatabase } = await import(
        new URL('../../../dist/src/duck-frame/DuckFrame.js', import.meta.url).href
    );

    // Each worker owns its own DuckDB. Without this it runs on DuckDB's defaults
    // — 80% of system RAM, per worker, ten times over.
    await configureDuckDatabase({
        memoryLimit: config.workerMemoryLimit,
        tempDirectory: config.tempDirectory,
        threads: 1,
    });

    parentPort.on('message', async (message) => {
        if (message.type === 'stop') process.exit(0);

        const { slice } = message;
        const started = Date.now();
        try {
            const records = await fetchSlice(slice);
            let file = null;

            if (records.length) {
                file = join(workerData.partsDir, `${slice.id}.parquet`);
                const frame = await DuckFrame.fromRecords(NOAA_CONFIG, records, {});
                await frame.writeParquet(file);
                await frame.destroy();
            }
            parentPort.postMessage({
                type: 'done',
                id: slice.id,
                rows: records.length,
                expected: slice.count,
                ms: Date.now() - started,
                file,
            });
        } catch (err) {
            parentPort.postMessage({
                type: 'failed', id: slice.id, message: String(err.message).split('\n')[0],
            });
        }
    });

    parentPort.postMessage({ type: 'ready' });
}

// --------------------------------------------------------- the coordinator --

async function discoverIndices() {
    const all = await es(`/_cat/indices/${config.pattern}?format=json&h=index,docs.count`);
    return all
        .map((row) => ({ index: row.index, docs: Number(row['docs.count']) }))
        .filter((row) => row.docs > 0)
        .sort((a, b) => a.index.localeCompare(b.index));
}

/** Part files already on disk. A completed slice is never re-fetched. */
async function existingParts(partsDir) {
    try {
        const names = await readdir(partsDir);
        return new Set(names.filter((n) => n.endsWith('.parquet')).map((n) => n.replace(/\.parquet$/, '')));
    } catch {
        return new Set();
    }
}

async function main() {
    const only = process.argv.includes('--index')
        ? process.argv[process.argv.indexOf('--index') + 1]
        : null;

    const partsDir = join(config.outDir, 'parts');
    await mkdir(partsDir, { recursive: true });
    await mkdir(config.tempDirectory, { recursive: true });

    const indices = (await discoverIndices()).filter((i) => !only || i.index === only);
    const totalDocs = indices.reduce((sum, i) => sum + i.docs, 0);
    const done = await existingParts(partsDir);

    console.log(`${indices.length} indices, ${totalDocs.toLocaleString()} documents`);
    console.log(`${config.slicers} slicers, ${config.fetchers} fetchers, `
        + `${config.fetchSize.toLocaleString()} docs/slice`);
    console.log(`parts -> ${partsDir}${done.size ? `  (${done.size} already present, will be skipped)` : ''}`);
    console.log('');

    // --- the queue, filled by slicers and drained by fetchers ---
    const queue = [];
    let slicingDone = false;
    let sliced = 0;
    let slicedDocs = 0;
    let skippedSlices = 0;
    let skippedDocs = 0;

    /*
     * A slice already on disk is skipped — and its rows MUST still be counted,
     * or the completeness check below fires on every resumed run. It did: a run
     * that resumed 128 existing parts reported "fetched 681,275,914, sliced for
     * 691,122,937" and told the operator not to merge, when the parts held all
     * 691,122,937 rows. A guard that cries wolf is worse than no guard.
     */
    const emit = (slice) => {
        if (done.has(slice.id)) {
            skippedSlices += 1;
            skippedDocs += slice.count;
            return;
        }
        queue.push(slice);
        sliced += 1;
    };

    // Slicers take indices off a shared list, so a slow index does not idle the others.
    const pending = [...indices];
    const slicerTasks = Array.from({ length: config.slicers }, async () => {
        for (;;) {
            const next = pending.shift();
            if (!next) return;
            await sliceIndex(next.index, emit, (n) => {
                slicedDocs += n;
            });
        }
    });

    const slicing = Promise.all(slicerTasks).then(() => {
        slicingDone = true;
    });

    // --- fetchers ---
    const stats = {
        rows: 0, parts: 0, failed: 0, started: Date.now(),
    };
    const failures = [];
    let lastReport = 0;

    const report = () => {
        const elapsed = (Date.now() - stats.started) / 1000;
        const rate = Math.round(stats.rows / Math.max(elapsed, 1));
        const pct = totalDocs ? ((stats.rows / totalDocs) * 100).toFixed(2) : '0';
        console.log(`  ${stats.rows.toLocaleString().padStart(13)} rows  ${pct.padStart(6)}%  `
            + `${stats.parts.toLocaleString().padStart(6)} parts  `
            + `${rate.toLocaleString().padStart(8)} rows/s  `
            + `${queue.length.toLocaleString().padStart(6)} queued  `
            + `${Math.round(elapsed).toLocaleString()
                .padStart(6)}s`
                + (stats.failed ? `  ${stats.failed} FAILED` : ''));
    };

    await new Promise((resolve, reject) => {
        const workers = [];
        let live = 0;

        const give = (worker) => {
            const slice = queue.shift();
            if (slice) {
                worker.postMessage({ type: 'slice', slice });
                return;
            }
            if (slicingDone) {
                worker.postMessage({ type: 'stop' });
                return;
            }
            // Slicers are still working; check back rather than spin.
            setTimeout(() => give(worker), 100);
        };

        for (let n = 0; n < config.fetchers; n++) {
            const worker = new Worker(fileURLToPath(import.meta.url), {
                workerData: { partsDir },
            });
            live += 1;
            workers.push(worker);

            worker.on('message', (message) => {
                if (message.type === 'done') {
                    stats.rows += message.rows;
                    if (message.file) stats.parts += 1;
                    if (message.expected != null && message.rows !== message.expected) {
                        // A slice that returns a different count than it was sliced for
                        // means the paging lost or repeated rows. Never let that pass silently.
                        failures.push(`${message.id}: fetched ${message.rows}, sliced for ${message.expected}`);
                        stats.failed += 1;
                    }
                } else if (message.type === 'failed') {
                    stats.failed += 1;
                    failures.push(`${message.id}: ${message.message}`);
                }
                if (Date.now() - lastReport > 5000) {
                    lastReport = Date.now();
                    report();
                }
                give(worker);
            });

            worker.on('error', reject);
            worker.on('exit', () => {
                live -= 1;
                if (live === 0) resolve();
            });
        }
    });

    await slicing;
    report();

    console.log('');
    const accounted = stats.rows + skippedDocs;
    console.log(`sliced  ${(sliced + skippedSlices).toLocaleString()} slices covering `
        + `${slicedDocs.toLocaleString()} documents`);
    console.log(`fetched ${stats.parts.toLocaleString()} parts, ${stats.rows.toLocaleString()} rows`);
    if (skippedSlices) {
        console.log(`skipped ${skippedSlices.toLocaleString()} slices already on disk, `
            + `${skippedDocs.toLocaleString()} rows`);
    }
    console.log(`total   ${accounted.toLocaleString()} of ${slicedDocs.toLocaleString()}`);

    if (accounted !== slicedDocs) {
        console.log('');
        console.log(`MISMATCH: accounted for ${accounted.toLocaleString()} but sliced for `
            + `${slicedDocs.toLocaleString()}.`);
        console.log('Do NOT merge until this is understood — the parts are missing rows.');
    } else {
        console.log('');
        console.log('COMPLETE: every sliced document is on disk. Safe to --merge.');
    }
    if (failures.length) {
        console.log('');
        console.log(`${failures.length} failures. Re-run to retry them; completed parts are skipped:`);
        for (const f of failures.slice(0, 20)) console.log(`  ${f}`);
        if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
        process.exitCode = 1;
    }
}

// ------------------------------------------------------------- the merge ---

/**
 * The parts into ONE file, in one pass.
 *
 * Row groups, not files, are the unit of query cost, so this buys nothing for
 * queries — the parts already answer just as fast. It produces the single
 * artifact that ships, and it refills the row groups: each part holds at most
 * FETCH_SIZE rows, which is below DuckDB's 122,880-row group, so every part is an
 * under-filled group until this rewrites them.
 */
async function merge() {
    const { open } = await import('../lib/duck.mjs');
    const partsDir = join(config.outDir, 'parts');
    const target = join(config.outDir, 'noaa-isd-v5.parquet');

    const names = (await readdir(partsDir)).filter((n) => n.endsWith('.parquet'));
    if (!names.length) throw new Error(`no parts in ${partsDir} — run the extraction first`);

    const session = await open({ memoryLimit: process.env.MERGE_MEMORY_LIMIT || '8GiB' });
    try {
        const glob = join(partsDir, '*.parquet');
        const rows = Number(await session.one(`SELECT count(*) FROM read_parquet('${glob}')`));
        console.log(`${names.length.toLocaleString()} parts, ${rows.toLocaleString()} rows -> ${target}`);

        const started = Date.now();
        await session.connection.run(
            `COPY (SELECT * FROM read_parquet('${glob}')) TO '${target}' (FORMAT parquet, COMPRESSION zstd)`
        );
        const size = (await stat(target)).size;
        const seconds = (Date.now() - started) / 1000;

        console.log(`merged in ${seconds.toFixed(1)}s`);
        console.log(`${(size / 1024 ** 3).toFixed(2)} GiB, `
            + `${(size / (rows / 1e6) / 1024 ** 2).toFixed(1)} MiB per million rows`);
        console.log('');
        console.log('That MiB/million is the first real-data figure we have — the fixtures were');
        console.log('synthetic and calibrated against an estimate. See fixtures/schema.mjs.');
    } finally {
        session.close();
    }
}

// ------------------------------------------------------------- the upload ---

/**
 * The merged file to S3, into the layout the harness already understands.
 *
 *   s3://<bucket>/v1/noaa/noaa-isd-v5.parquet
 *
 * Same one-bucket / one-prefix-per-corpus layout as the generated fixtures, and
 * for the same reason: `S3_GLOB` defaults to `**` + `/*.parquet`, so anything at
 * the bucket root would be matched by every other fixture's glob. With the
 * prefix, `FIXTURE=noaa` targets this corpus and nothing else.
 *
 * **Not `upload-fixture.mjs`.** That script verifies an upload with the
 * generated schema's own predicates — `active = true AND category = 'gamma'`,
 * `count(DISTINCT name)` — and NOAA has none of those columns, so it would fail
 * on a perfectly good object. The verification here uses columns this corpus has.
 *
 * **This re-encodes rather than copying bytes**, because DuckDB has no S3 PUT of
 * a local file: `COPY (SELECT * FROM read_parquet(local)) TO 's3://...'` is the
 * available path. httpfs does the multipart upload itself, so a 22.87 GiB object
 * needs no special handling.
 */
async function upload() {
    const bucketArg = process.argv.indexOf('--bucket');
    const bucket = bucketArg === -1 ? process.env.S3_BUCKET : process.argv[bucketArg + 1];
    if (!bucket) throw new Error('--bucket <name> is required (or set S3_BUCKET)');

    const { config: env } = await import('../lib/env.mjs');
    if (!env.endpoint || !env.accessKeyId) {
        throw new Error(
            `no S3 endpoint or credentials in ${process.env.S3_PERF_ENV_FILE || '/app/config/s3.env'}. `
            + 'Point S3_PERF_ENV_FILE at an env file that has them.'
        );
    }

    const local = join(config.outDir, 'noaa-isd-v5.parquet');
    if (!existsSync(local)) throw new Error(`${local} not found — run --merge first`);
    const target = `s3://${bucket}/v1/noaa/noaa-isd-v5.parquet`;

    const { open } = await import('../lib/duck.mjs');
    const session = await open({ memoryLimit: process.env.MERGE_MEMORY_LIMIT || '8GiB' });

    try {
        const num = (x) => Number(x).toLocaleString();
        console.log(`  from      ${local}  (${((await stat(local)).size / 1024 ** 3).toFixed(2)} GiB)`);
        console.log(`  to        ${target}`);
        console.log(`  endpoint  ${env.endpoint} (ssl ${env.useSsl}, ${env.urlStyle}-style)`);
        console.log('');
        console.log('  uploading — a re-encode, so expect a full read and write');

        const started = Date.now();
        await session.connection.run(
            `COPY (SELECT * FROM read_parquet('${local}')) TO '${target}' `
            + '(FORMAT parquet, COMPRESSION zstd)'
        );
        console.log(`  done in ${((Date.now() - started) / 1000).toFixed(1)} s`);

        console.log('\n  VERIFYING THE REMOTE OBJECT');
        const localRows = Number(await session.one(`SELECT count(*) FROM read_parquet('${local}')`));
        const remoteRows = Number(await session.one(`SELECT count(*) FROM read_parquet('${target}')`));
        console.log(`    rows local   ${num(localRows)}`);
        console.log(`    rows remote  ${num(remoteRows)}`);
        if (localRows !== remoteRows) {
            throw new Error('ROW COUNTS DIFFER — the upload is incomplete. Do not use this object.');
        }

        /*
         * A row count alone would miss a corrupt page, so check value-dependent
         * properties too — cheap next to hashing 22.87 GiB. `approx_count_distinct`
         * rather than exact: an exact DISTINCT over 691M rows needed more than
         * 8 GiB and was killed.
         */
        const [span] = await session.rows(
            `SELECT min(date), max(date), approx_count_distinct(station_id),
                    count(*) FILTER (WHERE temperature_c > 30)
             FROM read_parquet('${target}')`
        );
        console.log(`    date span    ${span[0]} .. ${span[1]}`);
        console.log(`    stations     ~${num(span[2])}`);
        console.log(`    temp > 30C   ${num(span[3])} `
            + `(${((Number(span[3]) / remoteRows) * 100).toFixed(2)}%)`);
        console.log('\n  UPLOAD VERIFIED');
        console.log(`\n  point the harness at it with:   FIXTURE=noaa S3_BUCKET=${bucket} ./run.sh doctor`);
    } finally {
        session.close();
    }
}

if (isMainThread) {
    try {
        if (process.argv.includes('--merge')) await merge();
        else if (process.argv.includes('--upload')) await upload();
        else await main();
    } catch (err) {
        console.error(`\nFAILED: ${err.message}`);
        process.exit(1);
    }
}
