/* eslint-disable no-console -- a probe's output IS its result */
// Where does DuckDB's DOUBLE-to-JSON rendering differ from JSON.stringify? Both ends of the
// exponential range, integral and not.
import { DuckDBInstance } from '@duckdb/node-api';

const c = await (await DuckDBInstance.create(':memory:')).connect();
const VALUES = [
    1e20,
    99999999999999980000,
    1e21,
    1.5e21,
    -3e22,
    1.2345678901234566e25,
    9.99e300,
    1.7976931348623157e308,
    123456789012345680000,
    1e-6,
    1.5e-6,
    9.99e-7,
    1e-7,
    5e-324,
    1.234e-300,
    -2.5e-8,
    0.000001,
    0.0000012345,
    1.2345e-5,
    0.1,
    123.456,
];
let differ = 0;
for (const v of VALUES) {
    const [[duck]] = (await c.runAndReadAll(`SELECT to_json(${v}::DOUBLE)::VARCHAR`)).getRows();
    const js = JSON.stringify(v);
    if (duck !== js) differ++;
    console.log(`${duck === js ? 'same' : 'DIFF'}  js ${js.padEnd(24)} duck ${duck}`);
}
console.log(`${differ} of ${VALUES.length} differ`);
process.exit(0);
