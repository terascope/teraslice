import { FieldType } from '@terascope/types';
import { toGeoJSON } from '@terascope/geo-utils';
import { DataTypeFieldAndChildren } from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';

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

/**
 * ## The geo predicates run as SQL because SQL is the more correct of the two
 *
 * These emissions do NOT reproduce `geo-utils` exactly, and that is the accepted decision.
 * `geoContainsFP` splits each shape into shell polygons and hole polygons and asks
 * `booleanIntersects(queryPolygon, holePolygon)` - which is boundary-inclusive - so a shape that
 * merely TOUCHES a hole's edge is treated as being INSIDE the hole and reported as not contained.
 * `ST_Contains` applies OGC semantics and answers true, which is geometrically right.
 *
 * Measured over the full matrix in `docs/tools/probe/geo-predicates.mjs`: `geoIntersects` and
 * `geoDisjoint` agree on all 324 pairs; `geoContains` diverges on 1 of 256, `geoWithin` on its
 * mirror, `geoRelation` on 3 of 324 - every one of them a hole-touching case. The exact inputs and
 * the `geo-utils` code responsible are in `docs/known-defects.md` DF8, for the turf/geo-utils
 * ticket.
 *
 * **Requires the `spatial` extension**, which does NOT autoload - see `docs/HANDOFF.md`.
*/

/**
 * The column as a spatial `GEOMETRY`.
 *
 * A `GeoJSON` column is `JSON`, which `ST_GeomFromGeoJSON` takes as text; a `GeoPoint` column is
 * `STRUCT(lat, lon)`, which becomes a point. **`ST_Point` takes (x, y) - so LON first**, matching
 * `makeCoordinatesFromGeoPoint`, which returns `[point.lon, point.lat]`.
*/
export function asGeometry(value: string, inputConfig: DataTypeFieldAndChildren): string {
    if (isGeoPointColumn(inputConfig)) {
        return `ST_Point(${pointPart(value, 'lon')}, ${pointPart(value, 'lat')})`;
    }
    return `ST_GeomFromGeoJSON(${value}::VARCHAR)`;
}

/** A constant geo argument as a `GEOMETRY`, resolved at plan time. */
export function constantGeometry(value: unknown): string {
    const shape = toGeoJSON(value);
    if (shape == null) return 'NULL';
    return `ST_GeomFromGeoJSON(${sqlLiteral(JSON.stringify(shape))})`;
}

/** True when the argument resolves to a shape the emission can build. */
export function isGeoArg(value: unknown): boolean {
    return toGeoJSON(value) != null;
}

/**
 * A spatial predicate, wrapped so an unparseable shape nulls the row instead of killing the query.
 *
 * **`ST_GeomFromGeoJSON` THROWS on a non-canonical `type` spelling** - measured,
 * `{"type":"POINT","coordinates":[10,20]}` is `Invalid Input Error: GeoJSON input has invalid type
 * field`, and coercion into a `GeoJSON` column lets that spelling through (it normalises `'point'`
 * to `'Point'` but leaves `'POINT'` alone). On the JavaScript side `toGeoJSON` cannot map it either
 * and the predicate returns `false`.
 *
 * For a VALIDATION those two are the same observable result: the projection is
 * `CASE WHEN pred THEN col ELSE NULL END`, and `false` and `NULL` both null the row. So `try` is
 * not papering over a difference - it is the expression that makes the two paths agree.
*/
export function tryPredicate(expression: string): string {
    return `try(${expression})`;
}

/** A column the geo predicates can turn into a geometry. */
export function isGeoColumn(inputConfig: DataTypeFieldAndChildren | undefined): boolean {
    return isGeoJSONColumn(inputConfig) || isGeoPointColumn(inputConfig);
}

/** `GeoShapeRelation` to its `ST_*` counterpart. */
const RELATION_FUNCTIONS: Record<string, string> = {
    intersects: 'ST_Intersects',
    disjoint: 'ST_Disjoint',
    within: 'ST_Within',
    contains: 'ST_Contains',
};

export function relationFunction(relation: unknown): string | null {
    return RELATION_FUNCTIONS[String(relation)] ?? null;
}

/**
 * `GEO_DISTANCE_UNITS`' canonical units in METRES, for `ST_Distance_Sphere`.
 *
 * Taken from turf's own unit factors so a `110km` range means the same number of metres on both
 * sides. `parseGeoDistance` has already mapped every alias (`mi`, `NM`, `yd`, ...) onto these.
*/
const METRES_PER_UNIT: Record<string, number> = {
    millimeters: 0.001,
    centimeters: 0.01,
    inch: 0.0254,
    feet: 0.3048,
    yards: 0.9144,
    meters: 1,
    kilometers: 1000,
    miles: 1609.344,
    nauticalmiles: 1852,
    radians: 6371008.8,
    degrees: 111194.92664455873,
};

/**
 * A range in metres, or null when the unit has no exact factor here.
 *
 * **This is where the emission stops reproducing `geoPointWithinRange` and starts being correct.**
 * `makeGeoCircle` builds a turf CIRCLE POLYGON - 64 sides by default - and runs point-in-polygon
 * against it, so it under-approximates the circle: measured, for a `1000km` range a point whose
 * true distance is 998,867 m is reported OUT of range. The band is about
 * `r * (1 - cos(pi/64))`, ~1.2 km at 1000 km. A true distance test has no such band.
*/
export function rangeInMetres(distance: unknown, unit: unknown): number | null {
    const factor = METRES_PER_UNIT[String(unit)];
    if (factor == null || !Number.isFinite(Number(distance))) return null;
    return Number(distance) * factor;
}

/**
 * **`ST_Distance_Sphere` takes (LATITUDE, LONGITUDE), not (lon, lat).**
 *
 * Documented and confirmed: "The input is expected to be in WGS84 (EPSG:4326) coordinates, using a
 * [latitude, longitude] axis order." That is the opposite of `ST_Point`'s (x, y) order used by
 * `asGeometry`, and getting it backwards yields a plausible wrong number rather than an error -
 * which is exactly the trap `docs/HANDOFF.md` lists.
*/
export function distanceSphere(
    value: string,
    centre: { lat: number; lon: number }
): string {
    return `ST_Distance_Sphere(ST_Point(${pointPart(value, 'lat')}, ${pointPart(value, 'lon')}),`
        + ` ST_Point(${centre.lat}, ${centre.lon}))`;
}
