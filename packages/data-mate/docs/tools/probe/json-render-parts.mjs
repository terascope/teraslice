/* eslint-disable no-console -- a probe's output IS its result */
// Where does rendering a row as JSON TEXT cost more than json_object? Each shape renders the same
// fields over 1M rows; sum(strlen(...)) forces every row to be built. Median of 5, warm.
import { DuckDBInstance } from '@duckdb/node-api';

const c = await (await DuckDBInstance.create(':memory:')).connect();
await c.run(`CREATE TABLE t AS SELECT 'k' || i AS k, i % 1000 AS n, i / 7.0 AS d, i % 2 = 0 AS b,
    TIMESTAMP '2026-01-01' + INTERVAL (i) SECOND AS ts,
    {'source': 'api', 'depth': i % 9} AS obj,
    [{'sku': 's' || (i % 50), 'qty': i % 4}, {'sku': 'x', 'qty': NULL}] AS items
    FROM range(1000000) r(i)`);
const F = '\'%Y-%m-%dT%H:%M:%S.%gZ\'';
const SHAPES = {
    'json_object, 5 scalars': `json_object('k', k, 'n', n, 'd', d, 'b', b, 'ts', strftime(ts, ${F}))::VARCHAR`,
    'text, to_json per leaf': `'{' || concat_ws(',', '"k":' || to_json(k)::VARCHAR, '"n":' || to_json(n)::VARCHAR, '"d":' || to_json(d)::VARCHAR, '"b":' || to_json(b)::VARCHAR, '"ts":' || to_json(strftime(ts, ${F}))::VARCHAR) || '}'`,
    'text, ::VARCHAR where no escaping is possible': `'{' || concat_ws(',', '"k":' || to_json(k)::VARCHAR, '"n":' || n::VARCHAR, '"d":' || d::VARCHAR, '"b":' || b::VARCHAR, '"ts":"' || strftime(ts, ${F}) || '"') || '}'`,
    'json_object, object': `json_object('obj', json_object('source', obj.source, 'depth', obj.depth))::VARCHAR`,
    'text, object': `'{"obj":' || '{' || concat_ws(',', '"source":' || to_json(obj.source)::VARCHAR, '"depth":' || obj.depth::VARCHAR) || '}' || '}'`,
    'to_json list of objects': `to_json(list_transform(items, lambda e : json_object('sku', e.sku, 'qty', e.qty)))::VARCHAR`,
    'text list of objects': `'[' || array_to_string(list_transform(items, lambda e : '{' || concat_ws(',', '"sku":' || to_json(e.sku)::VARCHAR, '"qty":' || e.qty::VARCHAR) || '}'), ',') || ']'`,
    'text list, element to_json(struct)': `'[' || array_to_string(list_transform(items, lambda e : to_json(e)::VARCHAR), ',') || ']'`,
};
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const [name, expr] of Object.entries(SHAPES)) {
    const times = [];
    for (let run = 0; run < 6; run++) {
        const start = process.hrtime.bigint();
        await c.runAndReadAll(`SELECT sum(strlen(${expr})) FROM t`);
        if (run) times.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
    console.log(`${name.padEnd(46)} ${median(times).toFixed(0)
        .padStart(5)} ms`);
}
process.exit(0);
