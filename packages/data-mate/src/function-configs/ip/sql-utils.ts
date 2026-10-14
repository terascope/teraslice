/**
 * SQL forms of the IP functions, shared by the function configs in this directory.
 *
 * These need the `inet` extension, which is not statically linked into `@duckdb/node-api`. It
 * autoloads on first use by downloading from the DuckDB repository, so a host with no network
 * access and no installed copy gets a query error. `TealFrame` loads it when it opens.
 *
 * `test/teal-frame/sql-emission-spec.ts` checks each expression against `@terascope/ip-utils`.
 * Where the two would disagree, the guard that handles it says so.
*/

import { NON_ROUTABLE_IPV4_CIDRS, NON_ROUTABLE_IPV6_CIDRS } from '@terascope/ip-utils';

/**
 * The address with any scope ID removed, because `INET` has no scope ID and the cast fails.
 *
 * `parseIPv6Int` stops at the first `%` and keeps the scope only for display, so `fe80::1%eth0`
 * is a valid IPv6 address to data-mate.
*/
function unscoped(value: string): string {
    return `regexp_replace(${value}, '%.*$', '')`;
}

/** The value as an `INET`, or null. Any scope ID is stripped first. */
export function asInet(value: string): string {
    return `TRY_CAST(${unscoped(value)} AS INET)`;
}

/**
 * Dotted-quad IPv4, matched by regex rather than `TRY_CAST`.
 *
 * `INET` accepts more than data-mate does: `01.02.03.04` casts to `1.2.3.4`, while `IPV4_RE` in
 * `ip-utils` rejects leading zeros, and `1.2.3.4/24` casts as an address, while data-mate calls
 * it a CIDR. This regex is `IPV4_RE`, so it rejects both.
*/
export function isIPv4Sql(value: string): string {
    return `regexp_matches(${value},`
        + ' \'^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])'
        + '(\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$\')';
}

/**
 * IPv6: a successful cast, plus two checks the cast alone would miss.
 *
 * `IPAddress.isIPv6` requires a colon, and a `/prefix` makes the value a CIDR rather than an
 * address.
*/
export function isIPv6Sql(value: string): string {
    return `(contains(${value}, ':') AND NOT contains(${value}, '/')`
        + ` AND ${asInet(value)} IS NOT NULL)`;
}

/** Either family, as `IPAddress.isValid` accepts. */
export function isIPSql(value: string): string {
    return `(${isIPv4Sql(value)} OR ${isIPv6Sql(value)})`;
}

/** CIDR notation: a prefix is present and the value casts to `INET`. */
export function isCIDRSql(value: string): string {
    return `(contains(${value}, '/') AND ${asInet(value)} IS NOT NULL)`;
}

/**
 * An IPv4 address mapped into IPv6: `::ffff:a.b.c.d`, or the deprecated `::a.b.c.d`.
 *
 * The second form is matched on the text. `isMappedIPv4` returns true for `::0.0.0.0` and false
 * for `::`, which are the same 128 bits, because `ip-utils` matches `IPV4_COMPAT_RE` against the
 * input string. No containment test can tell them apart, and testing `::/96` would wrongly match
 * `::` and `::1`.
*/
export function isMappedIPv4Sql(value: string): string {
    return `(${isIPv6Sql(value)} AND (${asInet(value)} <<= INET '::ffff:0:0/96'`
        + ` OR regexp_matches(${value}, '^::([0-9]+\\.){3}[0-9]+(%.*)?$')))`;
}

/**
 * A v4 CIDR in both IPv4-in-IPv6 forms, with the prefix length increased by 96.
 *
 * `isRoutable` judges a mapped address by its embedded IPv4 before it checks the IPv6 table, so
 * `::ffff:8.8.8.8` is routable even though `::ffff:0:0/96` is listed as non-routable. Testing
 * against the lifted v4 ranges asks the same question without extracting the low 32 bits.
*/
function liftedV4(cidr: string): string[] {
    const [base, prefix] = cidr.split('/');
    const shifted = Number(prefix) + 96;
    return [`::ffff:${base}/${shifted}`, `::${base}/${shifted}`];
}

const LIFTED_NON_ROUTABLE_IPV4 = NON_ROUTABLE_IPV4_CIDRS.flatMap(liftedV4);

function inAny(subject: string, cidrs: readonly string[]): string {
    return `(${cidrs.map((cidr) => `${subject} <<= INET '${cidr}'`).join(' OR ')})`;
}

/**
 * Routability, as a set of containment tests.
 *
 * The `inet` extension has no `family()` and no reserved-range function. The three branches follow
 * `IPAddress.isRoutable` in order: IPv4 against the v4 table, a mapped address against the lifted
 * v4 table, and any other IPv6 against the v6 table. A value that is not an IP is not routable.
*/
export function isRoutableSql(value: string): string {
    const inet = asInet(value);
    return 'CASE'
        + ` WHEN ${isIPv4Sql(value)} THEN NOT ${inAny(inet, NON_ROUTABLE_IPV4_CIDRS)}`
        + ` WHEN ${isMappedIPv4Sql(value)} THEN NOT ${inAny(inet, LIFTED_NON_ROUTABLE_IPV4)}`
        + ` WHEN ${isIPv6Sql(value)} THEN NOT ${inAny(inet, NON_ROUTABLE_IPV6_CIDRS)}`
        + ' ELSE false END';
}

