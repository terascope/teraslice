/**
 * The IP TRANSFORMS, which throw where the validations return null - so the question is not only
 * "does SQL compute the same value" but "for exactly which inputs does it compute one at all".
 *
 * The contract (HANDOFF, FAILURE CONTRACT) is that a throwing transform aborts the query, as it
 * does in `DataFrame`. The emission therefore takes the shape
 * `CASE WHEN <valid> THEN <native> ELSE udf(x) END`: verified here, DuckDB's `CASE` short-circuits,
 * so the UDF is called only for the values the native branch cannot serve - and it then throws the
 * real JavaScript message rather than a DuckDB approximation of it.
 *
 * This probe checks the NATIVE branch against `ip-utils` for every input where `ip-utils` succeeds.
 * Parity on the throwing inputs is automatic, because both paths are the same UDF.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(
    '/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/package.json'
);
const { DuckDBInstance } = await import(pathToFileURL(require.resolve('@duckdb/node-api')).href);
const ip = await import(
    pathToFileURL('/Users/jarednoble/Projects/terascope/teraslice/packages/ip-utils/dist/src/index.js').href
);

const conn = await (await DuckDBInstance.create(':memory:')).connect();
const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;

async function evaluate(expression, value) {
    try {
        const reader = await conn.run(`SELECT ${expression.replaceAll('$v', lit(value))}`);
        return (await reader.getRowsJson())[0][0];
    } catch (err) {
        return `ERROR: ${String(err.message).split('\n')[0].slice(0, 60)}`;
    }
}

const CIDRS = [
    '10.0.0.0/8', '192.168.1.0/24', '192.168.1.5/24', '1.2.3.4/32', '0.0.0.0/0',
    '255.255.255.254/31', '172.16.0.0/12', '203.0.113.0/26',
    '2001:db8::/32', 'fe80::/10', '::/0', '2001:db8::1/128', '::ffff:0:0/96',
    '2001:db8:abcd:1234::/64',
];
const IPS = [
    '1.2.3.4', '8.8.8.8', '0.0.0.0', '255.255.255.255', '192.168.1.1',
    '::1', '2001:db8::1', 'fe80::1', '::ffff:1.2.3.4', '::ffff:8.8.8.8',
];

const INET = 'TRY_CAST($v AS INET)';
/**
 * The network and broadcast addresses as BARE INETs, prefix stripped.
 *
 * Measured: `network('10.0.0.0/8'::INET) - 1` raises `Out of Range Error: Cannot add -1 to
 * 10.255.255.255/8` - DuckDB refuses arithmetic that would leave the subnet, which is exactly what
 * `firstUsable`/`lastUsable` do. Going through `host()` drops the prefix and the arithmetic is then
 * plain address arithmetic, as `IPAddress.offset` is.
*/
const NET = `host(network(${INET}))::INET`;
const BCAST = `host(broadcast(${INET}))::INET`;
const IS_V4 = "NOT contains($v, ':')";
// INET equality did not answer true for a /32 where the two addresses print the same, so compare
// what they print
const SINGLE = `host(${NET}) = host(${BCAST})`;
/**
 * An IPv4-MAPPED result, which the two renderers spell differently.
 *
 * `host()` gives `::ffff:0.0.0.0` where `intToIPv6String` gives `::ffff:0:0` - a dotted tail versus
 * a hex one. Every other IPv6 block agreed, so only the mapped range is excluded.
*/
const MAPPED = `(contains($v, ':') AND ${INET} <<= INET '::ffff:0:0/96')`;
/**
 * The one address DuckDB will not produce by addition.
 *
 * Measured: `INET '255.255.255.254' + 1` is `Out of Range Error: Cannot add 1 to
 * 255.255.255.254`, while `- 1` from the same address is fine and IPv6 has no such limit. So a
 * block whose first usable address would be the all-ones broadcast keeps the UDF.
*/
const TOP_OF_V4 = `host(${NET}) = '255.255.255.254'`;

const CASES = [
    ['getFirstIpInCIDR', CIDRS, (v) => ip.getFirstIPInCIDR(v),
        `CASE WHEN ${MAPPED} THEN 'UDF' ELSE host(${NET}) END`],
    ['getLastIpInCIDR', CIDRS, (v) => ip.getLastIPInCIDR(v),
        `CASE WHEN ${MAPPED} THEN 'UDF' ELSE host(${BCAST}) END`],
    [
        'getFirstUsableIPInCIDR', CIDRS, (v) => ip.getFirstUsableIPInCIDR(v),
        `CASE WHEN ${MAPPED} OR ${TOP_OF_V4} THEN 'UDF' WHEN ${SINGLE} THEN host(${NET})`
        + ` ELSE host(${NET} + 1) END`,
    ],
    [
        'getLastUsableIPInCIDR', CIDRS, (v) => ip.getLastUsableIPInCIDR(v),
        `CASE WHEN ${MAPPED} THEN 'UDF' WHEN ${SINGLE} THEN host(${BCAST})`
        + ` WHEN ${IS_V4} THEN host(${BCAST} - 1) ELSE host(${BCAST}) END`,
    ],
    // IPv4 only - the implementation throws for a v6 block, so the guard is part of the answer
    [
        'getCIDRNetwork', CIDRS.filter((c) => !c.includes(':')),
        (v) => ip.getCIDRNetwork(v), `host(${NET})`,
    ],
    [
        'getCIDRBroadcast', CIDRS.filter((c) => !c.includes(':')),
        (v) => ip.getCIDRBroadcast(v), `host(${BCAST})`,
    ],
    ['reverseIP (v4)', IPS.filter((v) => !v.includes(':')), (v) => ip.reverseIP(v),
        "array_to_string(list_reverse(string_split($v, '.')), '.')"],
    ['toCIDR', IPS, (v) => ip.toCIDR(v, v.includes(':') ? 64 : 24),
        `host(network(($v || '/' || (CASE WHEN contains($v, ':') THEN 64 ELSE 24 END))::INET))`
        + ` || '/' || (CASE WHEN contains($v, ':') THEN 64 ELSE 24 END)`],
    ['extractMappedIPv4', ['::ffff:1.2.3.4', '::ffff:8.8.8.8', '::1.2.3.4'],
        (v) => ip.extractMappedIPv4(v), `regexp_replace(host(${INET}), '^::(ffff:)?', '')`],
];

let total = 0;
for (const [name, battery, js, sql] of CASES) {
    const diverged = [];
    for (const value of battery) {
        let expected;
        try { expected = js(value); } catch (err) { expected = 'THROWS'; }
        // 'UDF' marks an input the emission deliberately hands back - parity there is automatic
        if (await evaluate(sql, value) === 'UDF') continue;
        const actual = await evaluate(sql, value);
        if (expected !== actual) diverged.push([value, expected, actual]);
    }
    total += diverged.length;
    console.log(`\n${name}: ${diverged.length ? `${diverged.length} divergences` : 'MATCHES'}`);
    for (const [v, e, a] of diverged) {
        console.log(`  ${v.padEnd(26)} js=${String(e).padEnd(26)} sql=${a}`);
    }
}
console.log(`\n${total} divergences total`);
