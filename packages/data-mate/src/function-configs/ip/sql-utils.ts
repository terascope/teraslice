/**
 * The SQL forms of the IP predicates, shared by the `sql` emissions in this directory.
 *
 * **These require the `inet` extension, which is NOT statically linked into `@duckdb/node-api`.**
 * It autoloads on first use, which means a download from the DuckDB repository unless it is already
 * in the extension directory - so a worker image without it, and without network, gets a query
 * error rather than a slow path. See `docs/sql-emission.md`.
 *
 * Every expression here was differenced against `@terascope/ip-utils` over a 78-input battery by
 * `docs/tools/probe/ip-semantics.mjs`, and `test/duck-frame/sql-emission-spec.ts` is the gate. The
 * three places the two disagree, and what each guard does about it, are stated on the guard itself.
*/

/**
 * The address with any scope ID removed, because `INET` has no scope concept and the cast fails.
 *
 * `parseIPv6Int` truncates at the first `%` and keeps the scope only for rendering, so
 * `fe80::1%eth0` is a valid IPv6 address to data-mate. Measured: without this, three battery
 * addresses were called invalid by SQL and valid by `ip-utils`.
*/
function unscoped(value: string): string {
    return `regexp_replace(${value}, '%.*$', '')`;
}

/** The value as an `INET`, or null - scope stripped first. */
export function asInet(value: string): string {
    return `TRY_CAST(${unscoped(value)} AS INET)`;
}

/**
 * Dotted-quad IPv4, by regex rather than by `TRY_CAST`.
 *
 * **`INET` is more permissive than data-mate and the difference is silent.** `01.02.03.04` casts
 * happily to `1.2.3.4`, where `IPV4_RE` in `ip-utils` rejects a leading zero outright; `1.2.3.4/24`
 * casts as a prefixed address where data-mate calls it a CIDR and not an IP. This is `IPV4_RE`
 * itself, so both are excluded by construction rather than by a pair of extra tests.
*/
export function isIPv4Sql(value: string): string {
    return `regexp_matches(${value},`
        + ' \'^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])'
        + '(\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$\')';
}

/**
 * IPv6, which is the cast plus the two things it would otherwise let through.
 *
 * `IPAddress.isIPv6` requires a colon before it parses anything, and a `/prefix` is a CIDR rather
 * than an address, so both are excluded before the cast is consulted.
*/
export function isIPv6Sql(value: string): string {
    return `(contains(${value}, ':') AND NOT contains(${value}, '/')`
        + ` AND ${asInet(value)} IS NOT NULL)`;
}

/** Either family - `IPAddress.isValid` is the union of the two parsers. */
export function isIPSql(value: string): string {
    return `(${isIPv4Sql(value)} OR ${isIPv6Sql(value)})`;
}

/** CIDR notation, which is the presence of a prefix plus a cast that survives it. */
export function isCIDRSql(value: string): string {
    return `(contains(${value}, '/') AND ${asInet(value)} IS NOT NULL)`;
}

/**
 * An IPv4 address mapped into IPv6 - `::ffff:a.b.c.d`, and the deprecated `::a.b.c.d`.
 *
 * **The second form is textual, not numeric, and that is not a shortcut.** `isMappedIPv4` returns
 * true for `::0.0.0.0` and false for `::`, which are the same 128 bits, because `ip-utils` records
 * how the value was WRITTEN (`IPV4_COMPAT_RE`, matched against the input string). No containment
 * test can distinguish them, so the regex is the only faithful form. Testing `::/96` instead - the
 * obvious emission - wrongly claims `::` and `::1`.
*/
export function isMappedIPv4Sql(value: string): string {
    return `(${isIPv6Sql(value)} AND (${asInet(value)} <<= INET '::ffff:0:0/96'`
        + ` OR regexp_matches(${value}, '^::([0-9]+\\.){3}[0-9]+(%.*)?$')))`;
}

/**
 * `NON_ROUTABLE_IPV4` from `ip-utils/src/utils/ip-address.ts`, in CIDR notation.
 *
 * Duplicated rather than imported because the table is not exported. It is the classification that
 * has to match, and the gate compares the two paths over every address in the battery, so a drift
 * in either table fails there rather than in production. Keep the two in step.
*/
const NON_ROUTABLE_V4 = [
    '0.0.0.0/8',
    '10.0.0.0/8',
    '100.64.0.0/10',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '192.31.196.0/24',
    '192.52.193.0/24',
    '192.88.99.0/24',
    '192.168.0.0/16',
    '192.175.48.0/24',
    '198.18.0.0/15',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/8',
    '240.0.0.0/4',
    '255.255.255.255/32',
] as const;

/** `NON_ROUTABLE_IPV6`, same source, same reason. */
const NON_ROUTABLE_V6 = [
    '::/128',
    '::1/128',
    '64:ff9b::/96',
    '64:ff9b:1::/48',
    '100::/64',
    'fc00::/7',
    'fe80::/10',
    'ff00::/8',
    '::ffff:0:0/96',
    '2001::/23',
    '2001:db8::/32',
    '2002::/16',
    '2620:4f:8000::/48',
] as const;

/**
 * A v4 CIDR in both IPv4-in-IPv6 encodings, prefix shifted by the 96 bits in front of it.
 *
 * `isRoutable` classifies a MAPPED address by its EMBEDDED IPv4, and does so **before** consulting
 * the IPv6 table - so `::ffff:8.8.8.8` is routable even though `::ffff:0:0/96` is itself listed as
 * non-routable, and an emission that checked the IPv6 table first would invert that answer. Lifting
 * the v4 prefixes is how the same question gets asked without extracting the low 32 bits.
*/
function liftedV4(cidr: string): string[] {
    const [base, prefix] = cidr.split('/');
    const shifted = Number(prefix) + 96;
    return [`::ffff:${base}/${shifted}`, `::${base}/${shifted}`];
}

function inAny(subject: string, cidrs: readonly string[]): string {
    return `(${cidrs.map((cidr) => `${subject} <<= INET '${cidr}'`).join(' OR ')})`;
}

/**
 * Routability, as the disjunction of containment tests the coverage research predicted.
 *
 * There is no `family()` and no reserved-range predicate in the extension, so the classification is
 * built rather than called. The three arms follow `IPAddress.isRoutable` exactly, in its order:
 * IPv4 against the v4 table, a mapped address against the lifted v4 table, everything else against
 * the v6 table. A value that is not an IP at all is not routable.
*/
export function isRoutableSql(value: string): string {
    const inet = asInet(value);
    return 'CASE'
        + ` WHEN ${isIPv4Sql(value)} THEN NOT ${inAny(inet, NON_ROUTABLE_V4)}`
        + ` WHEN ${isMappedIPv4Sql(value)} THEN NOT ${inAny(inet, NON_ROUTABLE_V4.flatMap(liftedV4))}`
        + ` WHEN ${isIPv6Sql(value)} THEN NOT ${inAny(inet, NON_ROUTABLE_V6)}`
        + ' ELSE false END';
}
