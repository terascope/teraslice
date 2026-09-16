import {
    GeoPoint, GeoShape, GeoShapeRelation,
    SQLGeoPointColumn, SQLDialectName
} from '@terascope/types';
import { uniq } from '@terascope/core-utils';
import { parens, quoteIdentifier, quoteNumber } from '../helpers.js';
import { BaseSQLDialect, NOTHING_READABLE } from './base.js';

/**
 * `GeoShapeRelation` to the spatial predicate that answers it.
 *
 * The relation describes the DOCUMENT's shape against the QUERY's shape, and the arguments
 * are emitted in that order, so `within` is `ST_Within(column, query)` and `contains` is its
 * mirror.
*/
/** The bits in front of the embedded address in an IPv4-mapped IPv6 address. */
const IPV4_MAPPED_PREFIX_BITS = 96;

const RELATION_FUNCTIONS: Readonly<Record<GeoShapeRelation, string>> = Object.freeze({
    [GeoShapeRelation.Intersects]: 'ST_Intersects',
    [GeoShapeRelation.Disjoint]: 'ST_Disjoint',
    [GeoShapeRelation.Within]: 'ST_Within',
    [GeoShapeRelation.Contains]: 'ST_Contains',
});

/**
 * SQL for DuckDB, which is the engine this was built for.
 *
 * **What it assumes about storage**, all of it from `@terascope/data-types`' `toDuckDB`:
 *
 * | xLucene type | DuckDB column |
 * |---|---|
 * | `geo-point`, `geo` | `STRUCT(lat DOUBLE, lon DOUBLE)` |
 * | `geo-json` | `JSON` |
 * | `ip`, `ip_range` | `VARCHAR` |
 * | `date` | `TIMESTAMP` |
 *
 * **Two extensions are needed and NEITHER is statically linked.** `inet` autoloads on first
 * use, so an IP query works on its own; `spatial` does NOT, and a geo query without it fails
 * with `Catalog Error: Scalar Function with name "st_within" is not in the catalog`. Load it
 * at bootstrap - `LOAD spatial` - rather than discovering it mid-query.
*/
export class DuckDBDialect extends BaseSQLDialect {
    readonly name = SQLDialectName.duckdb;

    /**
     * A dotted xLucene field is a STRUCT path.
     *
     * `toDuckDB` regroups dotted DataType paths into nested `STRUCT`s, so the column for
     * `foo.bar` is `bar` inside `foo` rather than a column named `foo.bar`.
     *
     * Quoting every part is safe here in a way it is not everywhere: **DuckDB treats a
     * quoted identifier case-INsensitively** - verified, `SELECT "mixedcase"` finds a column
     * declared `"MixedCase"` - which is the opposite of PostgreSQL, where quoting pins the
     * case.
    */
    fieldRef(field: string): string {
        return field.split('.').map(quoteIdentifier)
            .join('.');
    }

    toText(fieldExpr: string): string {
        return `CAST(${fieldExpr} AS VARCHAR)`;
    }

    /**
     * The `SELECT` list, **rebuilding any column only part of which may be read.**
     *
     * A dotted field is a `STRUCT` member here, not a column, so dropping `nested.name`
     * cannot be done by leaving a column out - the column is `nested`, and leaving it out
     * would withhold its siblings too while selecting it would leak the excluded member.
     * `struct_pack` puts back exactly the members that survived, which is the shape
     * Elasticsearch's `_source` filtering returns.
    */
    projection(readable: readonly string[], all: readonly string[]): string {
        if (!readable.length) return NOTHING_READABLE;

        const columns = uniq(all.map(topLevel)).filter(
            (column) => readable.some((path) => topLevel(path) === column)
        );

        return columns.map((column) => {
            const ref = this.fieldRef(column);
            const kept = under(readable, column);
            const every = under(all, column);

            if (sameFields(kept, every)) return ref;

            return `${this.structFor(ref, kept, every)} AS ${quoteIdentifier(column)}`;
        }).join(', ');
    }

    geoPointParts(fieldExpr: string): SQLGeoPointColumn {
        return {
            lat: `struct_extract(${fieldExpr}, 'lat')`,
            lon: `struct_extract(${fieldExpr}, 'lon')`,
        };
    }

    /**
     * **`ST_Distance_Sphere` takes (LATITUDE, LONGITUDE)** - documented as a
     * "[latitude, longitude] axis order" - which is the OPPOSITE of `ST_Point`'s (x, y)
     * order used everywhere else here. Getting it backwards yields a plausible wrong number
     * rather than an error.
    */
    geoPointDistance(fieldExpr: string, point: GeoPoint): string {
        const { lat, lon } = this.geoPointParts(fieldExpr);
        return `ST_Distance_Sphere(ST_Point(${lat}, ${lon}),`
            + ` ST_Point(${quoteNumber(point.lat)}, ${quoteNumber(point.lon)}))`;
    }

