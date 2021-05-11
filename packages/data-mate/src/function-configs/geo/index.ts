import { geoContainsPointConfig } from './geoContainsPoint';
import { geoPointWithinRangeConfig } from './geoPointWithinRange';
import { geoRelationConfig } from './geoRelation';
import { inGeoBoundingBoxConfig } from './inGeoBoundingBox';
import { isGeoJSONConfig } from './isGeoJSON';
import { isGeoPointConfig } from './isGeoPoint';
import { isGeoShapeMultiPolygonConfig } from './isGeoShapeMultiPolygon';
import { isGeoShapePointConfig } from './isGeoShapePoint';
import { isGeoShapePolygonConfig } from './isGeoShapePolygon';
import { toGeoJSONConfig } from './toGeoJSON';
import { toGeoPointConfig } from './toGeoPoint';

export const geoRepository = {
    geoPointWithinRange: geoPointWithinRangeConfig,
    geoRelation: geoRelationConfig,
    geoContainsPoint: geoContainsPointConfig,
    inGeoBoundingBox: inGeoBoundingBoxConfig,
    isGeoJSON: isGeoJSONConfig,
    isGeoPoint: isGeoPointConfig,
    isGeoShapeMultiPolygon: isGeoShapeMultiPolygonConfig,
    isGeoShapePoint: isGeoShapePointConfig,
    isGeoShapePolygon: isGeoShapePolygonConfig,
    toGeoJSON: toGeoJSONConfig,
    toGeoPoint: toGeoPointConfig,
};
