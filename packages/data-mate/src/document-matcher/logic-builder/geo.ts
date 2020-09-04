import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-expect-error
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString } from '@turf/helpers';
import { parseGeoPoint } from '@terascope/utils';
import { GeoDistance, GeoBoundingBox } from 'xlucene-parser';
import { BooleanCB } from '../interfaces';

// TODO: we can delete this file when we remove old geo grammar syntax

const testGeoPolygon = (polygon: any) => (fieldData: string) => {
    const point = parseGeoPoint(fieldData, false);
    if (!point) return false;
    return pointInPolygon([point.lon, point.lat], polygon);
};

export function geoDistance(node: GeoDistance): BooleanCB {
    const {
        distance, unit, lat, lon
    } = node;
    const geoPoint = [lon, lat];
    const config = { units: unit };
    let polygon: createCircle;

    if (lat != null && lon != null) {
        polygon = createCircle(
            geoPoint,
            distance,
            config
        );
    }

    // Nothing matches so return false
    if (polygon == null) return () => false;
    return testGeoPolygon(polygon);
}

export function geoBoundingBox(node: GeoBoundingBox): BooleanCB {
    const topLeft = [node.top_left.lon, node.top_left.lat];
    const bottomRight = [node.bottom_right.lon, node.bottom_right.lat];

    const line = lineString([
        topLeft,
        bottomRight,
    ]);

    const box = bbox(line);
    const polygon = bboxPolygon(box);

    // Nothing matches so return false
    if (polygon == null) return () => false;
    return testGeoPolygon(polygon);
}
