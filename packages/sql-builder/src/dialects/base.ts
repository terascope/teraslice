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
 * The projection used when no field may be returned.
 *
 * Elasticsearch still returns and counts the hits, just with an empty `_source`, so the SQL
 * needs a valid projection that carries no data rather than an error or no rows.
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
 * The SQL that every supported engine writes the same way.
 *
 * A dialect that extends this implements only what its engine does differently: casting,
 * regular expressions, IP helpers and the spatial predicates.
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
     * This is correct when a dotted field is a single flat column. An engine that stores
     * dotted fields as nested structs overrides it, so a partly readable parent is rebuilt
     * rather than dropped.
    */
    projection(readable: readonly string[], _all: readonly string[]): string {
        if (!readable.length) return NOTHING_READABLE;

        return readable.map((path) => this.fieldRef(path)).join(', ');
    }

    /**
     * `LIMIT`/`OFFSET`, which DuckDB and PostgreSQL write the same way.
     *
     * Both numbers come from the request and are written into the statement, so they are
     * validated as non-negative integers to prevent SQL injection.
    */
    limitOffset(size?: number, offset?: number): string {
        const parts: string[] = [];

        if (size != null) parts.push(`LIMIT ${wholeNumber(size, 'size')}`);
        if (offset != null) parts.push(`OFFSET ${wholeNumber(offset, 'from')}`);

        return parts.join(' ');
    }

    /**
     * The `ORDER BY` terms, with direction and null placement both written out.
     *
     * `NULLS FIRST` / `NULLS LAST` is standard SQL, so this is shared. It is always written
     * because no engine's default matches DataFrame's null order (see `defaultNullOrder`).
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
     * Negate an expression so a missing field matches, as in Elasticsearch.
     *
     * Elasticsearch's `must_not` matches a document whose field is absent. In SQL,
     * `NOT (col = 'x')` is NULL when `col` is NULL, and `WHERE` drops that row, so the
     * `COALESCE` turns the NULL into TRUE.
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

    /** CIDR containment, comparing both sides in IPv4-mapped IPv6 form (see `mappedInet`). */
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
     * An `ip_range` column containing a queried address or block.
     *
     * Here the column holds the block and the query holds the address, the reverse of
     * `ipInCIDR`. It is written as an overlap check against the block's endpoints rather than
     * with `<<=`, because `<<=` returns false across address families
     * (`'::ffff:10.0.0.1'::INET <<= '10.0.0.0/30'::INET` is FALSE), while the mapped
     * endpoints compare the way Elasticsearch does.
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
     * An exclusive bound changes the operator, not the value: `{a TO b}` overlaps a stored
     * block only if the block starts before `b` and ends after `a`, so a block that only
     * touches a bound does not match.
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
        fieldExpr: string, point: GeoPoint, meters: number
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
     * The column as an address that compares correctly with any other address.
     *
     * Both engines order `INET` by family first, so every IPv4 address sorts before every
     * IPv6 one. Elasticsearch stores every `ip` as 128 bits with IPv4 mapped into IPv6 and
     * orders numerically. Mapping IPv4 values into `::ffff:` form puts everything in one
     * family, so ranges compare numerically and `::ffff:8.8.8.8` matches a stored `8.8.8.8`,
     * as in Elasticsearch.
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
     * A CIDR prefix length grows by 96 bits with the mapping, so `8.8.8.0/24` becomes
     * `::ffff:8.8.8.0/120`.
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
     * `host()` strips the mask. Comparing a masked `INET` with a bare one also compares the
     * masks, which gives the wrong answer for overlapping blocks.
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

    /** Whether a text expression contains a substring; the engines write this differently. */
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
     * Validate an IP address or CIDR block before it reaches the engine.
     *
     * Otherwise the engine's parse error would refer to generated SQL the caller never wrote.
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
