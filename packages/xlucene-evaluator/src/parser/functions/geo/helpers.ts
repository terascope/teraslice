
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
// @ts-ignore
import equal from '@turf/boolean-equal';
// @ts-ignore
import createCircle from '@turf/circle';
import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import within from '@turf/boolean-within';
import contains from '@turf/boolean-contains';
import disjoint from '@turf/boolean-disjoint';
// @ts-ignore
import intersect from '@turf/boolean-overlap';
import {
    lineString,
    multiPolygon,
    polygon as tPolygon,
    point as tPoint
} from '@turf/helpers';
// @ts-ignore
import lineToPolygon from '@turf/line-to-polygon';
import { parseGeoPoint } from '../../../utils';
import {
    GeoShapeRelation,
    GeoPoint,
    CoordinateTuple,
    GeoPointInput,
    GeoShapeType,
    GeoShapePoint,
    GeoShapePolygon,
    GeoShapeMultiPolygon,
    GeoShape,
} from '../../../interfaces';
import { ESGeoShapeType, ESGeoShape } from '../../../translator/interfaces';

export function polyHasPoint(polygon: any) {
    return (fieldData: GeoPointInput) => {
        const point = parseGeoPoint(fieldData, false);
        if (!point) return false;
        return pointInPolygon(makeCoordinatesFromGeoPoint(point), polygon);
    };
}

export function makeCircle(point: GeoPoint, distance: number, config: any) {
    return createCircle(makeCoordinatesFromGeoPoint(point), distance, config);
}

export function makeBBox(point1: GeoPoint, point2: GeoPoint) {
    const line = lineString([
        makeCoordinatesFromGeoPoint(point1),
        makeCoordinatesFromGeoPoint(point2)
    ]);
    const box = bbox(line);

    return bboxPolygon(box);
}

export function pointInGeoShape(searchPoint: any) {
    return (fieldData: JoinGeoShape) => {
        let polygon: any;
        if (isGeoShapePoint(fieldData)) {
            return equal(searchPoint, tPoint(fieldData.coordinates));
        }

        if (isGeoShapeMultiPolygon(fieldData)) {
            polygon = multiPolygon(fieldData.coordinates);
        }

        if (isGeoShapePolygon(fieldData)) {
            polygon = tPolygon(fieldData.coordinates);
        }
        // Nothing matches so return false
        if (!polygon) return false;
        return pointInPolygon(searchPoint, polygon);
    };
}

export function makePolygon(points: GeoPoint[]) {
    const polyPoints = points.map(makeCoordinatesFromGeoPoint);
    const line = lineString(polyPoints);
    return lineToPolygon(line);
}

export function polyHasShape(queryPolygon: any, relation: GeoShapeRelation) {
    const match = getRelationFn(relation, queryPolygon);
    return (fieldData: JoinGeoShape) => {
        let feature: any;
        if (isGeoShapePoint(fieldData)) {
            feature = tPoint(fieldData.coordinates);
        }

        if (isGeoShapeMultiPolygon(fieldData)) {
            feature = multiPolygon(fieldData.coordinates);
        }

        if (isGeoShapePolygon(fieldData)) {
            feature = tPolygon(fieldData.coordinates);
        }
        // Nothing matches so return false
        if (!feature) return false;
        try {
            return match(feature);
        } catch (err) {
            return false;
        }
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

export function makeCoordinatesFromGeoPoint(point: GeoPoint): CoordinateTuple {
    return [point.lon, point.lat];
}

export function isGeoJSONData(input: any): input is GeoShape {
    return input.coordinates != null
        && Array.isArray(input.coordinates)
        && input.type != null;
}

type JoinGeoShape = GeoShape | ESGeoShape;

export function isGeoShapePoint(shape: JoinGeoShape): shape is GeoShapePoint {
    return shape.type === GeoShapeType.Point || shape.type === ESGeoShapeType.Point;
}

export function isGeoShapePolygon(shape: JoinGeoShape): shape is GeoShapePolygon {
    return shape.type === GeoShapeType.Polygon || shape.type === ESGeoShapeType.Polygon;
}

export function isGeoShapeMultiPolygon(shape: JoinGeoShape): shape is GeoShapeMultiPolygon {
    return shape.type === GeoShapeType.MultiPolygon || shape.type === ESGeoShapeType.MultiPolygon;
}
