import { TSError } from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import {
    getFirstIPInCIDR, getLastIPInCIDR, isCIDR, isIP
} from '@terascope/ip-utils';
import {
    GeoPoint, GeoShape, GeoShapeRelation,
    SQLDialect, SQLGeoPointColumn, SQLIPRangeBound,
    SQLSort, xLuceneFieldType
} from '@terascope/types';
import {
    parens, wholeNumber, quoteBoolean, quoteIdentifier,
    quoteLiteral, quoteNumber, toLiteralString, toUTCTimestampText
} from '../quoting.js';
import { isMatchAllWildcard, wildcardToLikePattern } from '../patterns.js';
import { inferFieldType, isTextFieldType } from '../field-types.js';
import { orderByTerms } from '../clauses.js';

const COMPARISON_OPERATORS = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
} as const;

/**
 * The projection when nothing may be returned.
 *
 * Elasticsearch answers this with hits whose `_source` is empty - the rows still exist and
 * still count - so the SQL has to be a valid projection that carries no data rather than an
 * error or a missing row.
*/
export const NOTHING_READABLE = 'NULL';

/** What an IPv4 address is prefixed with to become the IPv6 address Elasticsearch stores. */
const IPV4_MAPPED_PREFIX = '::ffff:';

/** The bits in front of the embedded address in an IPv4-mapped IPv6 address. */
const IPV4_MAPPED_PREFIX_BITS = 96;

const GEO_POINT_TYPES: readonly xLuceneFieldType[] = [
    xLuceneFieldType.GeoPoint,
    xLuceneFieldType.Geo,
];

/**
 * Everything both supported engines spell the same way.
 *
 * A dialect that extends this implements only what its engine actually does differently -
 * casting, regular expressions, IP containment and the spatial predicates - which is both
 * less code and a shorter list to check when a third engine is added.
*/
export abstract class BaseSQLDialect implements SQLDialect {
    abstract readonly name: string;

    quoteIdentifier(name: string): string {
        return quoteIdentifier(name);
    }

    abstract fieldRef(field: string): string;

    stringLiteral(value: string): string {
        return quoteLiteral(value);
    }

    literal(value: unknown, fieldType?: xLuceneFieldType): string {
        const type = fieldType ?? inferFieldType(value);

        if (type === xLuceneFieldType.Boolean) return quoteBoolean(value);
        if (
            type === xLuceneFieldType.Integer
            || type === xLuceneFieldType.Float
            || type === xLuceneFieldType.Number
        ) {
            return quoteNumber(value);
        }
        if (type === xLuceneFieldType.Date) return this.timestampLiteral(value);

        return this.stringLiteral(toLiteralString(value));
    }

    abstract geoPointParts(fieldExpr: string): SQLGeoPointColumn;

    /**
     * One column per readable path.
     *
     * Correct wherever a dotted field is one column, which is the flat case; an engine that
     * nests them overrides this so a partly-readable parent is rebuilt rather than dropped.
    */
    projection(readable: readonly string[], _all: readonly string[]): string {
        if (!readable.length) return NOTHING_READABLE;

        return readable.map((path) => this.fieldRef(path)).join(', ');
    }

    /**
     * `LIMIT`/`OFFSET`, which DuckDB and PostgreSQL spell the same way.
     *
     * Both numbers are checked rather than interpolated: they arrive from a caller's request
     * and go into the statement as digits, so this is the one place a number could carry SQL
     * if it were not a number.
    */
    limitOffset(size?: number, offset?: number): string {
        const parts: string[] = [];

        if (size != null) parts.push(`LIMIT ${wholeNumber(size, 'size')}`);
        if (offset != null) parts.push(`OFFSET ${wholeNumber(offset, 'from')}`);

        return parts.join(' ');
    }

    /**
     * The `ORDER BY` terms, direction and null placement both spelled out.
     *
     * Shared by every engine because `NULLS FIRST` / `NULLS LAST` is standard SQL that both
     * DuckDB and PostgreSQL accept. It is emitted ALWAYS rather than only when it differs
     * from the engine default, because the default it has to override is a different one in
     * each engine and none of them is `DataFrame`'s - see `defaultNullOrder`.
    */
    orderBy(sort?: readonly SQLSort[]): string {
        return orderByTerms(sort);
    }

    matchAll(): string {
        return 'TRUE';
    }

    matchNone(): string {
        return 'FALSE';
    }

    equals(fieldExpr: string, value: unknown, fieldType?: xLuceneFieldType): string {
        if (fieldType === xLuceneFieldType.IP) {
            return this.ipEquals(fieldExpr, this.validIP(value));
        }

        if (fieldType === xLuceneFieldType.IPRange) {
            return this.ipRangeContains(fieldExpr, this.validIP(value));
        }

        if (GEO_POINT_TYPES.includes(fieldType as xLuceneFieldType)) {
            return this.geoPointEquals(fieldExpr, parseGeoPoint(value));
        }

        return parens(`${fieldExpr} = ${this.literal(value, fieldType)}`);
    }

