import { FieldType } from '@terascope/types';
import { toGeoJSON } from '@terascope/geo-utils';
import { DataTypeFieldAndChildren } from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';

/**
 * Helpers for the SQL expressions of the geo function configs.
 *
 * A `GeoJSON` column is stored as a `GEOMETRY` and a `GeoPoint` column as
 * `STRUCT(lat DOUBLE, lon DOUBLE)` (see `data-types/src/types/v1/`). Shapes are parsed once at
 * ingest, so these helpers read the stored value rather than parsing it again.
*/

export function isGeoJSONColumn(inputConfig: DataTypeFieldAndChildren | undefined): boolean {
    return inputConfig?.field_config?.type === FieldType.GeoJSON;
}

/** The three shapes a `GeoShape` can be, as `ST_GeometryType` names them. */
const GEO_SHAPE_TYPES = ['POINT', 'POLYGON', 'MULTIPOLYGON'] as const;

/**
 * `isGeoJSON` on a `GeoJSON` column: the stored geometry is one of the three shapes.
 *
 * Ingest only accepts those three (`geoShapeToWKB` rejects anything else), so this is true for
 * every non-null value. Reading the type instead of assuming it costs nothing.
*/
export function isGeoJSONSql(value: string): string {
    return `(ST_GeometryType(${value}) IN (${GEO_SHAPE_TYPES.map((t) => `'${t}'`).join(', ')}))`;
}

/**
 * True when the stored geometry is the given shape.
 *
 * This intentionally differs from `DataFrame`. `isGeoShapePoint` compares the stored `type`
 * string exactly against `'Point'` and `'point'`, and `DataFrame` keeps whatever spelling arrived,
 * so `{ type: 'POINT' }` is not a point there. A `GEOMETRY` stores the shape rather than the
 * spelling, so this reports that value as a point. `sql-emission-spec.ts` lists it as a known
 * difference.
*/
export function isGeoShapeSql(value: string, shape: typeof GEO_SHAPE_TYPES[number]): string {
    return `(ST_GeometryType(${value}) = '${shape}')`;
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
 * A bounding-box test as two inclusive range checks rather than a spatial predicate.
 *
 * DuckDB's `ST_Within` and `ST_Contains` exclude the boundary, while turf's
 * `booleanPointInPolygon` (used by `inGeoBoundingBox`) includes it, so a spatial predicate would
 * disagree for a point on an edge. None is needed: `createValidGeoBox` builds only axis-aligned
 * boxes and rejects one that crosses the antimeridian, so containment is a latitude range and a
 * longitude range, both inclusive like turf.
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
 * ## Spatial predicates
 *
 * `geoContains`, `geoWithin`, `geoIntersects`, `geoDisjoint` and `geoRelation` run as `ST_*`
 * functions, which need the `spatial` extension. It does not autoload; `TealFrame` loads it when
 * it opens.
 *
 * These do not always match `geo-utils`. `geoContainsFP` splits each shape into shell and hole
 * polygons and tests the query shape against each hole with `booleanIntersects`, which includes
 * the boundary. A shape that only touches a hole's edge is therefore treated as inside the hole
 * and reported as not contained. `ST_Contains` follows the OGC rules and reports it as contained,
 * which is geometrically correct.
 *
 * `geoIntersects` and `geoDisjoint` give the same answers on both paths. `geoContains`,
 * `geoWithin` and `geoRelation` differ only in these hole-edge cases.
*/

/**
 * The column as a `GEOMETRY`.
 *
 * A `GeoJSON` column already is one. A `GeoPoint` column becomes a point. `ST_Point` takes
 * (x, y), so longitude comes first, matching `makeCoordinatesFromGeoPoint`.
*/
export function asGeometry(value: string, inputConfig: DataTypeFieldAndChildren): string {
    if (isGeoPointColumn(inputConfig)) {
        return `ST_Point(${pointPart(value, 'lon')}, ${pointPart(value, 'lat')})`;
    }
    return value;
}

/** A constant geo argument as a `GEOMETRY`, resolved at plan time. */
export function constantGeometry(value: unknown): string {
    const shape = toGeoJSON(value);
    if (shape == null) return 'NULL';
    return `ST_GeomFromGeoJSON(${sqlLiteral(JSON.stringify(shape))})`;
}

/** True when the argument resolves to a shape that `constantGeometry` can build. */
export function isGeoArg(value: unknown): boolean {
    return toGeoJSON(value) != null;
}

/**
 * Wraps a spatial predicate in `try()` so an unparseable shape gives null instead of failing the
 * query.
 *
 * `ST_GeomFromGeoJSON` throws on a non-canonical `type` spelling such as
 * `{"type":"POINT","coordinates":[10,20]}`, and a `GeoJSON` column can hold that spelling
 * (coercion normalizes `'point'` to `'Point'` but leaves `'POINT'`). In JavaScript, `toGeoJSON`
 * cannot map it either and the predicate returns `false`. A validation nulls the row for both
 * `false` and null, so `try()` makes the two paths agree.
*/
export function tryPredicate(expression: string): string {
    return `try(${expression})`;
}

/** A column the geo predicates can turn into a geometry. */
export function isGeoColumn(inputConfig: DataTypeFieldAndChildren | undefined): boolean {
    return isGeoJSONColumn(inputConfig) || isGeoPointColumn(inputConfig);
}

/**
 * True for a column that holds one value per row. The `FULL_VALUES` predicates receive the whole
 * value, which on an array column is a `GEOMETRY[]` that no `ST_*` function accepts. They decline
 * it, and the UDF handles the list as `DataFrame` does.
*/
export function isScalarColumn(inputConfig: DataTypeFieldAndChildren | undefined): boolean {
    return inputConfig?.field_config?.array !== true;
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
 * Meters per unit for the canonical `GEO_DISTANCE_UNITS`, for `ST_Distance_Sphere`.
 *
 * The factors are turf's own, so a `110km` range is the same number of meters on both paths.
 * `parseGeoDistance` has already mapped every alias (`mi`, `NM`, `yd`, ...) to one of these.
*/
const METERS_PER_UNIT: Record<string, number> = {
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
 * A range in meters, or null when the unit has no factor here.
 *
 * The SQL path intentionally differs from `geoPointWithinRange`. `makeGeoCircle` builds a 64-sided
 * turf polygon and tests the point against it, which under-approximates the circle by about
 * `r * (1 - cos(pi/64))`, roughly 1.2 km at 1000 km. For a `1000km` range it reports a point
 * 998.867 km away as out of range. A true distance test has no such error.
*/
export function rangeInMeters(distance: unknown, unit: unknown): number | null {
    const factor = METERS_PER_UNIT[String(unit)];
    if (factor == null || !Number.isFinite(Number(distance))) return null;
    return Number(distance) * factor;
}

/**
 * The great-circle distance in meters from the point column to `center`.
 *
 * `ST_Distance_Sphere` expects WGS84 coordinates in (latitude, longitude) order, the opposite of
 * the (x, y) order `asGeometry` passes to `ST_Point`. Swapping them gives a plausible wrong number
 * rather than an error.
*/
export function distanceSphere(
    value: string,
    center: { lat: number; lon: number }
): string {
    return `ST_Distance_Sphere(ST_Point(${pointPart(value, 'lat')}, ${pointPart(value, 'lon')}),`
        + ` ST_Point(${center.lat}, ${center.lon}))`;
}
