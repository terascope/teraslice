/**
 * Reserved words need quoting, and a DuckDB quoted identifier is case-INsensitive (the
 * opposite of Postgres) - which is why quoteIdentifier can quote unconditionally.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/probe/identifier-quoting.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const i = await DuckDBInstance.create(':memory:');
const c = await i.connect();
async function t(label, sql) {
  try { const r = await c.run(sql); console.log('OK  ', label, '->', JSON.stringify(await r.getRowObjectsJson())); }
  catch (e) { console.log('ERR ', label, '->', e.message.split('\n')[0]); }
}
await t('unquoted reserved word DDL', 'CREATE TABLE a (name VARCHAR, group VARCHAR)');
await t('quoted reserved word DDL', 'CREATE TABLE b ("name" VARCHAR, "group" VARCHAR)');
await t('insert into quoted', `INSERT INTO b VALUES ('x','y')`);
await t('select quoted', 'SELECT "group" FROM b');
await t('select reserved unquoted', 'SELECT group FROM b');
// case sensitivity of quoted identifiers
await t('mixed-case quoted DDL', 'CREATE TABLE c ("MixedCase" VARCHAR)');
await t('insert', `INSERT INTO c VALUES ('v')`);
await t('select bare lowercase', 'SELECT mixedcase FROM c');
await t('select quoted lowercase', 'SELECT "mixedcase" FROM c');
await t('select quoted exact', 'SELECT "MixedCase" FROM c');
await t('quoted table name, bare use', 'SELECT * FROM "c"');
c.disconnectSync(); i.closeSync();
