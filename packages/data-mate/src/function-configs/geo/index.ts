import { geoContainsConfig } from './geoContains';
import { geoContainsPointConfig } from './geoContainsPoint';
import { geoDisjointConfig } from './geoDisjoint';
import { geoIntersectsConfig } from './geoIntersects';
import { geoPointWithinRangeConfig } from './geoPointWithinRange';
import { geoRelationConfig } from './geoRelation';
import { geoWithinConfig } from './geoWithin';
import { inGeoBoundingBoxConfig } from './inGeoBoundingBox';
import { isGeoJSONConfig } from './isGeoJSON';
import { isGeoPointConfig } from './isGeoPoint';
import { isGeoShapeMultiPolygonConfig } from './isGeoShapeMultiPolygon';
import { isGeoShapePointConfig } from './isGeoShapePoint';
import { isGeoShapePolygonConfig } from './isGeoShapePolygon';
import { toGeoJSONConfig } from './toGeoJSON';
import { toGeoPointConfig } from './toGeoPoint';

export const geoRepository = {
    geoContains: geoContainsConfig,
    geoPointWithinRange: geoPointWithinRangeConfig,
    geoDisjoint: geoDisjointConfig,
    geoIntersects: geoIntersectsConfig,
    geoRelation: geoRelationConfig,
    geoWithin: geoWithinConfig,
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
