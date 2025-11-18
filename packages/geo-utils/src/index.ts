import {
    GeoDistanceUnit,
    GEO_DISTANCE_UNITS,
    GeoPointInput,
    GeoShape,
    GeoPoint,
    GeoDistanceObj,
    GeoShapeType,
    ESGeoShapeType,
    GeoShapePoint,
    GeoShapePolygon,
    GeoShapeMultiPolygon,
    ESGeoShape,
    CoordinateTuple,
    GeoShapeRelation,
    GeoInput
} from '@terascope/types';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import equal from '@turf/boolean-equal';
import createCircle from '@turf/circle';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import within from '@turf/boolean-within';
import contains from '@turf/boolean-contains';
import disjoint from '@turf/boolean-disjoint';
import intersect from '@turf/boolean-intersects';
import {
    lineString,
    multiPolygon,
    polygon as tPolygon,
    point as tPoint,
} from '@turf/helpers';
import type {
    MultiPolygon,
    Feature,
    GeoJsonProperties,
    Polygon,
    Position,
} from 'geojson';
import lineToPolygon from '@turf/line-to-polygon';
import { getCoords } from '@turf/invariant';
import { find as geoToTimezone, setCache } from 'geo-tz';
import geoHash from 'latlon-geohash';
import {
    isArrayLike,
    isPlainObject,
    getTypeOf,
    trim,
    toString,
    parseNumberList,
    toNumber,
    isNumber,
    isKey
} from '@terascope/core-utils';

export const geoJSONTypes = Object.keys(GeoShapeType).map((key) => key.toLowerCase());

// allows for better access and control over tz-geo cache
const TZ_GEO_CACHE = new Map();

export function isGeoJSON(input: unknown): input is GeoShape | ESGeoShape {
    if (!isPlainObject(input)) return false;
    if (!isArrayLike((input as any).coordinates)) return false;

    const type = (input as any).type as unknown;
    if (typeof type !== 'string') return false;
    return geoJSONTypes.includes(type.toLowerCase());
}

export function isGeoShapePoint(input: unknown): input is GeoShapePoint {
    return isGeoJSON(input)
        && (input.type === GeoShapeType.Point || input.type === ESGeoShapeType.Point);
}

export function isGeoShapePolygon(input: unknown): input is GeoShapePolygon {
    return isGeoJSON(input)
        && (input.type === GeoShapeType.Polygon || input.type === ESGeoShapeType.Polygon);
}

export function isGeoShapeMultiPolygon(input: unknown): input is GeoShapeMultiPolygon {
    return isGeoJSON(input)
        && (input.type === GeoShapeType.MultiPolygon || input.type === ESGeoShapeType.MultiPolygon);
}

export function parseGeoDistance(str: string): GeoDistanceObj {
    const matches = trim(str).match(/(\d+)(.*)$/);

    if (!matches || !matches.length) {
        throw new TypeError(`Incorrect geo distance parameter provided: ${str}`);
    }

    const distance = Number(matches[1]);
    const unit = parseGeoDistanceUnit(matches[2]);

    return { distance, unit };
}

export function parseGeoDistanceUnit(input: string): GeoDistanceUnit {
    const unit = GEO_DISTANCE_UNITS[trim(input)];
    if (!unit) {
        throw new TypeError(`Incorrect distance unit provided: ${input}`);
    }
    return unit;
}

function getLonAndLat(input: unknown, throwInvalid = true): GeoPoint | null {
    if (!isPlainObject(input)) {
        if (!throwInvalid) return null;
        throw new TypeError(`Invalid geo point, expected object, got ${input} (${getTypeOf(input)})`);
    }

    const obj = input as Record<string, unknown>;

    let lat: unknown;
    let lon: unknown;

    if ('lat' in obj && 'lon' in obj) {
        if (isNumber(obj.lat) && isNumber(obj.lon)) {
            return obj as unknown as GeoPoint;
        }
        lat = obj.lat;
        lon = obj.lon;
    } else if ('latitude' in obj && 'longitude' in obj) {
        lat = obj.latitude;
        lon = obj.longitude;
    } else if (isGeoShapePoint(obj)) {
        [lon, lat] = obj.coordinates;
    }

    if (throwInvalid && (lat == null || lon == null)) {
        if (isGeoShapePolygon(obj) || isGeoShapeMultiPolygon(obj)) {
            throw new TypeError([
                `Expected a Point geo shape, received a geo ${obj.type} shape,`,
                'you may need to switch to a polygon compatible operation'
            ].join(' '));
        }
        throw new TypeError('Invalid geo point object, it must contain keys lat,lon or latitude/longitude');
    }

    lat = toNumber(lat);
    lon = toNumber(lon);
    if (!isNumber(lat) || !isNumber(lon)) {
        if (throwInvalid) {
            throw new TypeError('Invalid geo point, lat and lon must be numbers');
        }
        return null;
    }

    return { lat, lon };
}

