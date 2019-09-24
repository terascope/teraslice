
import { parseGeoDistance, parseGeoPoint } from '../../../utils';
import * as i from '../../interfaces';

export function geoDistance(params: i.Term[]) {
    const distanceParam = params.find((node) => node.field === 'distance');
    const geoPointParam = params.find((node) => node.field === 'point');

    if (distanceParam == null) throw new Error('geoDistance query needs to specify a "distance" parameter');
    if (geoPointParam == null) throw new Error('geoDistance query needs to specify a "point" parameter');

    const point = parseGeoPoint(geoPointParam.value as string);
    const distance = parseGeoDistance(distanceParam.value as string);

    return {
        type: i.ASTType.GeoDistance,
        ...point,
        ...distance
    };
}

export function geoBox(params: i.Term[]) {
    const topLeftParam = params.find((node) => node.field === 'top_left');
    const bottomRightParam = params.find((node) => node.field === 'bottom_right');

    if (topLeftParam == null) throw new Error('geoBox query needs to specify a "topLeft" parameter');
    if (bottomRightParam == null) throw new Error('geoBox query needs to specify a "bottomRight" parameter');

    return {
        type: i.ASTType.GeoBoundingBox,
        top_left: parseGeoPoint(topLeftParam.value as string),
        bottom_right: parseGeoPoint(bottomRightParam.value as string)
    };
}

export function geoPolygon(params: i.Term[]) {
    const geoPointsParam = params.find((node) => node.field === 'points');
    if (geoPointsParam == null) throw new Error('geoPolygon query needs to specify a "points" parameter');
    if (!Array.isArray(geoPointsParam.value)) throw new Error('points parameter must be an array');
    // @ts-ignore we are ignoreing util we have a better story around list expressions
    const points = geoPointsParam.value.map((node) => {
        if (!node.value) throw new Error('points parameter must be an array of string values')
        return parseGeoPoint(node.value);
    });
    if (points.length < 3) throw new Error('geoPolygon points parameter must have at least three points');

    return {
        type: i.ASTType.GeoPolygon,
        points
    };
}
