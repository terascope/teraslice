/**
 * Can the IP validations be emitted as SQL, and where exactly do `ip-utils` and `inet` disagree?
 *
 * The `inet` extension gives us `TRY_CAST(x AS INET)`, `<<=`, `host`, `network`, `broadcast` and
 * ordering - and nothing else (`docs/research/sql-function-coverage.md` §B). The question this
 * answers is not "does INET parse an IP" but "does it parse EXACTLY the strings `ip-utils` does",
 * because a validation that accepts one extra form silently changes every answer.
 *
 * Prints one row per divergence. An empty divergence list is what promotes a function.
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(
    '/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/package.json'
);
const { DuckDBInstance } = await import(pathToFileURL(require.resolve('@duckdb/node-api')).href);
const ipUtils = await import(
    pathToFileURL('/Users/jarednoble/Projects/terascope/teraslice/packages/ip-utils/dist/src/index.js').href
);

const inst = await DuckDBInstance.create(':memory:');
const conn = await inst.connect();

/** Every shape that could possibly disagree, not a sample of the easy ones. */
const BATTERY = [
    // plain IPv4
    '1.2.3.4', '0.0.0.0', '255.255.255.255', '8.8.8.8', '192.168.1.1', '10.0.0.1',
    '172.16.0.1', '127.0.0.1', '169.254.1.1', '100.64.0.1', '224.0.0.1', '240.0.0.1',
    '203.0.113.1', '198.51.100.1', '192.0.2.1', '198.18.0.1', '192.88.99.1', '192.0.0.1',
    // IPv4 near-misses and strictness
    '01.02.03.04', '010.1.1.1', '1.2.3.04', '256.1.1.1', '1.2.3', '1.2.3.4.5',
    '1.2.3.4 ', ' 1.2.3.4', '1.2.3.-4', '+1.2.3.4', '1.2.3.4/24', '1.2.3.4/32',
    '0x1.2.3.4', '1.2.3.4:80', '', 'not-an-ip', '1', '4294967295',
    // IPv6
    '::1', '::', 'fe80::1', '2001:db8::1', 'ff00::1', 'fc00::1', 'fd00::1',
    '2620:4f:8000::1', '2002::1', '64:ff9b::1', '100::1', '2001:4860:4860::8888',
    'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    '0:0:0:0:0:0:0:1', '2001:DB8::1', '2001:db8:0:0:0:0:0:1',
    // IPv6 mapped / compat / scope
    '::ffff:1.2.3.4', '::ffff:8.8.8.8', '::ffff:192.168.1.1', '::1.2.3.4', '::8.8.8.8',
    '::ffff:0102:0304', 'fe80::1%eth0', 'fe80::1%1', '2001:db8::1%0', 'fe80::1%',
    '::0.0.0.0', '::255.255.255.255', '::1.2.3.4%eth0', '::ffff:1.2.3.4%eth0',
    '%', '%eth0', '1.2.3.4%eth0', '::ffff:256.1.1.1', '::1.2.3',
    // IPv6 near-misses
    ':::1', '2001:db8::1::2', 'gggg::1', '2001:db8::1/64', '12345::1',
    '2001:db8:0:0:0:0:0:0:1', '1:2:3:4:5:6:7', null,
];

const sqlLit = (value) => `'${String(value).replace(/'/g, "''")}'`;

async function evaluate(expression, value) {
    if (value == null) return null;
    try {
        const reader = await conn.run(`SELECT ${expression.replaceAll('$v', sqlLit(value))}`);
        const rows = await reader.getRowsJson();
        return rows[0][0];
    } catch (err) {
        return `ERROR: ${String(err.message).split('\n')[0].slice(0, 70)}`;
    }
}

/**
 * `ip-utils` is stricter than `INET` in two documented ways, so both guards are part of every
 * candidate rather than an afterthought: a leading-zero octet is an IP to DuckDB and not to us,
 * and a `/prefix` is an INET and not an IP.
 */
const V4_STRICT = String.raw`regexp_matches($v, '^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$')`;
const NO_PREFIX = `NOT contains($v, '/')`;
const V6_SHAPE = `contains($v, ':')`;

/**
 * The address with any scope ID removed.
 *
 * `parseIPv6Int` truncates at the first `%` and keeps the scope only for rendering, so `fe80::1%eth0`
 * is a valid IPv6 address to us. `INET` has no scope concept at all and the cast simply fails, so the
 * scope has to be cut off before the cast rather than rejected - measured: three of the battery's
 * addresses were called invalid without this.
*/
const UNSCOPED = `regexp_replace($v, '%.*$', '')`;
const PARSES = `TRY_CAST(${UNSCOPED} AS INET) IS NOT NULL`;

const IS_IPV4 = `(${V4_STRICT})`;
const IS_IPV6 = `(${V6_SHAPE} AND ${NO_PREFIX} AND ${PARSES})`;
const IS_IP = `(${IS_IPV4} OR ${IS_IPV6})`;

/**
 * `NON_ROUTABLE_IPV4` from `ip-utils/src/utils/ip-address.ts`, as CIDRs.
 *
 * Copied rather than imported because the table is not exported, and a disjunction of `<<=` tests
 * against constants is exactly the form the coverage research said this classification would take.
*/
const NON_ROUTABLE_V4 = [
    '0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16',
    '172.16.0.0/12', '192.0.0.0/24', '192.0.2.0/24', '192.31.196.0/24', '192.52.193.0/24',
    '192.88.99.0/24', '192.168.0.0/16', '192.175.48.0/24', '198.18.0.0/15', '198.51.100.0/24',
    '203.0.113.0/24', '224.0.0.0/8', '240.0.0.0/4', '255.255.255.255/32',
];