/**
 * Convert an input into a Geo Point object with lat and lon
*/
export function parseGeoPoint(point: GeoPointInput | unknown): GeoPoint;
export function parseGeoPoint(point: GeoPointInput | unknown, throwInvalid: true): GeoPoint;
export function parseGeoPoint(point: GeoPointInput | unknown, throwInvalid: false): GeoPoint | null;
export function parseGeoPoint(
    point: GeoPointInput | unknown,
    throwInvalid = true
): GeoPoint | null {
    let lat: number | undefined;
    let lon: number | undefined;

    if (typeof point === 'string') {
        if (point.includes(',')) {
            [lat, lon] = parseNumberList(point);
        } else {
            try {
                return geoHash.decode(point);
            } catch (err) {
                // do nothing
            }
        }
    } else if (isPlainObject(point)) {
        const results = getLonAndLat(point, throwInvalid);
        if (results) return results;
    } else if (isArrayLike(point)) {
        // array of points are meant to be lon/lat format
        [lon, lat] = parseNumberList(point);
    }

    if (throwInvalid && (lat == null || lon == null)) {
        throw new TypeError(`Invalid geo point given to parse, got ${point} (${getTypeOf(point)})`);
    }

    // data incoming is lat,lon and we must return lon,lat
    if (lat != null && lon != null) {
        return {
            lat,
            lon
        };
    }
    return null;
}

export function isGeoPoint(input: unknown): boolean {
    return parseGeoPoint(input as GeoPointInput, false) != null;
}

export function makeGeoBBox(
    point1: GeoPoint,
    point2: GeoPoint
): Feature<Polygon, GeoJsonProperties> {
    const line = lineString([
        makeCoordinatesFromGeoPoint(point1),
        makeCoordinatesFromGeoPoint(point2)
    ]);
    const box = bbox(line);

    return bboxPolygon(box);
}

export function inGeoBoundingBox(
    top_left: GeoPointInput, bottom_right: GeoPointInput, point: GeoPointInput
): boolean {
    const topLeft = parseGeoPoint(top_left);
    const bottomRight = parseGeoPoint(bottom_right);

    const polygon = makeGeoBBox(topLeft, bottomRight);
    if (polygon == null) {
        throw new Error(`Invalid bounding box created from topLeft: ${topLeft}, bottomRight: ${bottomRight}`);
    }

    return geoPolyHasPoint(polygon)(point);
}

export function inGeoBoundingBoxFP(
    top_left: GeoPointInput, bottom_right: GeoPointInput
): (input: unknown) => boolean {
    const topLeft = parseGeoPoint(top_left);
    const bottomRight = parseGeoPoint(bottom_right);

    const polygon = makeGeoBBox(topLeft, bottomRight);
    if (polygon == null) {
        throw new Error(`Invalid bounding box created from topLeft: ${topLeft}, bottomRight: ${bottomRight}`);
    }

    return geoPolyHasPoint(polygon);
}

export function makeCoordinatesFromGeoPoint(point: GeoPoint): CoordinateTuple {
    return [point.lon, point.lat];
}

export function geoPolyHasPoint<G extends Polygon | MultiPolygon>(polygon: Feature<G> | G) {
    return (fieldData: unknown): boolean => {
        const point = parseGeoPoint(fieldData as any, false);
        if (!point) return false;
        return pointInPolygon(makeCoordinatesFromGeoPoint(point), polygon);
    };
}

export function makeGeoCircle(
    point: GeoPoint, distance: number, unitVal?: GeoDistanceUnit
): Feature<Polygon> | undefined {
    // There is a mismatch between elasticsearch and turf on "inch" naming
    const units = unitVal === 'inch' ? 'inches' : unitVal;
    return createCircle(makeCoordinatesFromGeoPoint(point), distance, { units });
}

