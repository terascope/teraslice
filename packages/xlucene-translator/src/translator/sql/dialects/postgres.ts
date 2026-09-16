import {
    GeoPoint, GeoShape, GeoShapeRelation,
    SQLGeoPointColumn, SQLDialectName
} from '@terascope/types';
import { parens, quoteIdentifier, quoteNumber } from '../helpers.js';
import { BaseSQLDialect } from './base.js';

const RELATION_FUNCTIONS: Readonly<Record<GeoShapeRelation, string>> = Object.freeze({
    [GeoShapeRelation.Intersects]: 'ST_Intersects',
    [GeoShapeRelation.Disjoint]: 'ST_Disjoint',
    [GeoShapeRelation.Within]: 'ST_Within',
    [GeoShapeRelation.Contains]: 'ST_Contains',
});

/** The SRID every coordinate here is in, and the one PostGIS geography casts require. */
const WGS84 = 4326;

/**
 * SQL for PostgreSQL with PostGIS.
 *
 * **Read the storage assumptions before using it** - PostgreSQL has no equivalent of
 * `data-types`' `toDuckDB`, so unlike the DuckDB dialect there is no single mapping this can
 * derive the column shapes from. What it assumes:
 *
 * | xLucene type | column |
 * |---|---|
 * | `geo-point`, `geo` | a PostGIS `geometry(Point, 4326)` |
 * | `geo-json` | text or `json`/`jsonb`, cast through `ST_GeomFromGeoJSON` |
 * | `ip`, `ip_range` | text, cast to `inet` |
 * | `date` | `timestamp` holding UTC |
 * | a dotted field | ONE column whose name contains a dot |
 *
 * A deployment that stores any of those differently subclasses this and overrides the two or
 * three methods concerned, which is what the dialect split is for.
 *
 * **It is emitted but not exercised.** The DuckDB dialect is verified by running its output
 * through DuckDB; there is no PostGIS in this repo's test services, so this one is covered by
 * its emitted SQL only.
*/
export class PostgresDialect extends BaseSQLDialect {
    readonly name = SQLDialectName.postgres;

    /**
     * A dotted xLucene field is ONE column name.
     *
     * Unquoted, `foo.bar` in PostgreSQL means column `bar` of table `foo`, which is a
     * different claim than the query made; and unlike DuckDB, quoting here pins the case, so
     * this matches a column created with that exact spelling.
    */
    fieldRef(field: string): string {
        return quoteIdentifier(field);
    }

    toText(fieldExpr: string): string {
        return `CAST(${fieldExpr} AS text)`;
    }

    geoPointParts(fieldExpr: string): SQLGeoPointColumn {
        return {
            lat: `ST_Y(${fieldExpr})`,
            lon: `ST_X(${fieldExpr})`,
        };
    }

    /** `geography` rather than `geometry`, so the distance comes back in metres. */
    geoPointDistance(fieldExpr: string, point: GeoPoint): string {
        return `ST_Distance(${this.asGeography(fieldExpr)}, ${this.pointGeography(point)})`;
    }

    /**
     * `ST_DWithin` rather than a comparison against `ST_Distance`, because it is the form
     * PostGIS can answer from a spatial index.
    */
    geoPointWithinDistance(fieldExpr: string, point: GeoPoint, metres: number): string {
        return parens(
            `ST_DWithin(${this.asGeography(fieldExpr)}, ${this.pointGeography(point)}, ${quoteNumber(metres)})`
        );
    }

    /** Arithmetic, for the same boundary-inclusiveness reason as the DuckDB dialect. */
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

        return parens(
            `${fn}(${this.asGeometry(fieldExpr, isPointColumn)}, ${this.constantGeometry(shape)})`
        );
    }

    /** Boundary-inclusive, matching Elasticsearch's `geo_shape` intersects relation. */
    geoContainsPoint(fieldExpr: string, point: GeoPoint, isPointColumn: boolean): string {
        return parens(
            `ST_Intersects(${this.asGeometry(fieldExpr, isPointColumn)}, ${this.pointGeometry(point)})`
        );
    }

    /**
     * **PostgreSQL has no `TRY_CAST`**, so a row whose text is not an address aborts the
     * query rather than failing the predicate. A column that can hold junk wants a
     * `CHECK` constraint or a real `inet` column, not a wider cast here.
    */
    protected toInet(fieldExpr: string): string {
        return `CAST(${fieldExpr} AS inet)`;
    }

    protected inetLiteral(value: string): string {
        return `CAST(${this.stringLiteral(value)} AS inet)`;
    }

    /**
     * `~` is a SEARCH, not a full match, so the pattern is anchored to match Elasticsearch's
     * `regexp` query. The non-capturing group keeps an alternation inside the pattern from
     * escaping the anchors - `a|b` anchored bare would mean `^a` or `b$`.
    */
    protected regexpMatch(expr: string, value: string): string {
        return parens(`${expr} ~ ${this.stringLiteral(`^(?:${value})$`)}`);
    }

    private asGeometry(fieldExpr: string, isPointColumn: boolean): string {
        if (isPointColumn) return fieldExpr;
        return `ST_GeomFromGeoJSON(${this.toText(fieldExpr)})`;
    }

    private asGeography(fieldExpr: string): string {
        return `CAST(${fieldExpr} AS geography)`;
    }

    private pointGeometry(point: GeoPoint): string {
        return `ST_SetSRID(ST_MakePoint(${quoteNumber(point.lon)}, ${quoteNumber(point.lat)}), ${WGS84})`;
    }

    private pointGeography(point: GeoPoint): string {
        return `CAST(${this.pointGeometry(point)} AS geography)`;
    }

    private constantGeometry(shape: GeoShape): string {
        return `ST_SetSRID(ST_GeomFromGeoJSON(${this.stringLiteral(JSON.stringify(shape))}), ${WGS84})`;
    }
}
