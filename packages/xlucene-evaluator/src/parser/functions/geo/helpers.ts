
import pointInPolygon from '@turf/boolean-point-in-polygon';
import { parseGeoPoint } from '../../../utils';

// we curently do not have proper types for turf
export function geoMatcher(polygon: any) {
    return (fieldData: string) => {
        const point = parseGeoPoint(fieldData, false);
        if (!point) return false;
        return pointInPolygon([point.lon, point.lat], polygon);
    };
}