/** `NON_ROUTABLE_IPV6`, same source, same reason. */
const NON_ROUTABLE_V6 = [
    '::/128', '::1/128', '64:ff9b::/96', '64:ff9b:1::/48', '100::/64', 'fc00::/7',
    'fe80::/10', 'ff00::/8', '::ffff:0:0/96', '2001::/23', '2001:db8::/32',
    '2002::/16', '2620:4f:8000::/48',
];

/**
 * A v4 CIDR lifted into both IPv4-in-IPv6 encodings.
 *
 * `isRoutable` classifies a MAPPED address by its embedded IPv4 - checked BEFORE the IPv6 table, so
 * `::ffff:8.8.8.8` is routable even though `::ffff:0:0/96` is itself listed as non-routable. Rather
 * than extract the low 32 bits, the v4 prefix is shifted by 96 and tested in both the `::ffff:`
 * space and the deprecated `::a.b.c.d` space, which is where those addresses actually live.
*/
function liftedV4(cidr) {
    const [base, prefix] = cidr.split('/');
    const shifted = Number(prefix) + 96;
    return [`::ffff:${base}/${shifted}`, `::${base}/${shifted}`];
}

const anyContains = (subject, cidrs) => `(${cidrs
    .map((cidr) => `${subject} <<= INET '${cidr}'`)
    .join(' OR ')})`;

const MAPPED = `(TRY_CAST(${UNSCOPED} AS INET) <<= INET '::ffff:0:0/96'`
    + String.raw` OR regexp_matches($v, '^::([0-9]+\.){3}[0-9]+(%.*)?$'))`;

const INET = `TRY_CAST(${UNSCOPED} AS INET)`;
const LIFTED = NON_ROUTABLE_V4.flatMap(liftedV4);

const IS_ROUTABLE = `CASE`
    + ` WHEN ${IS_IPV4} THEN NOT ${anyContains(INET, NON_ROUTABLE_V4)}`
    + ` WHEN ${IS_IPV6} AND ${MAPPED} THEN NOT ${anyContains(INET, LIFTED)}`
    + ` WHEN ${IS_IPV6} THEN NOT ${anyContains(INET, NON_ROUTABLE_V6)}`
    + ` ELSE false END`;

const CANDIDATES = [
    ['isIP', (v) => ipUtils.isIP(v), IS_IP],
    ['isIPv4', (v) => ipUtils.isIPv4(v), IS_IPV4],
    ['isIPv6', (v) => ipUtils.isIPv6(v), IS_IPV6],
    ['isCIDR', (v) => ipUtils.isCIDR(v), `(contains($v, '/') AND ${PARSES})`],
    [
        'isMappedIPv4',
        (v) => ipUtils.isMappedIPv4(v),
        `(${IS_IPV6} AND (TRY_CAST(${UNSCOPED} AS INET) <<= INET '::ffff:0:0/96'`
        + String.raw` OR regexp_matches($v, '^::([0-9]+\.){3}[0-9]+(%.*)?$')))`,
    ],
    ['isRoutableIP', (v) => ipUtils.isRoutableIP(v), IS_ROUTABLE],
    ['isNonRoutableIP', (v) => ipUtils.isNonRoutableIP(v), `(${IS_IP} AND NOT (${IS_ROUTABLE}))`],
];

/**
 * `inIPRange` with a `cidr`, which is the form a filter actually uses.
 *
 * The `min`/`max` form is NOT probed as promotable and must not be: `ip-utils` compares the raw
 * integers, so `::1` sits inside `0.0.0.0`-`255.255.255.255`, while `INET` ordering puts every IPv4
 * address before every IPv6 one and answers false. That is a real divergence, not a fixable one, so
 * the emission narrows to the `cidr` argument.
*/
const CIDR_CASES = ['10.0.0.0/8', '192.168.1.0/24', '0.0.0.0/0', '1.2.3.4/32',
    '2001:db8::/32', 'fe80::/10', '::/0', '::ffff:0:0/96'];

let failures = 0;
for (const cidr of CIDR_CASES) {
    const sql = `(${IS_IP} AND ${INET} <<= INET '${cidr}')`;
    const diverged = [];
    for (const value of BATTERY) {
        if (value == null) continue;
        const expected = ipUtils.inIPRange(value, { cidr });
        const actual = await evaluate(sql, value);
        if (expected !== actual) diverged.push([value, expected, actual]);
    }
    failures += diverged.length;
    console.log(`\ninIPRange cidr=${cidr}: ${diverged.length === 0 ? 'MATCHES' : `${diverged.length} divergences`}`);
    for (const [value, expected, actual] of diverged) {
        console.log(`  ${JSON.stringify(value).padEnd(34)} ip-utils=${String(expected).padEnd(8)} sql=${actual}`);
    }
}

for (const [name, js, sql] of CANDIDATES) {
    const diverged = [];
    for (const value of BATTERY) {
        const expected = value == null ? null : js(value);
        const actual = await evaluate(sql, value);
        if (value == null) continue;
        if (expected !== actual) diverged.push([value, expected, actual]);
    }
    failures += diverged.length;
    console.log(`\n${name}: ${diverged.length === 0 ? 'MATCHES over the whole battery' : `${diverged.length} divergences`}`);
    for (const [value, expected, actual] of diverged) {
        console.log(`  ${JSON.stringify(value).padEnd(34)} ip-utils=${String(expected).padEnd(8)} sql=${actual}`);
    }
}

console.log(`\n${failures} divergences total over ${BATTERY.length - 1} inputs`);
await conn.closeSync?.();
await inst.closeSync?.();
