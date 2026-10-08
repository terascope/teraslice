/* eslint-disable no-console -- a probe's output IS its result */
// Is ingest exact for a Long whatever FORM the input value takes - bigint, string, number?
import { TealFrame } from '../../../dist/src/teal-frame/index.js';
import { FieldType as T } from '@terascope/types';
const collect = async (it) => {
    const o = [];
    for await (const r of it) {
        o.push(r);
    }
    return o;
};
const cases = [['bigint', 9007199254740993n], ['string', '9007199254740993'], ['bigint max', 9223372036854775807n], ['string max', '9223372036854775807'], ['bigint neg', -9007199254740993n], ['string neg', '-9007199254740993']];
const f = await TealFrame.fromRecords(
    { version: 1, fields: { k: { type: T.Keyword }, n: { type: T.Long } } },
    cases.map(([k, n]) => ({ k, n }))
);
for (const r of await collect(f.query(`SELECT k, n::VARCHAR AS n FROM ${f.searchParams().relation ?? 'x'}`).rows()).catch(() => [])) console.log(r);
const rows = await collect(f.rows());
rows.forEach((r, i) => console.log(`${cases[i][0].padEnd(11)} in=${String(cases[i][1]).padEnd(22)} stored=${r.n}${String(r.n) === String(cases[i][1]) ? '' : '   <-- WRONG'}`));
process.exit(0);
