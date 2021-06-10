import { geoContainsConfig, GeoContainsArgs } from './geoContains';
import { geoContainsPointConfig, GeoContainsPointArgs } from './geoContainsPoint';
import { geoDisjointConfig, GeoDisjointArgs } from './geoDisjoint';
import { geoIntersectsConfig, GeoIntersectsArgs } from './geoIntersects';
import { geoPointWithinRangeConfig, GeoPointWithinRangeArgs } from './geoPointWithinRange';
import { geoRelationConfig, GeoRelationArgs } from './geoRelation';
import { geoWithinConfig, GeoWithinArgs } from './geoWithin';
import { inGeoBoundingBoxConfig, InGeoBoundingBoxArgs } from './inGeoBoundingBox';
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

export type {
    GeoContainsArgs,
    GeoContainsPointArgs,
    GeoDisjointArgs,
    GeoIntersectsArgs,
    GeoPointWithinRangeArgs,
    GeoRelationArgs,
    GeoWithinArgs,
    InGeoBoundingBoxArgs
};
