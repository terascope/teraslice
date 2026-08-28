/**
 * What does adding a UDF to an otherwise-native projection cost — and is there a threshold?
 *
 * **This script previously reported a threshold that does not exist.** It applied five DIFFERENT
 * functions to five DIFFERENT columns and forced them onto the UDF path in a fixed order, then read
 * the jump between "2 UDFs" and "3 UDFs" as a parallelism cliff. The columns' cardinalities were
 * 100,000 / 2,000,000 / 5 / 4 / 2,000,000 - so each step added a wildly different amount of work,
 * and the "cliff" was just the 2M-distinct column arriving second. The compressed run's increments
 * (+45, +754, +13, -17, +852 ms) track cardinality almost perfectly and the UDF count not at all.
 *
 * So the variable is isolated here instead. **One function, one column, N times** - the same
 * `replaceLiteral` over the same values, with a different `search` argument each time so each is a
 * separate UDF registration doing identical work. N is then the only thing that changes:
 *
 *   - a LINEAR rise means each UDF costs the same and there is no threshold;
 *   - a step means something really does change state at a particular count.
 *
 * `cores` is CPU time over wall time - ~1.0 is one core, ~10 is ten. A JS UDF blocks the DuckDB
 * worker thread until JavaScript returns, so this is where serialisation shows up.
 *
 * Measured against an uncompressed AND a checkpointed table, because that changes the number of
 * INVOCATIONS by orders of magnitude: uncompressed a UDF runs once per ROW, compressed once per
 * distinct value per row group.
 *
 *     cd packages/data-mate && npx tsc -b
 *     node docs/tools/bench/transform-mix.mjs
 *     ROWS=5000000 COLUMN=email node docs/tools/bench/transform-mix.mjs
 */
import { duckFrame, dataMate, heading, note } from '../lib/duck.mjs';

const ROWS = Number(process.env.ROWS || 2_000_000);
/** `name` is 100k distinct over 2M rows - enough work to matter, low enough to compress. */
const COLUMN = process.env.COLUMN || 'name';
const STEPS = Number(process.env.STEPS || 6);

const { DuckFrame, closeDuckDatabase } = await duckFrame();
const { functionConfigRepository: repo } = await dataMate();
const { duckFrameAdapter } = await import(
    new URL('../../../dist/src/adapters/duck-frame-adapter/index.js', import.meta.url).href
);
const { CONFIG, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url)
);

/** Distinct search characters, so every step is a DIFFERENT UDF doing the SAME amount of work. */
const SEARCHES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const frame = await DuckFrame.fromRecords(CONFIG, makeRecords(ROWS), { name: 'mix' });
const TABLE = frame.table;

async function build(udfCount) {
    const parts = [];
    const dispatches = [];
    for (let i = 0; i < STEPS; i++) {
        const adapted = await duckFrameAdapter(repo.replaceLiteral, {
            field: COLUMN,
            inputConfig: { field_config: CONFIG.fields[COLUMN] },
            args: { search: SEARCHES[i], replace: SEARCHES[i].toUpperCase() },
            preferSql: i >= udfCount,
        });
        parts.push(`${adapted.expression} AS c${i}`);
        dispatches.push(adapted.dispatch);
    }
    const projection = `SELECT ${parts.join(', ')} FROM "${TABLE}"`;
    const sums = Array.from({ length: STEPS }, (_, i) => `sum(hash(c${i})::HUGEINT)`);
    return { sql: `SELECT ${sums.join(', ')} FROM (${projection})`, dispatches };
}

async function run(sql) {
    await frame.query(sql); // warm-up: UDF registration and plan cache
    const cpuBefore = process.cpuUsage();
    const start = process.hrtime.bigint();
    const rows = await frame.query(sql);
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const cpu = process.cpuUsage(cpuBefore);
    return { ms, cores: (cpu.user + cpu.system) / 1000 / ms, checksum: JSON.stringify(rows[0]) };
}

heading(`TRANSFORM MIX: ${STEPS} x replaceLiteral on "${COLUMN}", ${ROWS.toLocaleString()} rows`);

try {
    const distinct = await frame.query(`SELECT count(DISTINCT "${COLUMN}") FROM "${TABLE}"`);
    note(`"${COLUMN}" has ${Number(distinct[0][0]).toLocaleString()} distinct values`);

    for (const compressed of [false, true]) {
        if (compressed) {
            await frame.query('CREATE OR REPLACE TABLE _arm (a INTEGER)');
            await frame.query('DROP TABLE _arm');
            await frame.query('CHECKPOINT');
        }

        heading(compressed
            ? 'CHECKPOINTED - a UDF runs once per DISTINCT value per row group'
            : 'UNCOMPRESSED - a UDF runs once per ROW');
        note('udfs       ms    cores     delta   dispatches');

        let previous = null;
        let expected = null;
        for (let udfCount = 0; udfCount <= STEPS; udfCount++) {
            const { sql, dispatches } = await build(udfCount);
            const result = await run(sql);

            if (expected == null) expected = result.checksum;
            const same = result.checksum === expected ? '' : '  <-- DIFFERENT ANSWER';
            const delta = previous == null
                ? '' : `${result.ms - previous >= 0 ? '+' : ''}${(result.ms - previous).toFixed(0)}`;
            previous = result.ms;

            note(`${String(udfCount).padStart(4)}${result.ms.toFixed(0).padStart(9)}`
                + `${result.cores.toFixed(1).padStart(9)}${delta.padStart(10)}   `
                + `${dispatches.join(',')}${same}`);
        }
    }
} finally {
    await frame.destroy();
    await closeDuckDatabase();
}

process.exit(0);
