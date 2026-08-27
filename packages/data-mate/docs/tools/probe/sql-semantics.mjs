/**
 * Are the recorded "divergences" a limit of SQL, or just of the CAST we happened to test?
 * Every row below is an input where data-mate and `TRY_CAST` disagreed. The question is whether a
 * DELIBERATE SQL expression reproduces data-mate's answer.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/package.json');
const { DuckDBInstance } = await import(pathToFileURL(require.resolve('@duckdb/node-api')).href);
const inst = await DuckDBInstance.create(':memory:');
const c = await inst.connect();
const q = async (sql) => {
    try {
        const r = await c.run(sql);
        return JSON.stringify((await r.getRowsJson())[0][0]);
    } catch (err) { return `ERROR: ${String(err.message).split('\n')[0].slice(0, 60)}`; }
};

const CASES = [
    // input, data-mate's answer, naive cast, a deliberate expression
    ['12.7', '12', `TRY_CAST('12.7' AS TINYINT)`, `TRY_CAST(trunc(TRY_CAST('12.7' AS DOUBLE)) AS TINYINT)`],
    ['2.5', '2', `TRY_CAST('2.5' AS TINYINT)`, `TRY_CAST(trunc(TRY_CAST('2.5' AS DOUBLE)) AS TINYINT)`],
    ['-2.5', '-2', `TRY_CAST('-2.5' AS TINYINT)`, `TRY_CAST(trunc(TRY_CAST('-2.5' AS DOUBLE)) AS TINYINT)`],
    ['0x10', '0', `TRY_CAST('0x10' AS TINYINT)`, `TRY_CAST(regexp_extract('0x10', '^[+-]?[0-9]+') AS TINYINT)`],
    ['0b11', '0', `TRY_CAST('0b11' AS TINYINT)`, `TRY_CAST(regexp_extract('0b11', '^[+-]?[0-9]+') AS TINYINT)`],
    ['1e3 (Short)', '1', `TRY_CAST('1e3' AS SMALLINT)`, `TRY_CAST(regexp_extract('1e3', '^[+-]?[0-9]+') AS SMALLINT)`],
    ['y (Boolean)', 'THROW', `TRY_CAST('y' AS BOOLEAN)`, `CASE WHEN lower('y') IN ('true','false','1','0') THEN TRY_CAST('y' AS BOOLEAN) ELSE error('not a boolean') END`],
    ['"" (Boolean)', 'false', `TRY_CAST('' AS BOOLEAN)`, `CASE WHEN '' = '' THEN false ELSE TRY_CAST('' AS BOOLEAN) END`],
    ['1710028800000 (Date)', '2024-03-10T00:00:00.000Z', `strftime(TRY_CAST('1710028800000' AS TIMESTAMPTZ),'%Y-%m-%dT%H:%M:%S.%g')`, `strftime(epoch_ms(TRY_CAST('1710028800000' AS BIGINT)), '%Y-%m-%dT%H:%M:%S.%g') || 'Z'`],
    ['Mar 10 2024 (Date)', '2024-03-10T00:00:00.000Z', `strftime(TRY_CAST('Mar 10 2024' AS TIMESTAMPTZ),'%Y-%m-%dT%H:%M:%S.%g')`, `strftime(try_strptime('Mar 10 2024', ['%b %d %Y','%m/%d/%Y','%Y-%m-%d']), '%Y-%m-%dT%H:%M:%S.%g') || 'Z'`],
    ['03/10/2024 (Date)', '2024-03-10T00:00:00.000Z', `strftime(TRY_CAST('03/10/2024' AS TIMESTAMPTZ),'%Y-%m-%dT%H:%M:%S.%g')`, `strftime(try_strptime('03/10/2024', ['%b %d %Y','%m/%d/%Y','%Y-%m-%d']), '%Y-%m-%dT%H:%M:%S.%g') || 'Z'`],
    ['01.02.03.04 (IP)', 'THROW', `TRY_CAST('01.02.03.04' AS INET)::VARCHAR`, `CASE WHEN regexp_matches('01.02.03.04', '^(0|[1-9][0-9]{0,2})(\\.(0|[1-9][0-9]{0,2})){3}$') THEN TRY_CAST('01.02.03.04' AS INET)::VARCHAR ELSE error('not an IP') END`],
    ['1.2.3.4/24 (IP)', 'THROW', `TRY_CAST('1.2.3.4/24' AS INET)::VARCHAR`, `CASE WHEN contains('1.2.3.4/24', '/') THEN error('CIDR is not an IP') ELSE TRY_CAST('1.2.3.4/24' AS INET)::VARCHAR END`],
];

console.log(`  ${'input'.padEnd(24)}${'data-mate'.padEnd(28)}${'naive TRY_CAST'.padEnd(24)}deliberate SQL`);
for (const [name, mate, naive, better] of CASES) {
    const a = await q(`SELECT ${naive}`);
    const b = await q(`SELECT ${better}`);
    const ok = (mate === 'THROW' ? b.startsWith('ERROR') : b.replace(/"/g, '').startsWith(mate.replace(/"/g, '')));
    console.log(`  ${name.padEnd(24)}${mate.padEnd(28)}${a.slice(0, 22).padEnd(24)}${b.slice(0, 34)}  ${ok ? 'MATCH' : 'no'}`);
}
process.exit(0);
