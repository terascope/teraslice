
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
// @ts-ignore
import createCircle from '@turf/circle';
import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import within from '@turf/boolean-within';
import contains from '@turf/boolean-contains';
import disjoint from '@turf/boolean-disjoint';
// @ts-ignore
import intersect from '@turf/boolean-overlap';
import { lineString } from '@turf/helpers';
// @ts-ignore
import lineToPolygon from '@turf/line-to-polygon';
import { parseGeoPoint } from '../../../utils';
import { GeoPoint } from '../../../interfaces';
import { GeoShapeRelation } from '../../../translator/interfaces';

export function polyHasPoint(polygon: any) {
    return (fieldData: string) => {
        const point = parseGeoPoint(fieldData, false);
        if (!point) return false;
        return pointInPolygon([point.lon, point.lat], polygon);
    };
}

export function makeCircle(point: GeoPoint, distance: number, config: any) {
    return createCircle([point.lon, point.lat], distance, config);
}

export function makeBBox(point1: GeoPoint, point2: GeoPoint) {
    const line = lineString([
        [point1.lon, point1.lat],
        [point2.lon, point2.lat]
    ]);
    const box = bbox(line);

    return bboxPolygon(box);
}

export function polygonHasPoint(searchPoint: any) {
    return (fieldData: string[]) => {
        const polygon = rawPointsToPolygon(fieldData);
        // Nothing matches so return false
        if (!polygon) return false;
        return pointInPolygon(searchPoint, polygon);
    };
}

function rawPointsToPolygon(fieldData: string[]) {
    const points: GeoPoint[] = [];

    for (const str of fieldData) {
        const point = parseGeoPoint(str, false);
        if (points == null) return false;
        points.push(point as GeoPoint);
    }

    return makePolygon(points);
}

export function makePolygon(points: GeoPoint[]) {
    const polyPoints = points.map((obj) => [obj.lon, obj.lat]);
    const line = lineString(polyPoints);
    return lineToPolygon(line);
}

export function polyToPoly(polygon: any, relation: GeoShapeRelation) {
    const match = getRelationFn(relation, polygon);
    return (fieldData: string[]) => {
        const fieldPolygon = rawPointsToPolygon(fieldData);
        // Nothing matches so return false
        if (!fieldPolygon) return false;
        return match(fieldPolygon);
    };
}


// within returns true if the first geometry is completely within the second geometry
function withinFn(queryPolygon: any) {
    return (fieldPolygon: any) => within(fieldPolygon, queryPolygon);
}

// contains returns True if the second geometry is completely contained by the first geometry.
function containsFn(queryPolygon: any) {
    return (fieldPolygon: any) => contains(fieldPolygon, queryPolygon);
}

// Compares two geometries of the same dimension and returns true if they intersection
function intersectFn(queryPolygon: any) {
    return (fieldPolygon: any) => intersect(fieldPolygon, queryPolygon);
}

// disjoint returns (TRUE) if the intersection of the two geometries is an empty set.
function disjointFn(queryPolygon: any) {
    return (fieldPolygon: any) => disjoint(fieldPolygon, queryPolygon);
}

const relationOptions = {
    [GeoShapeRelation.Within]: withinFn,
    [GeoShapeRelation.Disjoint]: disjointFn,
    [GeoShapeRelation.Contains]: containsFn,
    [GeoShapeRelation.Intersects]: intersectFn,
};

export function getRelationFn(relation: GeoShapeRelation, queryPolygon: any) {
    return relationOptions[relation](queryPolygon);
}
