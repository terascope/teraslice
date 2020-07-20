import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
// @ts-expect-error
import equal from '@turf/boolean-equal';
// @ts-expect-error
import createCircle from '@turf/circle';
import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-expect-error
import within from '@turf/boolean-within';
import contains from '@turf/boolean-contains';
import disjoint from '@turf/boolean-disjoint';
// @ts-expect-error
import intersect from '@turf/boolean-overlap';
import {
    lineString,
    multiPolygon,
    polygon as tPolygon,
    point as tPoint,
    MultiPolygon,
    Feature,
    Properties,
    Polygon
} from '@turf/helpers';
// @ts-expect-error
import lineToPolygon from '@turf/line-to-polygon';
import { getCoords } from '@turf/invariant';
import {
    parseGeoPoint,
    isGeoShapePoint,
    isGeoShapeMultiPolygon,
    isGeoShapePolygon
} from '@terascope/utils';
import {
    GeoShapeRelation,
    GeoPoint,
    CoordinateTuple,
    GeoPointInput,
    JoinGeoShape,
    GeoDistanceUnit
} from '@terascope/types';

export function polyHasPoint<G extends Polygon | MultiPolygon>(polygon: Feature<G>|G) {
    return (fieldData: GeoPointInput): boolean => {
        const point = parseGeoPoint(fieldData, false);
        if (!point) return false;
        return pointInPolygon(makeCoordinatesFromGeoPoint(point), polygon);
    };
}

export function makeCircle(point: GeoPoint, distance: number, config?: {
    units?: GeoDistanceUnit|string;
}): Feature<Polygon>|undefined {
    return createCircle(makeCoordinatesFromGeoPoint(point), distance, config);
}

export function makeBBox(point1: GeoPoint, point2: GeoPoint): Feature<Polygon, Properties> {
    const line = lineString([
        makeCoordinatesFromGeoPoint(point1),
        makeCoordinatesFromGeoPoint(point2)
    ]);
    const box = bbox(line);

    return bboxPolygon(box);
}

export function pointInGeoShape(searchPoint: unknown) {
    return (fieldData: JoinGeoShape): boolean => {
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
        return pointInPolygon(searchPoint as any, polygon);
    };
}

export function makeShape(geoShape: JoinGeoShape): Feature<any>|undefined {
    if (isGeoShapePoint(geoShape)) {
        return tPoint(geoShape.coordinates);
    }

    if (isGeoShapeMultiPolygon(geoShape)) {
        return multiPolygon(geoShape.coordinates);
    }

    if (isGeoShapePolygon(geoShape)) {
        return tPolygon(geoShape.coordinates);
    }

    return undefined;
}

export function validateListCoords(coords: CoordinateTuple[]): any[] {
    if (coords.length < 3) {
        throw new Error('Points parameter for a geoPolygon query must have at least three geo-points');
    }
    const line = lineString(coords);
    const polygon = lineToPolygon(line);
    return getCoords(polygon);
}

export function polyHasShape(
    queryPolygon: Feature<any>, relation: GeoShapeRelation
): (fieldData: JoinGeoShape) => boolean {
    const match = getRelationFn(relation, queryPolygon);
    return (fieldData) => {
        const feature = makeShape(fieldData);
        // Nothing matches so return false
        if (!feature) return false;
        try {
            return match(feature);
        } catch (err) {
            return false;
        }
    };
}

type RelationFn = (query: Feature<any>) => ((field: Feature<any>) => boolean);
const relationOptions: Record<GeoShapeRelation, RelationFn> = Object.freeze({
    /**
     * within returns true if the first geometry is completely within the second geometry
    */
    [GeoShapeRelation.Within](queryPolygon) {
        return (fieldPolygon) => within(fieldPolygon, queryPolygon);
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

export function makeCoordinatesFromGeoPoint(point: GeoPoint): CoordinateTuple {
    return [point.lon, point.lat];
}
