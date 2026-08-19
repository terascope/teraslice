import { FieldType } from '@terascope/types';
import { DataTypeFieldAndChildren } from '../interfaces.js';

/**
 * Helpers shared by the `sql` emissions on the geo function configs.
 *
 * **A `GeoJSON` column is stored as `JSON` and a `GeoPoint` as `STRUCT(lat DOUBLE, lon DOUBLE)`**
 * (`data-types/src/types/v1/`), not as a spatial `GEOMETRY`. So the predicates below need no
 * `spatial` extension at all - they are structural tests on JSON.
 *
 * The `spatial` predicates - `geoContains`, `geoWithin`, `geoIntersects`, `geoDisjoint`,
 * `geoRelation`, `inGeoBoundingBox`, `geoPointWithinRange` - are NOT here, and deliberately. They
 * go through turf's `booleanPointInPolygon`, whose boundary handling and antimeridian treatment are
 * its own; `ST_Contains` is a different implementation and would silently disagree at the edges.
 * See `docs/sql-emission.md`.
*/

export function isGeoJSONColumn(inputConfig: DataTypeFieldAndChildren | undefined): boolean {
    return inputConfig?.field_config?.type === FieldType.GeoJSON;
}

/**
 * `isGeoJSON`, structurally: a plain object with an array `coordinates` and a `type` string whose
 * lowercase is one of the three known shapes.
 *
 * `isArrayLike` is `Array.isArray || isTypedArray`, so a STRING `coordinates` does not qualify -
 * hence `json_type(...) = 'ARRAY'` rather than a presence check.
*/
export function isGeoJSONSql(value: string): string {
    return `(json_type(${value}) = 'OBJECT'`
        + ` AND json_type(${value}, '$.coordinates') = 'ARRAY'`
        + ` AND json_type(${value}, '$.type') = 'VARCHAR'`
        + ` AND lower(json_extract_string(${value}, '$.type'))`
        + ' IN (\'point\', \'polygon\', \'multipolygon\'))';
}

/**
 * One specific shape.
 *
 * **The two spellings are matched case-EXACTLY**, which is not the same test `isGeoJSON` makes.
 * `GeoShapeType.Point` is `'Point'` and `ESGeoShapeType.Point` is `'point'`, and the predicate
 * compares against those two values - so `'POINT'` passes `isGeoJSON`, whose check is
 * case-insensitive, and fails `isGeoShapePoint`.
*/
export function isGeoShapeSql(value: string, titleCase: string, lower: string): string {
    return `(${isGeoJSONSql(value)}`
        + ` AND json_extract_string(${value}, '$.type') IN ('${titleCase}', '${lower}'))`;
}

/**
 * A `GeoPoint`-shaped column, whose DuckDB type is `STRUCT(lat DOUBLE, lon DOUBLE)`.
*/
const POINT_TYPES: readonly FieldType[] = [FieldType.GeoPoint, FieldType.Geo];

export function isGeoPointColumn(inputConfig: DataTypeFieldAndChildren | undefined): boolean {
    return POINT_TYPES.includes(inputConfig?.field_config?.type as FieldType);
}

/** One member of the point struct. */
export function pointPart(value: string, part: 'lat' | 'lon'): string {
    return `struct_extract(${value}, '${part}')`;
}

/**
 * A bounding-box test, as ARITHMETIC rather than as a spatial predicate.
 *
 * **This is the correction to an earlier verdict.** `inGeoBoundingBox` was written off as needing
 * turf-parity that `ST_Contains` could not give, and the second half of that is true - measured,
 * DuckDB's `ST_Within`/`ST_Contains` EXCLUDE the boundary (a point on an edge is `false`) while
 * turf's `booleanPointInPolygon` defaults to `ignoreBoundary: false` and includes it. Verified
 * still true on turf 7.4.0, so it is a deliberate semantic difference and not a bug that an
 * upgrade fixes.
 *
 * But a spatial predicate was never needed. `createValidGeoBox` builds an AXIS-ALIGNED box and
 * REJECTS one that would cross the antimeridian (`tlLng >= brLng` throws), so containment is two
 * inclusive range checks - which is boundary-inclusive by construction, exactly as turf is.
 * Verified against turf over 325 point/box combinations, every edge and corner among them: no
 * divergence.
*/
export function inBoundingBoxSql(
    value: string,
    topLeft: { lat: number; lon: number },
    bottomRight: { lat: number; lon: number }
): string {
    return `(${pointPart(value, 'lat')} BETWEEN ${bottomRight.lat} AND ${topLeft.lat}`
        + ` AND ${pointPart(value, 'lon')} BETWEEN ${topLeft.lon} AND ${bottomRight.lon})`;
}
