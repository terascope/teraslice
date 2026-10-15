import {
    GeoPoint, GeoShape, GeoShapeRelation,
    SQLGeoPointColumn, SQLDialectName, xLuceneFieldType
} from '@terascope/types';
import { uniq } from '@terascope/core-utils';
import {
    parens, quoteIdentifier, quoteNumber, toEpochMillisText
} from '../quoting.js';
import { BaseSQLDialect, NOTHING_READABLE } from './base.js';

/**
 * Maps each `GeoShapeRelation` to its spatial predicate.
 *
 * The relation describes the document's shape relative to the query's shape, and the
 * arguments are written in that order: `within` is `ST_Within(column, query)`.
*/
const RELATION_FUNCTIONS: Readonly<Record<GeoShapeRelation, string>> = Object.freeze({
    [GeoShapeRelation.Intersects]: 'ST_Intersects',
    [GeoShapeRelation.Disjoint]: 'ST_Disjoint',
    [GeoShapeRelation.Within]: 'ST_Within',
    [GeoShapeRelation.Contains]: 'ST_Contains',
});

/**
 * The DuckDB dialect.
 *
 * It assumes the column types that `@terascope/data-types`' `toDuckDB` produces:
 *
 * | xLucene type | DuckDB column |
 * |---|---|
 * | `geo-point`, `geo` | `STRUCT(lat DOUBLE, lon DOUBLE)` |
 * | `geo-json` | `GEOMETRY` |
 * | `ip`, `ip_range` | `VARCHAR` |
 * | `date` | `STRUCT(ms BIGINT, tz_offset SMALLINT)` - compared on `ms` |
 *
 * IP queries need the `inet` extension, which autoloads on first use. Geo queries need the
 * `spatial` extension, which does not autoload; run `LOAD spatial` at startup, or a geo query
 * fails with `Scalar Function with name "st_within" is not in the catalog`.
*/
export class DuckDBDialect extends BaseSQLDialect {
    readonly name = SQLDialectName.duckdb;

    /**
     * A dotted xLucene field is a STRUCT path.
     *
     * `toDuckDB` stores dotted DataType paths as nested `STRUCT`s, so `foo.bar` is member
     * `bar` of column `foo`. Quoting each part is safe because DuckDB matches quoted
     * identifiers case-insensitively (unlike PostgreSQL).
    */
    fieldRef(field: string): string {
        return field.split('.').map(quoteIdentifier)
            .join('.');
    }

    toText(fieldExpr: string): string {
        return `CAST(${fieldExpr} AS VARCHAR)`;
    }

    /**
     * A date column is `STRUCT(ms, tz_offset)`, so it is compared on `ms` (epoch
     * milliseconds). An integer comparison also lets Parquet min/max statistics skip row groups.
    */
    equals(fieldExpr: string, value: unknown, fieldType?: xLuceneFieldType): string {
        if (fieldType === xLuceneFieldType.Date) {
            return parens(`${fieldExpr}.ms = ${toEpochMillisText(value)}`);
        }
        return super.equals(fieldExpr, value, fieldType);
    }

    compare(
        fieldExpr: string,
        operator: 'gt' | 'gte' | 'lt' | 'lte',
        value: unknown,
        fieldType?: xLuceneFieldType
    ): string {
        if (fieldType === xLuceneFieldType.Date) {
            return super.compare(
                `${fieldExpr}.ms`, operator, Number(toEpochMillisText(value)), xLuceneFieldType.Integer
            );
        }
        return super.compare(fieldExpr, operator, value, fieldType);
    }

    /**
     * The `SELECT` list, rebuilding any column that is only partly readable.
     *
     * A dotted field is a `STRUCT` member, not a column. To exclude `nested.name` the
     * `nested` column is rebuilt with `struct_pack` from its readable members only, which
     * matches the shape Elasticsearch's `_source` filtering returns.
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
     * Distance in meters. `ST_Distance_Sphere` expects points in (latitude, longitude)
     * order, the reverse of the (x, y) order used elsewhere in this file. Swapping them
     * returns a wrong distance rather than an error.
    */
    geoPointDistance(fieldExpr: string, point: GeoPoint): string {
        const { lat, lon } = this.geoPointParts(fieldExpr);
        return `ST_Distance_Sphere(ST_Point(${lat}, ${lon}),`
            + ` ST_Point(${quoteNumber(point.lat)}, ${quoteNumber(point.lon)}))`;
    }