    geoPointWithinDistance(fieldExpr: string, point: GeoPoint, metres: number): string {
        return parens(`${this.geoPointDistance(fieldExpr, point)} <= ${quoteNumber(metres)}`);
    }

    /**
     * A bounding box as two inclusive range checks, which needs no `spatial` extension.
     *
     * A spatial predicate would also be WRONG here: measured, DuckDB's `ST_Within` and
     * `ST_Contains` EXCLUDE the boundary, while a `geoBox` includes it.
    */
    geoPointInBoundingBox(
        fieldExpr: string, topLeft: GeoPoint, bottomRight: GeoPoint
    ): string {
        const { lat, lon } = this.geoPointParts(fieldExpr);
        return parens(
            `${lat} BETWEEN ${quoteNumber(bottomRight.lat)} AND ${quoteNumber(topLeft.lat)}`
            + ` AND ${lon} BETWEEN ${quoteNumber(topLeft.lon)} AND ${quoteNumber(bottomRight.lon)}`
        );
    }

    geoRelation(
        fieldExpr: string,
        shape: GeoShape,
        relation: GeoShapeRelation,
        isPointColumn: boolean
    ): string {
        const fn = RELATION_FUNCTIONS[relation];

        if (fn == null) {
            throw new TypeError(`Unsupported geo relation "${relation}"`);
        }

        return this.tryPredicate(
            `${fn}(${this.asGeometry(fieldExpr, isPointColumn)}, ${this.constantGeometry(shape)})`
        );
    }

    /**
     * **`ST_Intersects`, not `ST_Contains`, and deliberately.**
     *
     * Both Elasticsearch's `geo_shape` with an `intersects` relation and `geoContainsFP`'s
     * turf call include the boundary, so a point sitting on a polygon's edge is contained.
     * DuckDB's `ST_Contains` applies OGC semantics and excludes it, which would answer
     * differently for exactly those points.
    */
    geoContainsPoint(fieldExpr: string, point: GeoPoint, isPointColumn: boolean): string {
        return this.tryPredicate(
            `ST_Intersects(${this.asGeometry(fieldExpr, isPointColumn)}, ${this.pointGeometry(point)})`
        );
    }

    /**
     * **Comparing addresses raw would answer differently from Elasticsearch on mixed data.**
     *
     * DuckDB's `INET` orders by (family, address), so EVERY IPv4 address sorts before EVERY
     * IPv6 one; Elasticsearch stores an `ip` as 128 bits with IPv4 mapped into IPv6 and
     * orders by the value. Measured on the mixed corpus in `test/sql/duckdb-ip-spec.ts`,
     * `ip:>="192.168.2.0"` differs by four records between the two.
     *
     * Mapping IPv4 into `::ffff:` form puts every value in one family, which makes DuckDB's
     * ordering the numeric one - and it is also what makes `::ffff:8.8.8.8` find a stored
     * `8.8.8.8`, as Elasticsearch does.
    */
    private mappedInet(fieldExpr: string): string {
        return `TRY_CAST(CASE WHEN contains(${fieldExpr}, ':')`
            + ` THEN ${fieldExpr} ELSE '::ffff:' || ${fieldExpr} END AS INET)`;
    }

    /**
     * The same mapping for a literal.
     *
     * **A CIDR's prefix moves with it** - `8.8.8.0/24` becomes `::ffff:8.8.8.0/120`, because
     * the 96 bits in front of the embedded address are part of the prefix now. Getting this
     * wrong does not error; it silently widens or narrows the block.
    */
    private mappedInetLiteral(value: string): string {
        if (value.includes(':')) return this.inetLiteral(value);

        const [address, prefix] = value.split('/');
        const mapped = prefix == null
            ? `::ffff:${address}`
            : `::ffff:${address}/${Number(prefix) + IPV4_MAPPED_PREFIX_BITS}`;

        return this.inetLiteral(mapped);
    }

    /**
     * **`IS TRUE` is a fold barrier, not decoration.**
     *
     * DuckDB rewrites a conjunction of two comparisons on the same expression into a
     * `BETWEEN`, and `INET` does not support one: measured, `ip >= INET 'a' AND ip <= INET
     * 'b'` fails outright with `Invalid Type [INET]: Invalid type for BETWEEN`, and so does
     * every arrangement of the same two comparisons - swapped operands, an explicit
     * `BETWEEN`, even `NOT (ip > b)`. Wrapping each side stops the rewrite recognising the
     * pair.
     *
     * It also costs nothing semantically: the comparison is `NULL` exactly when the column
     * is, `IS TRUE` turns that into `FALSE`, and a `WHERE` clause drops both alike.
    */
    protected ipComparison(fieldExpr: string, operator: string, value: string): string {
        const column = this.mappedInet(fieldExpr);
        return parens(`(${column} ${operator} ${this.mappedInetLiteral(value)}) IS TRUE`);
    }

