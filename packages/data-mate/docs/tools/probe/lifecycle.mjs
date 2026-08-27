// What does duckdb actually COST, and when? Does installing/importing start anything?
const rss = () => Math.round(process.memoryUsage().rss / 1048576);
const threads = () => { try { return require('node:fs').readdirSync('/proc/self/task').length; } catch { return 'n/a(macos)'; } };
console.log(`stage 0  before import          rss=${rss()}MB threads=${threads()}`);

const t0 = Date.now();
const api = (await import('@duckdb/node-api')).default;
console.log(`stage 1  after import           rss=${rss()}MB threads=${threads()}  (+${Date.now()-t0}ms)`);
console.log(`         -> nothing running yet; version() is a static call: ${api.version()}`);

const t1 = Date.now();
const inst = await api.DuckDBInstance.create(':memory:', { threads: '2', memory_limit: '1GB' });
console.log(`stage 2  after InstanceCreate   rss=${rss()}MB threads=${threads()}  (+${Date.now()-t1}ms)`);

const t2 = Date.now();
const conn = await inst.connect();
console.log(`stage 3  after connect          rss=${rss()}MB threads=${threads()}  (+${Date.now()-t2}ms)`);

await conn.run('CREATE TABLE t AS SELECT v, concat(\'s\',v) s FROM range(1000000) t(v)');
console.log(`stage 4  after 1M-row table     rss=${rss()}MB threads=${threads()}`);
conn.disconnectSync();
console.log(`stage 5  after disconnect       rss=${rss()}MB threads=${threads()}`);

console.log('\n--- is there a server/port/daemon? ---');
console.log('  DuckDB is an embedded library: the database lives INSIDE this process.');
console.log('  No socket, no daemon, no separate process. Nothing to poll for readiness.');

console.log('\n--- where do extensions live, and can they be pre-seeded? ---');
const c2 = await (await api.DuckDBInstance.create(':memory:')).connect();
const home = await c2.runAndReadAll(`SELECT current_setting('extension_directory') AS d, current_setting('home_directory') AS h`);
console.log('  extension_directory setting:', JSON.stringify(home.getRows()[0]));
const inst2 = await api.DuckDBInstance.create(':memory:', { extension_directory: '/tmp/duckdb_ext' });
const c3 = await inst2.connect();
const t3 = Date.now();
await c3.run('INSTALL spatial'); await c3.run('LOAD spatial');
console.log(`  INSTALL+LOAD spatial into /tmp/duckdb_ext: ${Date.now()-t3}ms  (network download)`);
const t4 = Date.now();
const inst3 = await api.DuckDBInstance.create(':memory:', { extension_directory: '/tmp/duckdb_ext' });
const c4 = await inst3.connect();
await c4.run('INSTALL spatial'); await c4.run('LOAD spatial');
console.log(`  second process-local instance, same dir:   ${Date.now()-t4}ms  (cached, no download)`);
console.log('  => extensions are FILES on disk, installable once and reused. This IS a real pre-test step.');