    geoPointWithinDistance(fieldExpr: string, point: GeoPoint, meters: number): string {
        return parens(`${this.geoPointDistance(fieldExpr, point)} <= ${quoteNumber(meters)}`);
    }

    /**
     * A bounding box as two inclusive range checks, which needs no `spatial` extension.
     *
     * `ST_Within` and `ST_Contains` exclude the boundary, while `geoBox` includes it.
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
     * Uses `ST_Intersects` rather than `ST_Contains` so that a point on a polygon's edge
     * matches. Elasticsearch's `intersects` relation and `geoContainsFP` both include the
     * boundary; DuckDB's `ST_Contains` excludes it.
    */
    geoContainsPoint(fieldExpr: string, point: GeoPoint, isPointColumn: boolean): string {
        return this.tryPredicate(
            `ST_Intersects(${this.asGeometry(fieldExpr, isPointColumn)}, ${this.pointGeometry(point)})`
        );
    }

    /**
     * One side of an IP range comparison, wrapped in `IS TRUE`.
     *
     * DuckDB's optimizer rewrites `ip >= a AND ip <= b` into `ip BETWEEN a AND b`, and
     * `BETWEEN` does not support `INET`, so the query fails with
     * `Invalid type for BETWEEN`. Wrapping each comparison in `IS TRUE` prevents that rewrite.
     * It does not change the result: a NULL comparison becomes FALSE, and `WHERE` drops
     * both the same way.
     *
     * `ip_range` queries do not need this, because they compare two different expressions
     * (the block's first and last address).
    */
    protected ipComparison(fieldExpr: string, operator: string, value: string): string {
        const column = this.mappedInet(fieldExpr);
        return parens(`(${column} ${operator} ${this.mappedInetLiteral(value)}) IS TRUE`);
    }

    protected toInet(fieldExpr: string): string {
        return `TRY_CAST(${fieldExpr} AS INET)`;
    }

    protected inetLiteral(value: string): string {
        return `INET ${this.stringLiteral(value)}`;
    }

    protected textContains(expr: string, substring: string): string {
        return `contains(${expr}, ${this.stringLiteral(substring)})`;
    }

    /**
     * `regexp_full_match` rather than `regexp_matches`, because Elasticsearch's `regexp`
     * query is anchored: `bar:/h.*o/` matches `hello` and not `xhellox`.
    */
    protected regexpMatch(expr: string, value: string): string {
        return `regexp_full_match(${expr}, ${this.stringLiteral(value)})`;
    }

    /**
     * The column as a spatial `GEOMETRY`. A `geo-json` column is already a `GEOMETRY` and is
     * used as-is. A `geo-point` is a `STRUCT(lat, lon)`; `ST_Point` takes (x, y), so the
     * longitude comes first.
    */
    private asGeometry(fieldExpr: string, isPointColumn: boolean): string {
        if (isPointColumn) {
            const { lat, lon } = this.geoPointParts(fieldExpr);
            return `ST_Point(${lon}, ${lat})`;
        }
        return fieldExpr;
    }

    /**
     * A `STRUCT` holding only the readable members, at any depth.
     *
     * A member that is fully readable is copied whole; a partly readable one is rebuilt
     * recursively.
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
     * A spatial predicate wrapped in `try`, so a shape the engine cannot parse fails that
     * row rather than the whole query.
     *
     * `ST_GeomFromGeoJSON` throws on a non-standard `type` spelling such as `"POINT"`.
     * `try` turns the error into NULL, which `WHERE` treats as no match. A missing `spatial`
     * extension still fails the query, because that error is raised before evaluation.
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
 * A path equal to the segment becomes an empty string. That entry marks a leaf, so
 * `sameFields` can tell the whole member from part of it.
*/
function under(paths: readonly string[], segment: string): string[] {
    return paths
        .filter((path) => topLevel(path) === segment)
        .map((path) => path.slice(segment.length + 1));
}

function sameFields(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((path) => b.includes(path));
}
