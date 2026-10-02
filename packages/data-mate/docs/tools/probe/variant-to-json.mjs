/* eslint-disable no-console -- a probe's output IS its result */
// How does a VARIANT render as JSON? to_json() vs ::JSON cast vs json_serialize, on the values an
// Any holds.
import { DuckDBInstance } from '@duckdb/node-api';
const c = await (await DuckDBInstance.create(':memory:')).connect();
const J = ['{"a":1,"b":"x"}', '"plain"', '12', '1.5', 'true', '9007199254740993', '-9223372036854775808', '{"nested":{"deep":[1,2,{"k":null}]}}', '{}', '[]', '{"n":null}', '1e300', '0.1'];
for (const j of J) {
    const r = await c.runAndReadAll(`WITH t AS (SELECT '${j}'::JSON::VARIANT v) SELECT variant_typeof(v), to_json(v)::VARCHAR, v::JSON::VARCHAR FROM t`);
    const [[t, tj, cast]] = r.getRows();
    console.log(`${cast === j ? 'ok  ' : 'DIFF'} in=${j}  type=${t}  ::JSON=${cast}  to_json=${tj}`);
}
process.exit(0);
