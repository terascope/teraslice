/* eslint-disable no-console -- a probe's output IS its result */
// The SQL pieces a configurable, DataFrame-exact JSON renderer needs. Each line prints what
// DuckDB 1.5.5 actually does.
import { DuckDBInstance } from '@duckdb/node-api';

const c = await (await DuckDBInstance.create(':memory:')).connect();
const show = async (label, sql) => {
    try {
        const rows = (await c.runAndReadAll(sql)).getRowsJson();
        console.log(`  ok   ${label}: ${JSON.stringify(rows)}`);
    } catch (e) {
        console.log(`  FAIL ${label}: ${e.message.split('\n')[0]}`);
    }
};
await show('concat_ws skips NULL members', `SELECT '{' || concat_ws(',', '"a":1', NULL, '"c":3') || '}'`);
await show('concat_ws with all NULL', `SELECT '{' || concat_ws(',', NULL, NULL) || '}'`);
await show('array_to_string keeps or drops NULL?', `SELECT array_to_string(['1', NULL, '3'], ',')`);
await show('array_to_string of empty list', `SELECT '[' || array_to_string([]::VARCHAR[], ',') || ']'`);
await show('coalesce elements then join', `SELECT '[' || array_to_string(list_transform(['1', NULL], lambda e : coalesce(e, 'null')), ',') || ']'`);
await show('order-preserving dedupe (lambda with index)', `SELECT list_filter(['b','a','b','c','a'], lambda x, i : list_position(['b','a','b','c','a'], x) = i)`);
await show('to_json(VARCHAR) escapes', `SELECT to_json('a"b\\\\c' || chr(10))::VARCHAR`);
await show('struct cast by name, members reordered', `SELECT {'e': 'top', 'b': {'c': 'x'}}::STRUCT(b STRUCT(c VARCHAR), e VARCHAR)`);
await c.run(`CREATE TABLE t (s STRUCT(b STRUCT(c VARCHAR), e VARCHAR))`);
await show('INSERT struct with other member order', `INSERT INTO t SELECT {'e': 'top', 'b': {'c': 'x'}}; SELECT s FROM t`);
await show('text is valid JSON (::JSON)', `SELECT ('{' || concat_ws(',', '"a":1', '"b":[1,null]') || '}')::JSON`);
process.exit(0);