export function geoPointWithinRange(
    startingPoint: GeoPointInput, distanceValue: string, point: GeoPointInput
): boolean {
    const sPoint = parseGeoPoint(startingPoint);
    const { distance, unit } = parseGeoDistance(distanceValue);

    const polygon = makeGeoCircle(sPoint, distance, unit);

    if (polygon == null) {
        throw new Error(`Invalid startingPoint: ${startingPoint}`);
    }

    return geoPolyHasPoint(polygon)(point);
}

export function geoPointWithinRangeFP(
    startingPoint: GeoPointInput, distanceValue: string
): (input: unknown) => boolean {
    const sPoint = parseGeoPoint(startingPoint);
    const { distance, unit } = parseGeoDistance(distanceValue);

    const polygon = makeGeoCircle(sPoint, distance, unit);

    if (polygon == null) {
        throw new Error(`Invalid startingPoint: ${startingPoint}`);
    }

    return geoPolyHasPoint(polygon);
}

export function geoRelationFP(
    geoShape: GeoInput, relation: GeoShapeRelation
): (input: unknown) => boolean {
    if (relation === GeoShapeRelation.Within) {
        return geoWithinFP(geoShape);
    }

    if (relation === GeoShapeRelation.Contains) {
        return geoContainsFP(geoShape);
    }

    if (relation === GeoShapeRelation.Intersects) {
        return geoIntersectsFP(geoShape);
    }

    if (relation === GeoShapeRelation.Disjoint) {
        return geoDisjointFP(geoShape);
    }

    throw new Error(`Unsupported relation ${relation}`);
}

/** Converts a geoJSON object to its turf geo feature counterpart */
export function makeGeoFeature(geoShape: unknown): Feature<any> | undefined {
    if (isGeoShapePoint(geoShape)) {
        return tPoint(geoShape.coordinates);
    }

    if (isGeoShapeMultiPolygon(geoShape)) {
        return multiPolygon(geoShape.coordinates);
    }

    if (isGeoShapePolygon(geoShape)) {
        return tPolygon(geoShape.coordinates);
    }

    return;
}

/** Converts a geoJSON object to its turf geo feature counterpart, will throw if not valid */
export function makeGeoFeatureOrThrow(geoShape: unknown): Feature<any> {
    const results = makeGeoFeature(geoShape);

    if (!results) {
        throw new Error(`Invalid input: ${JSON.stringify(geoShape)}, is not a valid geo-shape`);
    }

    return results;
}

/**
 * Returns true if the second geometry is completely contained by the first geometry.
 * The interiors of both geometries must intersect and, the interior and boundary of
 * the secondary geometry must not intersect the exterior of the first geometry.
 */
export function geoContains(firstGeoEntity: GeoInput, secondGeoEntity: GeoInput): boolean {
    return geoContainsFP(secondGeoEntity)(firstGeoEntity);
}

/**
 * When provided with geoInput that acts as the argument geo-feature, it will return a function
 * that accepts any geoInput and checks to see if the new input contains the argument geo-feature
 */
export function geoContainsFP(queryGeoEntity: GeoInput): (input: unknown) => boolean {
    const queryGeo = toGeoJSONOrThrow(queryGeoEntity);
    const queryFeature = makeGeoFeatureOrThrow(queryGeo);

    if (isGeoShapePoint(queryGeo)) return _pointContains(queryFeature);

    const {
        polygons: queryPolygons,
        holes: queryHoles
    } = _featureToPolygonAndHoles(queryFeature);

    return function _geoContains(input: unknown): boolean {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        if (isGeoPoint(inputGeoEntity)) {
            // point cannot contain a poly like feature
            return false;
        }

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        const {
            polygons: inputPolygons,
            holes: inputHoles
        } = _featureToPolygonAndHoles(inputFeature);

        if (inputHoles.length) {
            const withinInputHole = inputHoles.some(
                (iHolePoly) => queryPolygons.some((qPoly) => intersect(qPoly, iHolePoly))
            );

            if (withinInputHole) {
                // check to see if holes are the same, if so they don't overlap
                if (queryHoles.length) {
                    return queryHoles.some(
                        (qHole) => inputHoles.some((iHole) => equal(qHole, iHole))
                    );
                }
                return false;
            }
        }

        return queryPolygons.every(
            (qPoly) => inputPolygons.some((iPoly) => contains(iPoly, qPoly))
        );
    };
}

