import { geoPointWithinRangeConfig } from './geoPointWithinRange';
import { geoContainsPointConfig } from './geoShapeContainsPoint';
import { inGeoBoundingBoxConfig } from './inGeoBoundingBox';
import { isGeoJSONConfig } from './isGeoJSON';
import { isGeoPointConfig } from './isGeoPoint';
import { isGeoShapeMultiPolygonConfig } from './isGeoShapeMultiPolygon';
import { isGeoShapePointConfig } from './isGeoShapePoint';
import { isGeoShapePolygonConfig } from './isGeoShapePolygon';
import { toGeoPointConfig } from './toGeoPoint';

export const geoRepository = {
    geoPointWithinRange: geoPointWithinRangeConfig,
    geoContainsPoint: geoContainsPointConfig,
    inGeoBoundingBox: inGeoBoundingBoxConfig,
    isGeoJSON: isGeoJSONConfig,
    isGeoPoint: isGeoPointConfig,
    isGeoShapeMultiPolygon: isGeoShapeMultiPolygonConfig,
    isGeoShapePoint: isGeoShapePointConfig,
    isGeoShapePolygon: isGeoShapePolygonConfig,
    toGeoPoint: toGeoPointConfig,
};