    compare(
        fieldExpr: string,
        operator: 'gt' | 'gte' | 'lt' | 'lte',
        value: unknown,
        fieldType?: xLuceneFieldType
    ): string {
        const op = COMPARISON_OPERATORS[operator];

        if (fieldType === xLuceneFieldType.IP) {
            return this.ipComparison(fieldExpr, op, this.validIP(value));
        }

        return parens(`${fieldExpr} ${op} ${this.literal(value, fieldType)}`);
    }

    wildcard(fieldExpr: string, value: string, fieldType?: xLuceneFieldType): string {
        // `field:*` asks only that the field have a value, and says nothing about what it is
        if (isMatchAllWildcard(value)) return this.exists(fieldExpr);

        const expr = isTextFieldType(fieldType) ? fieldExpr : this.toText(fieldExpr);
        const pattern = this.stringLiteral(wildcardToLikePattern(value));

        return parens(`${expr} LIKE ${pattern} ESCAPE '\\'`);
    }

    regexp(fieldExpr: string, value: string, fieldType?: xLuceneFieldType): string {
        const expr = isTextFieldType(fieldType) ? fieldExpr : this.toText(fieldExpr);
        return this.regexpMatch(expr, value);
    }

    exists(fieldExpr: string): string {
        return parens(`${fieldExpr} IS NOT NULL`);
    }

    /**
     * **`NOT` alone would answer differently from Elasticsearch, on the commonest data there
     * is: a missing field.**
     *
     * `must_not` matches a document whose field is absent, while SQL's three-valued logic
     * makes `NOT (col = 'x')` unknown when `col` is `NULL` and a `WHERE` clause drops an
     * unknown row. Forcing the unknown case to true restores the Elasticsearch answer, and
     * is why every translated negation carries a `COALESCE`.
    */
    not(expression: string): string {
        return `COALESCE(NOT ${parens(expression)}, TRUE)`;
    }

    and(expressions: string[]): string {
        return this.join(expressions, 'AND');
    }

    or(expressions: string[]): string {
        return this.join(expressions, 'OR');
    }

    /** Containment over the mapped form, which is where the lifted prefix earns its keep. */
    ipInCIDR(fieldExpr: string, cidr: string): string {
        return parens(
            `${this.mappedInet(fieldExpr)} <<= ${this.mappedInetLiteral(this.validCIDR(cidr))}`
        );
    }

    /** Equality over the mapped form, so `::ffff:8.8.8.8` and `8.8.8.8` are one address. */
    ipEquals(fieldExpr: string, address: string): string {
        return parens(
            `${this.mappedInet(fieldExpr)} = ${this.mappedInetLiteral(this.validIP(address))}`
        );
    }

    /**
     * An `ip_range` column matching a queried address or block.
     *
     * The column holds the BLOCK here and the query holds what has to be inside it, so the
     * containment runs the other way round from `ipInCIDR` - and it is the same question an
     * overlap asks, with the queried range collapsed to the one value. Expressing it that way
     * rather than with `<<=` is what lets a mapped IPv4 address find a block stored as IPv4:
     * **measured, `'::ffff:10.0.0.1'::INET <<= '10.0.0.0/30'::INET` is FALSE**, because the
     * two are different families, while their mapped endpoints compare as Elasticsearch's do.
    */
    ipRangeContains(fieldExpr: string, value: string): string {
        const address = this.validIP(value);
        const [first, last] = isCIDR(address)
            ? [getFirstIPInCIDR(address), getLastIPInCIDR(address)]
            : [address, address];

        return this.ipRangeIntersects(
            fieldExpr,
            { value: first, inclusive: true },
            { value: last, inclusive: true }
        );
    }

    /**
     * Two blocks overlap when each one starts at or before the other one ends.
     *
     * **An excluded bound moves the comparison rather than the value.** `{a TO b}` is every
     * address strictly between them, so it overlaps a stored block only if that block begins
     * strictly before `b` and ends strictly after `a` - which is the difference between
     * matching a block that merely touches the bound and not matching it.
    */
    ipRangeIntersects(
        fieldExpr: string, start?: SQLIPRangeBound, end?: SQLIPRangeBound
    ): string {
        const parts: string[] = [];

        if (end != null) {
            parts.push(
                `${this.blockStart(fieldExpr)} ${end.inclusive ? '<=' : '<'}`
                + ` ${this.mappedInetLiteral(this.validIP(end.value))}`
            );
        }
        if (start != null) {
            parts.push(
                `${this.blockEnd(fieldExpr)} ${start.inclusive ? '>=' : '>'}`
                + ` ${this.mappedInetLiteral(this.validIP(start.value))}`
            );
        }

        if (!parts.length) return this.exists(fieldExpr);

        return parens(parts.join(' AND '));
    }

    abstract toText(fieldExpr: string): string;

    abstract geoPointWithinDistance(
        fieldExpr: string, point: GeoPoint, metres: number
    ): string;

    abstract geoPointDistance(fieldExpr: string, point: GeoPoint): string;

    abstract geoPointInBoundingBox(
        fieldExpr: string, topLeft: GeoPoint, bottomRight: GeoPoint
    ): string;