function _pointContains(queryFeature: Feature<any>) {
    return (input: unknown) => {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        if (isGeoPoint(inputGeoEntity)) {
            return equal(inputFeature, queryFeature);
        }

        const {
            polygons,
            holes
        } = _featureToPolygonAndHoles(inputFeature);

        let pointInHole = false;

        if (holes.length) {
            pointInHole = holes.some((iPolyHole) => contains(iPolyHole, queryFeature));
        }

        return !pointInHole && polygons.some((poly) => contains(poly, queryFeature));
    };
}

function _featureToPolygonAndHoles(inputFeature: Feature<any>) {
    const inputHoles: Feature<any>[] = [];
    const inputCoords = getCoords(inputFeature);
    let inputPolygons: Feature<any>[];

    if (inputFeature.geometry.type === 'MultiPolygon') {
        inputPolygons = inputCoords
            .map((coords) => {
                if (coords.length > 1) {
                    const [polygon, ...holes] = coords.map(
                        (innerCords: Position[]) => tPolygon([innerCords])
                    );
                    inputHoles.push(...holes);
                    return polygon;
                }

                return tPolygon(coords);
            }) as Feature<any>[];
    } else if (inputFeature.geometry.type === 'Polygon') {
        const [polyCoords, ...holeCords] = inputCoords;
        inputPolygons = [tPolygon([polyCoords])];

        const holePolygons = holeCords.map((coords) => tPolygon([coords])) as Feature<any>[];
        inputHoles.push(...holePolygons);
    } else {
        throw new Error(`Cannot convert ${toString(inputFeature)} to a polygon`);
    }

    return { holes: inputHoles, polygons: inputPolygons };
}

function _pointToPointMatch(queryInput: Feature<any>) {
    return (input: unknown) => {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        if (!isGeoShapePoint(inputGeoEntity)) return false;
        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        return equal(queryInput, inputFeature);
    };
}

/**
 * Returns true if the first geometry is completely within the second geometry.
 * The interiors of both geometries must intersect and, the interior and boundary
 * of the first geometry must not intersect the exterior of the second geometry
 */
export function geoWithin(firstGeoEntity: GeoInput, secondGeoEntity: GeoInput): boolean {
    return geoWithinFP(secondGeoEntity)(firstGeoEntity);
}

/**
 * When provided with geoInput that acts as the parent geo-feature, it will return a function
 * that accepts any geoInput and checks to see if the new input is within the parent geo-feature
 */
export function geoWithinFP(queryGeoEntity: GeoInput): (input: unknown) => boolean {
    const queryGeo = toGeoJSONOrThrow(queryGeoEntity);
    const queryFeature = makeGeoFeatureOrThrow(queryGeo);

    // point can only be compared to other points
    if (isGeoShapePoint(queryGeo)) return _pointToPointMatch(queryFeature);

    const { polygons: queryPolygons, holes: queryHoles } = _featureToPolygonAndHoles(queryFeature);
    const hasQueryHoles = queryHoles.length > 0;

    return function _geoWithinFP(input) {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        if (isGeoShapePoint(inputGeoEntity)) {
            if (hasQueryHoles) {
                const withinQueryHole = queryHoles
                    .some((holeFeature) => intersect(inputFeature, holeFeature));
                if (withinQueryHole) return false;
            }

            return queryPolygons.some(within.bind(within, inputFeature));
        }

        const {
            polygons: inputPolygons,
            holes: inputHoles
        } = _featureToPolygonAndHoles(inputFeature);

        if (hasQueryHoles) {
            // holes intersect main body
            const withinQueryHole = queryHoles.some(
                (qHole) => {
                    const bool = intersect(inputFeature, qHole);

                    if (bool && inputHoles.length) {
                        // if they are equal, then don't immediately falsify
                        const inner = !inputHoles.some((inputHole) => equal(qHole, inputHole));
                        return inner;
                    }
                    return bool;
                }
            );

            if (withinQueryHole) return false;
        }

        return inputPolygons.every(
            (iPoly) => queryPolygons.some(within.bind(within, iPoly))
        );
    };
}

/** Returns true if both geo entities intersect each other, if one of the input geo entity
 * is a point, it will check if the other geo-entity contains the point
 */
export function geoIntersects(firstGeoEntity: GeoInput, secondGeoEntity: GeoInput): boolean {
    return geoIntersectsFP(firstGeoEntity)(secondGeoEntity);
}