    /** Equality over the mapped form, so `::ffff:8.8.8.8` and `8.8.8.8` are one address. */
    ipEquals(fieldExpr: string, address: string): string {
        return parens(
            `${this.mappedInet(fieldExpr)} = ${this.mappedInetLiteral(this.validIP(address))}`
        );
    }

    /** Containment over the mapped form, which is where the lifted prefix earns its keep. */
    ipInCIDR(fieldExpr: string, cidr: string): string {
        return parens(
            `${this.mappedInet(fieldExpr)} <<= ${this.mappedInetLiteral(this.validCIDR(cidr))}`
        );
    }

    protected toInet(fieldExpr: string): string {
        return `TRY_CAST(${fieldExpr} AS INET)`;
    }

    protected inetLiteral(value: string): string {
        return `INET ${this.stringLiteral(value)}`;
    }

    /**
     * `regexp_full_match` rather than `regexp_matches`, because Elasticsearch's `regexp`
     * query is anchored: `bar:/h.*o/` matches `hello` and not `xhellox`.
    */
    protected regexpMatch(expr: string, value: string): string {
        return `regexp_full_match(${expr}, ${this.stringLiteral(value)})`;
    }

    /** The column as a spatial `GEOMETRY`. **`ST_Point` takes (x, y), so LON comes first.** */
    private asGeometry(fieldExpr: string, isPointColumn: boolean): string {
        if (isPointColumn) {
            const { lat, lon } = this.geoPointParts(fieldExpr);
            return `ST_Point(${lon}, ${lat})`;
        }
        return `ST_GeomFromGeoJSON(CAST(${fieldExpr} AS VARCHAR))`;
    }

    /**
     * A `STRUCT` holding only the readable members, to whatever depth they nest.
     *
     * A member whose own subtree survived intact is taken whole; one that did not is rebuilt
     * the same way, so an exclusion three levels down costs only the structs above it.
    */
    private structFor(
        expression: string, kept: readonly string[], every: readonly string[]
    ): string {
        const members = uniq(every.map(topLevel)).filter(
            (member) => kept.some((path) => topLevel(path) === member)
        );

        const packed = members.map((member) => {
            const ref = `${expression}.${quoteIdentifier(member)}`;
            const memberKept = under(kept, member);
            const memberEvery = under(every, member);
            const value = sameFields(memberKept, memberEvery)
                ? ref
                : this.structFor(ref, memberKept, memberEvery);

            return `${quoteIdentifier(member)} := ${value}`;
        });

        return `struct_pack(${packed.join(', ')})`;
    }

    private pointGeometry(point: GeoPoint): string {
        return `ST_Point(${quoteNumber(point.lon)}, ${quoteNumber(point.lat)})`;
    }

    private constantGeometry(shape: GeoShape): string {
        return `ST_GeomFromGeoJSON(${this.stringLiteral(JSON.stringify(shape))})`;
    }

    /**
     * A spatial predicate wrapped so a shape the engine cannot parse fails the row rather
     * than the query.
     *
     * **`ST_GeomFromGeoJSON` THROWS on a non-canonical `type` spelling** - measured,
     * `{"type":"POINT",...}` is `Invalid Input Error: GeoJSON input has invalid type field` -
     * and a stored document can carry that spelling. `try` turns it into `NULL`, which a
     * `WHERE` clause drops, which is the same observable result as not matching.
     *
     * It does not hide a missing `spatial` extension: that is a binder error, raised before
     * anything is evaluated.
    */
    private tryPredicate(expression: string): string {
        return `try(${expression})`;
    }
}

/** The column a field path belongs to. */
function topLevel(path: string): string {
    return path.split('.', 1)[0];
}

/**
 * The paths beneath one segment, with that segment removed.
 *
 * A path equal to the segment is the segment itself rather than something under it, and it
 * becomes an empty entry - which is what marks a leaf, and keeps `sameFields` able to tell
 * "the whole of this" from "part of this".
*/
function under(paths: readonly string[], segment: string): string[] {
    return paths
        .filter((path) => topLevel(path) === segment)
        .map((path) => path.slice(segment.length + 1));
}

function sameFields(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((path) => b.includes(path));
}