    abstract geoRelation(
        fieldExpr: string,
        shape: GeoShape,
        relation: GeoShapeRelation,
        isPointColumn: boolean
    ): string;

    abstract geoContainsPoint(
        fieldExpr: string, point: GeoPoint, isPointColumn: boolean
    ): string;

    /** A `geo-point` column equal to one point, which is what a bare term on it means. */
    protected geoPointEquals(fieldExpr: string, point: GeoPoint): string {
        const { lat, lon } = this.geoPointParts(fieldExpr);
        return parens(`${lat} = ${quoteNumber(point.lat)} AND ${lon} = ${quoteNumber(point.lon)}`);
    }

    /** One side of a range on an `ip` field, compared as an address. */
    protected ipComparison(fieldExpr: string, operator: string, value: string): string {
        return parens(`${this.mappedInet(fieldExpr)} ${operator} ${this.mappedInetLiteral(value)}`);
    }

    /**
     * The column as an address COMPARABLE with any other address.
     *
     * **Comparing addresses raw would answer differently from Elasticsearch on mixed data.**
     * An `INET` orders by (family, address) in both supported engines, so EVERY IPv4 address
     * sorts before EVERY IPv6 one; Elasticsearch stores an `ip` as 128 bits with IPv4 mapped
     * into IPv6 and orders by the value. Measured on the mixed corpus in
     * `test/cases/ips.ts`, `ip:>="172.16.0.0"` differs by two records between the two.
     *
     * Mapping IPv4 into `::ffff:` form puts every value in one family, which makes the
     * engine's ordering the numeric one - and it is also what makes `::ffff:8.8.8.8` find a
     * stored `8.8.8.8`, as Elasticsearch does.
    */
    protected mappedInet(fieldExpr: string): string {
        return this.toInet(
            `CASE WHEN ${this.textContains(fieldExpr, ':')}`
            + ` THEN ${fieldExpr} ELSE '${IPV4_MAPPED_PREFIX}' || ${fieldExpr} END`
        );
    }

    /**
     * The same mapping for a literal.
     *
     * **A CIDR's prefix moves with it** - `8.8.8.0/24` becomes `::ffff:8.8.8.0/120`, because
     * the 96 bits in front of the embedded address are part of the prefix now. Getting this
     * wrong does not error; it silently widens or narrows the block.
    */
    protected mappedInetLiteral(value: string): string {
        if (value.includes(':')) return this.inetLiteral(value);

        const [address, prefix] = value.split('/');
        const mapped = prefix == null
            ? `${IPV4_MAPPED_PREFIX}${address}`
            : `${IPV4_MAPPED_PREFIX}${address}/${Number(prefix) + IPV4_MAPPED_PREFIX_BITS}`;

        return this.inetLiteral(mapped);
    }

    /**
     * The first and last addresses of the block an `ip_range` column holds.
     *
     * **`host` is not decoration** - measured, comparing a masked `INET` against a bare one
     * compares the masks too and answers `false` for a block that plainly overlaps. Taking
     * the address out of the block and mapping it leaves a value that compares against a
     * queried address the way Elasticsearch's 128-bit form does.
    */
    protected blockStart(fieldExpr: string): string {
        return this.mappedInet(`host(network(${this.toInet(fieldExpr)}))`);
    }

    protected blockEnd(fieldExpr: string): string {
        return this.mappedInet(`host(broadcast(${this.toInet(fieldExpr)}))`);
    }

    /** The column as an IP address value. */
    protected abstract toInet(fieldExpr: string): string;

    /** A literal IP address or CIDR block. */
    protected abstract inetLiteral(value: string): string;

    /** Whether a text expression contains a substring, which the engines spell differently. */
    protected abstract textContains(expr: string, substring: string): string;

    /** An anchored regular expression match against an already-textual expression. */
    protected abstract regexpMatch(expr: string, value: string): string;

    /** A literal timestamp, always UTC. */
    protected timestampLiteral(value: unknown): string {
        return `CAST(${this.stringLiteral(toUTCTimestampText(value))} AS TIMESTAMP)`;
    }

    protected join(expressions: string[], operator: 'AND' | 'OR'): string {
        if (!expressions.length) return this.matchAll();
        if (expressions.length === 1) return expressions[0];
        return parens(expressions.join(` ${operator} `));
    }

    /**
     * An address, checked here rather than left to the engine.
     *
     * A malformed address reaches the engine as a literal it cannot parse, and the error
     * that comes back names SQL the caller never wrote. Checking first keeps the message
     * about the query they did write.
    */
    protected validIP(value: unknown): string {
        const address = toLiteralString(value);
        if (!isIP(address) && !isCIDR(address)) {
            throw new TSError(`Expected ${address} to be a valid IP address or CIDR block`, {
                statusCode: 400,
                context: { safe: true }
            });
        }
        return address;
    }

    protected validCIDR(value: unknown): string {
        const cidr = toLiteralString(value);
        if (!isCIDR(cidr)) {
            throw new TSError(`Expected ${cidr} to be a valid CIDR block`, {
                statusCode: 400,
                context: { safe: true }
            });
        }
        return cidr;
    }
}
