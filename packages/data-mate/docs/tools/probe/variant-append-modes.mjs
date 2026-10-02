/* eslint-disable no-console -- a probe's output IS its result */
// Which way of writing a VARIANT from JS works? One mode per process, because some SEGFAULT.
import { DuckDBInstance, DuckDBDataChunk, variantValue } from '@duckdb/node-api';
const mode = process.argv[2];
const VALUES = {
    object: { a: 1, b: 'x' },
    string: 'plain',
    int: 12,
    double: 1.5,
    bool: true,
    bigint: 9007199254740993n,
    nested: { nested: { deep: [1, 2, { k: null }] } },
    emptyObj: {},
    emptyList: [],
};
const c = await (await DuckDBInstance.create(':memory:')).connect();
await c.run('CREATE TABLE v (k VARCHAR, v VARIANT)');
const types = (await c.run('SELECT * FROM v LIMIT 0')).columnTypes();
for (const [k, x] of Object.entries(VALUES)) {
    try {
        if (mode === 'chunk-raw' || mode === 'chunk-variant') {
            const chunk = DuckDBDataChunk.create(types, 1);
            chunk.setColumns([[k], [mode === 'chunk-raw' ? x : variantValue(x)]]);
            const a = await c.createAppender('v');
            a.appendDataChunk(chunk);
            a.flushSync();
            a.closeSync();
        } else if (mode === 'appendVariant') {
            const a = await c.createAppender('v');
            a.appendVarchar(k);
            a.appendVariant(variantValue(x));
            a.endRow();
            a.flushSync();
            a.closeSync();
        } else if (mode === 'sql-from-json') {
            await c.run(`INSERT INTO v SELECT '${k}', '${JSON.stringify(x, (_, y) => (typeof y === 'bigint' ? Number(y) : y))}'::JSON::VARIANT`);
        }
        const r = await c.runAndReadAll(`SELECT variant_typeof(v), to_json(v)::VARCHAR FROM v WHERE k = '${k}'`);
        console.log(`  ${k}: ok`, JSON.stringify(r.getRows()));
    } catch (e) {
        console.log(`  ${k}: FAIL ${e.message.split('\n')[0]}`);
    }
}
process.exit(0);
