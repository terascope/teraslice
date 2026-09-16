import { TSError } from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import { isCIDR, isIP } from '@terascope/ip-utils';
import {
    GeoPoint, GeoShape, GeoShapeRelation,
    SQLDialect, SQLGeoPointColumn, xLuceneFieldType
} from '@terascope/types';
import {
    inferFieldType, isTextFieldType, parens, wholeNumber,
    quoteBoolean, quoteIdentifier, quoteLiteral,
    quoteNumber, isMatchAllWildcard, toLiteralString,
    toUTCTimestampText, wildcardToLikePattern
} from '../helpers.js';

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

    ipInCIDR(fieldExpr: string, cidr: string): string {
        return parens(`${this.toInet(fieldExpr)} <<= ${this.inetLiteral(this.validCIDR(cidr))}`);
    }

    ipEquals(fieldExpr: string, address: string): string {
        return parens(`${this.toInet(fieldExpr)} = ${this.inetLiteral(this.validIP(address))}`);
    }

    /**
     * The column holds the BLOCK and the query holds the address, so the containment runs the
     * other way round from `ipInCIDR`.
    */
    ipRangeContains(fieldExpr: string, address: string): string {
        return parens(`${this.inetLiteral(this.validIP(address))} <<= ${this.toInet(fieldExpr)}`);
    }

    /**
     * Two blocks overlap when each one starts at or before the other one ends.
     *
     * The stored block's ends are its network and broadcast addresses. **They have to go
     * back through a cast to strip the mask** - measured, comparing a masked `INET` against a
     * bare one compares the masks too and answers `false` for a block that plainly overlaps.
    */
    ipRangeIntersects(fieldExpr: string, start?: string, end?: string): string {
        const column = this.toInet(fieldExpr);
        const parts: string[] = [];

        if (end != null) {
            parts.push(`${this.toInet(`host(network(${column}))`)} <= ${this.inetLiteral(this.validIP(end))}`);
        }
        if (start != null) {
            parts.push(`${this.toInet(`host(broadcast(${column}))`)} >= ${this.inetLiteral(this.validIP(start))}`);
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
        return parens(`${this.toInet(fieldExpr)} ${operator} ${this.inetLiteral(value)}`);
    }

    /** The column as an IP address value. */
    protected abstract toInet(fieldExpr: string): string;

    /** A literal IP address or CIDR block. */
    protected abstract inetLiteral(value: string): string;

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