export function geoIntersectsFP(queryGeoEntity: GeoInput): (input: unknown) => boolean {
    const queryGeo = toGeoJSONOrThrow(queryGeoEntity);
    const queryFeature = makeGeoFeatureOrThrow(queryGeo);

    return function _geoIntersectsFP(input: unknown) {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        return intersect(inputFeature, queryFeature);
    };
}

export function geoDisjointFP(queryGeoEntity: GeoInput): (input: unknown) => boolean {
    const queryGeo = toGeoJSONOrThrow(queryGeoEntity);
    const queryFeature = makeGeoFeatureOrThrow(queryGeo);

    return function _geoDisjointFP(input: unknown) {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        return disjoint(inputFeature, queryFeature);
    };
}

/** Returns true if both geo entities have no overlap */
export function geoDisjoint(firstGeoEntity: GeoInput, secondGeoEntity: GeoInput): boolean {
    return geoDisjointFP(firstGeoEntity)(secondGeoEntity);
}

const esTypeMap = {
    [ESGeoShapeType.Point]: GeoShapeType.Point,
    [ESGeoShapeType.MultiPolygon]: GeoShapeType.MultiPolygon,
    [ESGeoShapeType.Polygon]: GeoShapeType.Polygon,
} as const;

/** Only able to convert geo-points to either a geo-json point or a simple polygon.
 * There is no current support for creating polygon with holes or multi-polygon
 * as of right now. geoJSON input is made sure to be properly formatted for its type value
 */
export function toGeoJSON(input: unknown): GeoShape | undefined {
    if (isGeoJSON(input)) {
        const { type: inputType } = input;
        const type = isKey(esTypeMap, inputType) ? esTypeMap[inputType] : inputType;

        return { ...input, type } as GeoShape;
    }

    if (isGeoPoint(input)) {
        const coordinates = makeCoordinatesFromGeoPoint(parseGeoPoint(input as GeoPointInput));
        return {
            type: GeoShapeType.Point,
            coordinates
        };
    }

    if (Array.isArray(input)) {
        try {
            const points = input.map((point) => makeCoordinatesFromGeoPoint(
                parseGeoPoint(point as GeoPointInput)
            ));

            const coordinates = validateListCoords(points);

            return {
                type: GeoShapeType.Polygon,
                coordinates
            };
        } catch (_err) {
            // ignore here
        }
    }
}

export function toGeoJSONOrThrow(input: unknown): GeoShape {
    const geoJSON = toGeoJSON(input);

    if (!geoJSON) {
        throw new Error(`Cannot convert ${JSON.stringify(input)} to valid geoJSON`);
    }

    return geoJSON;
}

export function validateListCoords(coords: CoordinateTuple[]): any[] {
    if (coords.length < 3) {
        throw new Error('Points parameter for a geoPolygon query must have at least three geo-points');
    }
    const line = lineString(coords);
    const polygon = lineToPolygon(line);
    // @ts-expect-error
    return getCoords(polygon);
}

export function polyHasHoles(input: GeoShape): boolean {
    if (isGeoShapePolygon(input)) {
        return input.coordinates.length > 1;
    }

    if (isGeoShapeMultiPolygon(input)) {
        return input.coordinates[0].length > 1;
    }

    return false;
}

/** Takes in a geo point like entity and returns the timezone of its location */
export function lookupTimezone(input: unknown): string {
    if (!tzCacheLoaded()) {
        setCache({ preload: true, store: TZ_GEO_CACHE });
    }

    const { lat, lon } = parseGeoPoint(input as GeoPointInput);
    // it returns an array, return the first one
    return geoToTimezone(lat, lon)[0];
}

export function tzCacheLoaded(): boolean {
    return TZ_GEO_CACHE.size > 0;
}

// TODO: maybe move this to data-mate as this is a directive only function
// export function toTimeZoneUsingLocation(val: unknown, location: unknown) {
//     // location validation happens inside lookupTimezone
//     const timezone = lookupTimezone(location);
//     return toTimeZone(val, timezone);
// }

// export function toTimeZoneUsingLocationFP(location: unknown) {
//     // location validation happens inside lookupTimezone
//     const timezone = lookupTimezone(location);

//     return function _toTimeZoneUsingLocation(val: unknown) {
//         return toTimeZone(val, timezone);
//     };
// }

export {
    geoHash
};
