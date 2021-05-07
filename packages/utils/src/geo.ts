/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    GeoDistanceUnit,
    GEO_DISTANCE_UNITS,
    GeoPointInput,
    GeoShape,
    GeoPoint,
    GeoDistanceObj,
    GeoShapeType,
    JoinGeoShape,
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
import intersect from '@turf/boolean-overlap';
import {
    lineString,
    multiPolygon,
    polygon as tPolygon,
    point as tPoint,
    MultiPolygon,
    Feature,
    Properties,
    Polygon,
    Geometry,
    Point,
    Position
} from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';
import { getCoords } from '@turf/invariant';
import { isArrayLike } from './arrays';
import { isPlainObject, geoHash } from './deps';
import { trim, toString } from './strings';
import { parseNumberList, toNumber, isNumber } from './numbers';
import { isNil } from './empty';

export const geoJSONTypes = Object.keys(GeoShapeType).map((key) => key.toLowerCase());

export function isGeoJSON(input: unknown): input is GeoShape|ESGeoShape {
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

export function getLonAndLat(input: unknown, throwInvalid = true): [number, number] | null {
    let lat: number|string|undefined;
    let lon: number|string|undefined;

    if (isGeoShapePoint(input as JoinGeoShape)) {
        [lon, lat] = (input as GeoShapePoint).coordinates;
    } else if (isPlainObject(input)) {
        const obj = (input as any);
        lat = obj.lat ?? obj.latitude;
        lon = obj.lon ?? obj.longitude;
    }

    if (throwInvalid && (isNil(lat) || isNil(lon))) {
        if (isPlainObject(input)
            && (isGeoShapePolygon(input as any) || isGeoShapeMultiPolygon(input as any))) {
            throw new TypeError([
                `Expected a Point geo shape, received a geo ${(input as any).type} shape,`,
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

    return [lat, lon];
}

export function parseGeoPoint(point: GeoPointInput): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: true): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: false): GeoPoint | null;
export function parseGeoPoint(point: GeoPointInput, throwInvalid = true): GeoPoint | null {
    let lat: number | undefined;
    let lon: number | undefined;

    if (typeof point === 'string') {
        if (point.includes(',')) {
            [lat, lon] = parseNumberList(point);
        } else {
            try {
                ({ lat, lon } = geoHash.decode(point));
            } catch (err) {
                // do nothing
            }
        }
    } else if (isArrayLike(point)) {
        // array of points are meant to be lon/lat format
        [lon, lat] = parseNumberList(point);
    } else if (isPlainObject(point)) {
        const results = getLonAndLat(point, throwInvalid);
        if (results) [lat, lon] = results;
    }

    if (throwInvalid && (lat == null || lon == null)) {
        throw new TypeError(`Invalid geo point given to parse, point:${point}`);
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

export function makeGeoBBox(point1: GeoPoint, point2: GeoPoint): Feature<Polygon, Properties> {
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
): (input: GeoPointInput) => boolean {
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

export function geoPolyHasPoint<G extends Polygon | MultiPolygon>(polygon: Feature<G>|G) {
    return (fieldData: GeoPointInput): boolean => {
        const point = parseGeoPoint(fieldData, false);
        if (!point) return false;
        return pointInPolygon(makeCoordinatesFromGeoPoint(point), polygon);
    };
}

export function geoContainsPoint(
    geoShape: JoinGeoShape, point: GeoPointInput
): boolean {
    const geoPoint = makeCoordinatesFromGeoPoint(parseGeoPoint(point));
    const turfPoint = tPoint(geoPoint);

    if (turfPoint == null) {
        throw new Error(`Invalid point: ${point}`);
    }

    return pointInGeoShape(turfPoint)(geoShape);
}

export function geoContainsPointFP(
    point: GeoPointInput
): (shape: unknown) => boolean {
    const geoPoint = makeCoordinatesFromGeoPoint(parseGeoPoint(point));
    const turfPoint = tPoint(geoPoint);

    if (turfPoint == null) {
        throw new Error(`Invalid point: ${point}`);
    }

    return pointInGeoShape(turfPoint);
}

function pointInGeoShape(searchPoint: Feature<any, Properties>|Geometry) {
    return (geoShape: unknown): boolean => {
        let polygon: any;

        if (isGeoShapePoint(geoShape)) {
            return theSameGeo(searchPoint, tPoint(geoShape.coordinates));
        }

        if (isGeoShapeMultiPolygon(geoShape)) {
            polygon = multiPolygon(geoShape.coordinates);
        }

        if (isGeoShapePolygon(geoShape)) {
            polygon = tPolygon(geoShape.coordinates);
        }
        // Nothing matches so return false
        if (!polygon) return false;
        return pointInPolygon(searchPoint as any, polygon);
    };
}

export function makeGeoCircle(
    point: GeoPoint, distance: number, unitVal?: GeoDistanceUnit
): Feature<Polygon>|undefined {
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
): (input: GeoPointInput) => boolean {
    const sPoint = parseGeoPoint(startingPoint);
    const { distance, unit } = parseGeoDistance(distanceValue);

    const polygon = makeGeoCircle(sPoint, distance, unit);

    if (polygon == null) {
        throw new Error(`Invalid startingPoint: ${startingPoint}`);
    }

    return geoPolyHasPoint(polygon);
}

export function geoPolygon(
    geoShape: JoinGeoShape,
    relation: GeoShapeRelation,
    inputShape: JoinGeoShape
): boolean {
    const polygon = makeGeoFeatureOrThrow(geoShape);
    return geoMatchesShape(polygon as Feature<any, Properties>, relation)(inputShape);
}

export function geoPolygonFP(
    geoShape: GeoInput, relation: GeoShapeRelation
): (input: unknown) => boolean {
    if (relation === GeoShapeRelation.Within) {
        return geoWithinFP(geoShape);
    }

    if (relation === GeoShapeRelation.Contains) {
        return geoContainsFP(geoShape);
    }

    const polygon = makeGeoFeatureOrThrow(geoShape);
    return geoMatchesShape(polygon as Feature<any, Properties>, relation);
}

/** Converts a geoJSON object to its turf geo feature counterpart */
export function makeGeoFeature(geoShape: unknown): Feature<any>|undefined {
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

export function geoMatchesShape(
    queryPolygon: Feature<any>, relation: GeoShapeRelation
): (fieldData: unknown) => boolean {
    const match = getRelationFn(relation, queryPolygon);
    return (input) => {
        const feature = makeGeoFeature(input);
        // Nothing matches so return false
        if (!feature) return false;

        return match(feature);
    };
}

type RelationFn = (query: Feature<any>) => ((field: Feature<any>) => boolean);

const relationOptions: Record<GeoShapeRelation, RelationFn> = Object.freeze({
    /**
     * within returns true if the first geometry is completely within the second geometry
    */
    [GeoShapeRelation.Within](queryPolygon) {
        return (fieldPolygon) => {
            console.log('what is feature here', fieldPolygon);
            return within(fieldPolygon, queryPolygon);
        };
    },
    /**
     * disjoint returns (TRUE) if the intersection of the two geometries is an empty set.
     */
    [GeoShapeRelation.Disjoint](queryPolygon) {
        return (fieldPolygon) => disjoint(fieldPolygon, queryPolygon);
    },
    /**
     * contains returns True if the second geometry is completely contained by the first geometry.
    */
    [GeoShapeRelation.Contains](queryPolygon) {
        return (fieldPolygon) => contains(fieldPolygon, queryPolygon);
    },
    /**
     * compares two geometries of the same dimension and returns true if they intersection
    */
    [GeoShapeRelation.Intersects](queryPolygon: Feature<any>) {
        return (fieldPolygon: Feature<any>) => intersect(fieldPolygon, queryPolygon);
    },
});

export function getRelationFn(
    relation: GeoShapeRelation, queryPolygon: Feature<any>
): (field: Feature<any>) => boolean {
    return relationOptions[relation](queryPolygon);
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
 * When provided with geoInput that acts as the parent geo-feature, it will return a function
 * that accepts any geoInput and checks to see if the new input contains the parent geo-feature
 */
export function geoContainsFP(queryGeoEntity: GeoInput): (input: unknown) => boolean {
    const queryGeo = toGeoJSONOrThrow(queryGeoEntity);
    const queryFeature = makeGeoFeatureOrThrow(queryGeo);

    if (isGeoShapePoint(queryGeo)) return _pointContainsPoint(queryFeature);
    if (isGeoShapePolygon(queryGeo)) return _polyContains(queryFeature);
    if (isGeoShapeMultiPolygon(queryGeo)) return _multiPolyContains(queryFeature);

    throw new Error(`Unsupported query input ${JSON.stringify(queryGeoEntity)}`);
}

function _multiPolyContains(queryFeature: Feature<any>) {
    return (input: unknown) => {
        const inputGeoEntity = toGeoJSON(input);
        console.log('what is inputGeoEntity', inputGeoEntity);
        if (!inputGeoEntity) return false;

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        // input point can only be compared with a point
        if (isGeoShapePoint(inputGeoEntity)) return false;

        if (isGeoShapePolygon(inputGeoEntity)) {
            const queryPolygons = getCoords(queryFeature)
                .map((coords) => tPolygon(coords));

            return queryPolygons.every((polygon) => contains(inputFeature, polygon));
        }

        if (isGeoShapeMultiPolygon(inputGeoEntity)) {
            console.log('am i here????');
            const queryPolygons = getCoords(queryFeature)
                .map((coords) => tPolygon(coords));

            const inputPolygons = getCoords(inputFeature)
                .map((coords) => tPolygon(coords));

            return inputPolygons.every(
                (iPoly) => {
                    console.log('iPoly', iPoly, queryPolygons);
                    return queryPolygons.some((polygon) => contains(iPoly, polygon));
                }
            );
        }

        throw new Error(`Unsupported geo input ${JSON.stringify(inputGeoEntity)}`);
    };
}

function _polyContains(queryFeature: Feature<any>) {
    return (input: unknown) => {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        // input point can only be compared with a point
        if (isGeoShapePoint(inputGeoEntity)) return false;

        if (isGeoShapeMultiPolygon(inputGeoEntity)) {
            const inputFeature = makeGeoFeature(inputGeoEntity);
            if (!inputFeature) return false;

            const coords = getCoords(inputFeature);

            return coords.some((polyCords) => {
                // we have a polygon with holes
                if (polyCords.length > 1) {
                    const [polygon, ...holes] = polyCords.map(
                        (innerCords: Position[]) => tPolygon([innerCords])
                    );

                    // must contain queryFeature, but holes must not be encompassed
                    return contains(polygon, queryFeature) && !holes.some(
                        (hole: Feature<any>) => contains(queryFeature, hole)
                    );
                }

                const polygon = tPolygon(polyCords);
                return contains(polygon, queryFeature);
            });
        }

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        return contains(inputFeature, queryFeature);
    };
}

function _pointContainsPoint(queryInput: Feature<any>) {
    return (input: unknown) => {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        if (!isGeoShapePoint(inputGeoEntity)) return false;
        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        return theSameGeo(queryInput, inputFeature);
    };
}

function theSameGeo(firstGeo: Feature<any>|Geometry, secondGeo: Feature<any>|Geometry) {
    return equal(firstGeo, secondGeo);
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

    return (input: unknown) => {
        const inputGeoEntity = toGeoJSON(input);
        if (!inputGeoEntity) return false;

        if (isGeoShapeMultiPolygon(inputGeoEntity)) {
            if (isGeoShapePoint(queryGeo)) return false;

            if (isGeoShapePolygon(queryGeo) || isGeoShapeMultiPolygon(queryGeo)) {
                const inputFeature = makeGeoFeature(inputGeoEntity);
                const coords = getCoords(inputFeature);

                // it might be faster to check if points are in poly?
                return coords.every((polyCords) => {
                    const polygon = tPolygon(polyCords);
                    return within(polygon, queryFeature);
                });
            }

            throw new Error(`Geo entity ${JSON.stringify(queryGeo)} is currently not supported for a "within" query against ${JSON.stringify(inputGeoEntity)}`);
        }

        const inputFeature = makeGeoFeature(inputGeoEntity);
        if (!inputFeature) return false;

        return within(inputFeature, queryFeature);
    };
}

/** Returns true if both geo entities intersect each other, if one of the input geo entity
 * is a point, it will check if the other geo-entity contains the point
 */
export function geoIntersects(firstGeoEntity: GeoInput, secondGeoEntity: GeoInput):boolean {
    const firstGeoJSON = toGeoJSONOrThrow(firstGeoEntity);
    const secondGeoJSON = toGeoJSONOrThrow(secondGeoEntity);

    if (isGeoShapePoint(firstGeoJSON)) {
        const point = tPoint(firstGeoJSON.coordinates);
        return pointInGeoShape(point)(secondGeoJSON);
    }

    if (isGeoShapePoint(secondGeoJSON)) {
        const point = tPoint(secondGeoJSON.coordinates);
        return pointInGeoShape(point)(firstGeoJSON);
    }

    const firstGeo = makeGeoFeature(firstGeoJSON) as Feature<any>;
    const secondGeo = makeGeoFeature(secondGeoJSON) as Feature<any>;

    return getRelationFn(GeoShapeRelation.Intersects, secondGeo)(firstGeo);
}

/** Returns true if both geo entities have no overlap */
export function geoDisjoint(firstGeoEntity: GeoInput, secondGeoEntity: GeoInput):boolean {
    const firstGeo = makeGeoFeature(toGeoJSONOrThrow(firstGeoEntity)) as Feature<any>;
    const secondGeo = makeGeoFeature(toGeoJSONOrThrow(secondGeoEntity)) as Feature<any>;

    return getRelationFn(GeoShapeRelation.Disjoint, secondGeo)(firstGeo);
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
export function toGeoJSON(input: unknown): GeoShape|undefined {
    if (isGeoJSON(input)) {
        const { type: inputType } = input;
        const type = esTypeMap[inputType] ? esTypeMap[inputType] : inputType;
        return { ...input, type };
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
        throw new Error(`Cannot convert ${JSON.stringify(input)} to a geo-shape`);
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
