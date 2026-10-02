/* eslint-disable no-console -- a probe's output IS its result */
// Is BIGNUM arithmetic exact, or does it fall back to DOUBLE?
import { DuckDBInstance } from '@duckdb/node-api';
const c = await (await DuckDBInstance.create(':memory:')).connect();
const big = '\'170141183460469231731687303715884105727\'::BIGNUM';
for (const [label, e] of [
    ['a + 1', `${big} + 1`],
    ['a - 1', `${big} - 1`],
    ['a * 2', `${big} * 2`],
    ['a // 3', `${big} // 3`],
    ['a / 3', `${big} / 3`],
    ['a % 7', `${big} % 7`],
    ['abs(-a)', `abs(-${big})`],
    ['a * a', `${big} * ${big}`],
    ['9007199254740993 * 1', '\'9007199254740993\'::BIGNUM * 1'],
    ['sum of two big', `(SELECT sum(v) FROM (VALUES (${big}), (${big})) t(v))`],
]) {
    try {
        const [[v, t]] = (await c.runAndReadAll(`SELECT (${e})::VARCHAR, typeof(${e})`)).getRows();
        console.log(`${label.padEnd(22)} ${t.padEnd(8)} ${v}`);
    } catch (err) {
        console.log(`${label.padEnd(22)} FAIL ${err.message.split('\n')[0]}`);
    }
}
process.exit(0);
