import type { Client } from '../client/index.js';

export function isValidClient(input: unknown): input is Client {
    if (input == null) return false;
    if (typeof input !== 'object') return false;

    const reqKeys = ['indices', 'index', 'get', 'search'];

    return reqKeys.every((key) => (input as any)[key] != null);
}

export function validateGeoParameters(opConfig: Record<string, any>) {
    const {
        geo_field: geoField,
        geo_box_top_left: geoBoxTopLeft,
        geo_box_bottom_right: geoBoxBottomRight,
        geo_point: geoPoint,
        geo_distance: geoDistance,
        geo_sort_point: geoSortPoint,
        geo_sort_order: geoSortOrder,
        geo_sort_unit: geoSortUnit,
    } = opConfig;

    function isBoundingBoxQuery() {
        return geoBoxTopLeft && geoBoxBottomRight;
    }

    function isGeoDistanceQuery() {
        return geoPoint && geoDistance;
    }

    if (geoBoxTopLeft && geoPoint) {
        throw new Error('geo_box and geo_distance queries can not be combined.');
    }

    if ((geoPoint && !geoDistance) || (!geoPoint && geoDistance)) {
        throw new Error(
            'Both geo_point and geo_distance must be provided for a geo_point query.'
        );
    }

    if ((geoBoxTopLeft && !geoBoxBottomRight) || (!geoBoxTopLeft && geoBoxBottomRight)) {
        throw new Error(
            'Both geo_box_top_left and geo_box_bottom_right must be provided for a geo bounding box query.'
        );
    }

    if (geoBoxTopLeft && (geoSortOrder || geoSortUnit) && !geoSortPoint) {
        throw new Error(
            'bounding box search requires geo_sort_point to be set if any other geo_sort_* parameter is provided'
        );
    }

    if ((geoBoxTopLeft || geoPoint || geoDistance || geoSortPoint) && !geoField) {
        throw new Error(
            'geo box search requires geo_field to be set if any other geo query parameters are provided'
        );
    }

    if (geoField && !(isBoundingBoxQuery() || isGeoDistanceQuery())) {
        throw new Error(
            'if geo_field is specified then the appropriate geo_box or geo_distance query parameters need to be provided as well'
        );
    }
}
