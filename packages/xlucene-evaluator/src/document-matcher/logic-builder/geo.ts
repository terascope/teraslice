
import pointInPolygon from '@turf/boolean-point-in-polygon';
// @ts-ignore
import createCircle from '@turf/circle';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import { lineString } from '@turf/helpers';

import { parseGeoPoint } from '../../utils';
import { GeoDistance, GeoBoundingBox } from '../../parser';

const testGeoPolygon = (polygon: any) => (fieldData: string) => {
    const point = parseGeoPoint(fieldData, false);
    if (!point) return false;
    return pointInPolygon(point, polygon);
};

export function geoDistance(node:GeoDistance) {
    const { distance, unit, lat, lon } = node;
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

export function geoBoundingBox(node:GeoBoundingBox) {
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
