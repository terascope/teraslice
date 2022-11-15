import { geoContainsConfig, GeoContainsArgs } from './geoContains.js';
import { geoContainsPointConfig, GeoContainsPointArgs } from './geoContainsPoint.js';
import { geoDisjointConfig, GeoDisjointArgs } from './geoDisjoint.js';
import { geoIntersectsConfig, GeoIntersectsArgs } from './geoIntersects.js';
import { geoPointWithinRangeConfig, GeoPointWithinRangeArgs } from './geoPointWithinRange.js';
import { geoRelationConfig, GeoRelationArgs } from './geoRelation.js';
import { geoWithinConfig, GeoWithinArgs } from './geoWithin.js';
import { inGeoBoundingBoxConfig, InGeoBoundingBoxArgs } from './inGeoBoundingBox.js';
import { isGeoJSONConfig } from './isGeoJSON.js';
import { isGeoPointConfig } from './isGeoPoint.js';
import { isGeoShapeMultiPolygonConfig } from './isGeoShapeMultiPolygon.js';
import { isGeoShapePointConfig } from './isGeoShapePoint.js';
import { isGeoShapePolygonConfig } from './isGeoShapePolygon.js';
import { toGeoJSONConfig } from './toGeoJSON.js';
import { toGeoPointConfig } from './toGeoPoint.js';

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
