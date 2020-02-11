import {
    toNumber,
    parseNumberList,
    isPlainObject,
    TSError
} from '@terascope/utils';
import geoHash from 'latlon-geohash';
import { isGeoShapePoint, isNumber } from '../validations/field-validator';
import { GeoPointInput, GeoPoint } from '../interfaces';

export function getLonAndLat(input: any, throwInvalid = true): [number, number] | null {
    let lat = input.lat || input.latitude;
    let lon = input.lon || input.longitude;

    if (isGeoShapePoint(input)) {
        [lon, lat] = input.coordinates;
    }

    if (throwInvalid && (!lat || !lon)) {
        throw new TSError('Invalid geopoint object, it must contain keys lat,lon or latitude/longitude');
    }

    lat = toNumber(lat);
    lon = toNumber(lon);
    if (!isNumber(lat) || !isNumber(lon)) {
        if (throwInvalid) throw new TSError('Invalid geopoint, lat and lon must be numbers');
        return null;
    }

    return [lat, lon];
}

export function parseGeoPoint(point: GeoPointInput): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: true): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: false): GeoPoint | null;
export function parseGeoPoint(point: GeoPointInput, throwInvalid = true): GeoPoint | null {
    let lat: number | undefined;
    let lon: number | undefined;

    if (typeof point === 'string') {
        if (point.match(',')) {
            [lat, lon] = parseNumberList(point);
        } else {
            try {
                [lat, lon] = Object.values(geoHash.decode(point));
            } catch (err) {
                // do nothing
            }
        }
    } else if (Array.isArray(point)) {
        // array of points are meant to be lon/lat format
        [lon, lat] = parseNumberList(point);
    } else if (isPlainObject(point)) {
        const results = getLonAndLat(point, throwInvalid);
        if (results) [lat, lon] = results;
    }

    if (throwInvalid && (lat == null || lon == null)) {
        throw new TSError(`Invalid geopoint given to parse, point:${point}`);
    }

    // data incoming is lat,lon and we must return lon,lat
    if (lat != null && lon != null) {
        return {
            lat,
            lon
        };
    }
    return null;
}
