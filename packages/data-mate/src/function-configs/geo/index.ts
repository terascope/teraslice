import { isGeoJSONConfig } from './isGeoJSON';
import { isGeoPointConfig } from './isGeoPoint';
import { isGeoShapeMultiPolygonConfig } from './isGeoShapeMultiPolygon';
import { isGeoShapePointConfig } from './isGeoShapePoint';
import { isGeoShapePolygonConfig } from './isGeoShapePolygon';
import { pointInBoundingBoxConfig } from './pointInBoundingBox';
import { toGeoPointConfig } from './toGeoPoint';

export const geoRepository = {
    isGeoJSON: isGeoJSONConfig,
    isGeoPoint: isGeoPointConfig,
    isGeoShapeMultiPolygon: isGeoShapeMultiPolygonConfig,
    isGeoShapePoint: isGeoShapePointConfig,
    isGeoShapePolygon: isGeoShapePolygonConfig,
    pointInBoundingBox: pointInBoundingBoxConfig,
    toGeoPoint: toGeoPointConfig,
};
