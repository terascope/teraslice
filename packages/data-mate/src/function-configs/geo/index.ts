import { geoBoxConfig } from './geoBox';
import { geoContainsPointConfig } from './geoShapeContainsPoint';
import { isGeoJSONConfig } from './isGeoJSON';
import { isGeoPointConfig } from './isGeoPoint';
import { isGeoShapeMultiPolygonConfig } from './isGeoShapeMultiPolygon';
import { isGeoShapePointConfig } from './isGeoShapePoint';
import { isGeoShapePolygonConfig } from './isGeoShapePolygon';
import { toGeoPointConfig } from './toGeoPoint';

export const geoRepository = {
    geoBox: geoBoxConfig,
    geoContainsPoint: geoContainsPointConfig,
    isGeoJSON: isGeoJSONConfig,
    isGeoPoint: isGeoPointConfig,
    isGeoShapeMultiPolygon: isGeoShapeMultiPolygonConfig,
    isGeoShapePoint: isGeoShapePointConfig,
    isGeoShapePolygon: isGeoShapePolygonConfig,
    toGeoPoint: toGeoPointConfig,
};
