import {
    GeoDistanceUnit,
    GEO_DISTANCE_UNITS,
    GeoPointInput,
    GeoPoint,
    GeoDistanceObj,
    GeoShapeType,
    JoinGeoShape,
    ESGeoShapeType,
    GeoShapePoint,
    GeoShapePolygon,
    GeoShapeMultiPolygon
} from '@terascope/types';
import geoHash from 'latlon-geohash';
import { isPlainObject } from './objects';
import { trim } from './strings';
import { parseNumberList, toNumber, isNumber } from './numbers';
import { TSError } from './errors';

export const geoJSONTypes = Object.keys(GeoShapeType).map((key) => key.toLowerCase());

export function isGeoJSON(input: any) {
    return isPlainObject(input)
        && Array.isArray(input.coordinates)
        && geoJSONTypes.includes(input.type.toLowerCase());
}

export function isGeoShapePoint(input: JoinGeoShape): input is GeoShapePoint {
    return isGeoJSON(input)
    && (input.type === GeoShapeType.Point || input.type === ESGeoShapeType.Point);
}

export function isGeoShapePolygon(input: JoinGeoShape): input is GeoShapePolygon {
    return isGeoJSON(input)
    && (input.type === GeoShapeType.Polygon || input.type === ESGeoShapeType.Polygon);
}

export function isGeoShapeMultiPolygon(input: JoinGeoShape): input is GeoShapeMultiPolygon {
    return isGeoJSON(input)
    && (input.type === GeoShapeType.MultiPolygon || input.type === ESGeoShapeType.MultiPolygon);
}

export function parseGeoDistance(str: string): GeoDistanceObj {
    const matches = trim(str).match(/(\d+)(.*)$/);

    if (!matches || !matches.length) {
        throw new Error(`Incorrect geo distance parameter provided: ${str}`);
    }

    const distance = Number(matches[1]);
    const unit = parseGeoDistanceUnit(matches[2]);

    return { distance, unit };
}

export function parseGeoDistanceUnit(input: string): GeoDistanceUnit {
    const unit = GEO_DISTANCE_UNITS[trim(input)];
    if (!unit) {
        throw new Error(`Incorrect distance unit provided: ${input}`);
    }
    return unit;
}

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