/**
 * ## How the IP transforms handle bad input
 *
 * A validation returns null for a bad value, but a transform throws, which aborts the whole query
 * as it does in `DataFrame`. SQL's `error()` would also abort, but with DuckDB's message instead of
 * the function's own.
 *
 * So these expressions never raise. Each one is
 * `CASE WHEN <native branch is exact> THEN <native> ELSE udf(x) END` with `needs_udf_fallback`.
 * DuckDB's `CASE` short-circuits, so the UDF runs only for values the native branch cannot handle,
 * and it throws the real JavaScript error. Every other value stays on the native path.
*/

/**
 * The network address of a CIDR block, as a bare `INET` with the prefix dropped.
 *
 * The prefix must go before any arithmetic. DuckDB refuses arithmetic that leaves the subnet:
 * `network('10.0.0.0/8'::INET) - 1` fails with `Out of Range Error`, and the first and last usable
 * addresses need exactly that step. On a bare address it is plain address arithmetic, as in
 * `IPAddress.offset`.
*/
export function cidrNetwork(value: string): string {
    return `host(network(${asInet(value)}))::INET`;
}

/** The broadcast address of a CIDR block, also as a bare `INET`. */
export function cidrBroadcast(value: string): string {
    return `host(broadcast(${asInet(value)}))::INET`;
}

/**
 * True when the block holds a single address.
 *
 * The ends are compared with `host(a) = host(b)` rather than `a = b`, because `INET` equality does
 * not return true for a `/32` whose two ends print the same.
*/
export function isSingleAddress(value: string): string {
    return `host(${cidrNetwork(value)}) = host(${cidrBroadcast(value)})`;
}

/**
 * True for a value whose result `host()` and `ip-utils` would print differently, so the UDF
 * handles it.
 *
 * `host()` prints an IPv4-mapped address with a dotted tail (`::ffff:0.0.0.0`), while
 * `intToIPv6String` prints `::ffff:0:0`. Other IPv6 blocks print the same on both paths, so only
 * the mapped range is excluded.
*/
export function isMappedResult(value: string): string {
    return `(contains(${value}, ':') AND ${asInet(value)} <<= INET '::ffff:0:0/96')`;
}

/**
 * True for the one block whose first usable address DuckDB cannot reach by addition.
 *
 * `INET '255.255.255.254' + 1` raises `Out of Range Error`. Subtracting from `255.255.255.255`
 * works and IPv6 has no such limit, so only the first usable address is affected.
*/
export function firstUsableHitsTopOfV4(value: string): string {
    return `host(${cidrNetwork(value)}) = '255.255.255.254'`;
}

/** An IPv4 CIDR, which is all `getCIDRNetwork` and `getCIDRBroadcast` accept. */
export function isIPv4CIDRSql(value: string): string {
    return `(${isCIDRSql(value)} AND NOT contains(${value}, ':'))`;
}

/**
 * An IPv4 address as its integer value.
 *
 * DuckDB has no `inet_aton` and no cast from `INET` to a number, so this weights the four dotted
 * parts. Each part is cast to `HUGEINT`.
*/
export function ipv4ToIntSql(value: string): string {
    const part = (n: number) => `CAST(string_split(${value}, '.')[${n}] AS HUGEINT)`;
    return `${part(1)} * 16777216 + ${part(2)} * 65536 + ${part(3)} * 256 + ${part(4)}`;
}

/** An integer as a dotted-quad IPv4 address: the exact inverse of `ipv4ToIntSql`. */
export function intToIPv4Sql(value: string): string {
    const octet = (expression: string) => `CAST(${expression} AS VARCHAR)`;
    return `${octet(`${value} // 16777216`)} || '.' || ${octet(`(${value} // 65536) % 256`)}`
        + ` || '.' || ${octet(`(${value} // 256) % 256`)} || '.' || ${octet(`${value} % 256`)}`;
}

/**
 * The input as a `HUGEINT` when it is a plain run of digits, otherwise null.
 *
 * The check is a digit regex, deliberately narrower than a cast. `intToIP` calls `BigInt(input)`,
 * and `BigInt` and `TRY_CAST(x AS HUGEINT)` disagree on several inputs: SQL accepts `'12.0'`,
 * `'12.5'`, `'1e3'` and `'1_000'` where `BigInt` throws, and `BigInt` accepts `'0x10'`, `'0b11'`
 * and `''` where the cast gives null. Both accept `^[0-9]+$`, so every disputed input keeps the
 * UDF.
*/
export function plainIntegerSql(value: string): string {
    return `CASE WHEN regexp_matches(${value}, '^[0-9]+$')`
        + ` THEN TRY_CAST(${value} AS HUGEINT) ELSE NULL END`;
}
