import geoHash from 'latlon-geohash';
import { Units } from '@turf/helpers';
import { toNumber, trimAndToLower, isPlainObject, parseNumberList, isNumber } from '@terascope/utils';
import { GeoDistanceObj, GeoPointInput } from './interfaces';
import { Range, GeoPoint } from './parser/interfaces';

export function isInfiniteValue(input?: number|string) {
    return input === '*' || input === Number.NEGATIVE_INFINITY || input === Number.POSITIVE_INFINITY;
}

export function isInfiniteMin(min?: number|string) {
    if (min == null) return false;
    return min === '*' || min === Number.NEGATIVE_INFINITY;
}

export function isInfiniteMax(max?: number|string) {
    if (max == null) return false;
    return max === '*' || max === Number.POSITIVE_INFINITY;
}

export interface ParsedRange {
    'gte'?: number|string;
    'gt'?: number|string;
    'lte'?: number|string;
    'lt'?: number|string;
}

export function parseRange(node: Range, excludeInfinite = false): ParsedRange {
    const results = {};

    if (!excludeInfinite || !isInfiniteValue(node.left.value)) {
        results[node.left.operator] = node.left.value;
    }

    if (node.right) {
        if (!excludeInfinite || !isInfiniteValue(node.right.value)) {
            results[node.right.operator] = node.right.value;
        }
    }
    return results;
}

export function parseGeoDistance(str: string): GeoDistanceObj {
    const trimed = trimAndToLower(str);
    const matches = trimed.match(/(\d+)(.*)$/);
    if (!matches || !matches.length) {
        throw new Error(`Incorrect geo distance parameter provided: ${str}`);
    }

    const distance = Number(matches[1]);
    const unit = parseGeoDistanceUnit(matches[2]);

    return { distance, unit };
}

export function parseGeoDistanceUnit(input: string): Units {
    const unit = GEO_DISTANCE_UNITS[input];
    if (!unit) {
        throw new Error(`Incorrect distance unit provided: ${input}`);
    }
    return unit;
}

/** @returns {[lat, lon]} */
export function getLonAndLat(input: any, throwInvalid = true): [number, number] {
    let lat = input.lat || input.latitude;
    let lon = input.lon || input.longitude;

    if (throwInvalid && (!lat || !lon)) {
        throw new Error('geopoint must contain keys lat,lon or latitude/longitude');
    }

    lat = toNumber(lat);
    lon = toNumber(lon);
    if (throwInvalid && (!isNumber(lat) || !isNumber(lon))) {
        throw new Error('geopoint lat and lon must be numbers');
    }

    return [lat, lon];
}

export function parseGeoPoint(point: GeoPointInput | number[] | object): GeoPoint;
export function parseGeoPoint(point: GeoPointInput | number[] | object, throwInvalid: true): GeoPoint;
export function parseGeoPoint(point: GeoPointInput | number[] | object, throwInvalid: false): GeoPoint | null;
export function parseGeoPoint(point: GeoPointInput | number[] | object, throwInvalid = true): GeoPoint | null {
    let results = null;

    if (typeof point === 'string') {
        if (point.match(',')) {
            results = parseNumberList(point);
        } else {
            try {
                results = Object.values(geoHash.decode(point));
            } catch (err) {}
        }
    } else if (Array.isArray(point)) {
        results = parseNumberList(point);
    } else if (isPlainObject(point)) {
        results = getLonAndLat(point, throwInvalid);
    }

    if (throwInvalid && (!results || results.length !== 2)) {
        throw new Error(`incorrect point given to parse, point:${point}`);
    }

    // data incoming is lat,lon and we must return lon,lat
    if (results) {
        return {
            lat: results[0],
            lon: results[1],
        };
    }
    return null;
}

const mileUnits = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
};

const nmileUnits = {
    NM:'nauticalmiles',
    nmi: 'nauticalmiles',
    nauticalmile: 'nauticalmiles',
    nauticalmiles: 'nauticalmiles'
};

const inchUnits = {
    in: 'inches',
    inch: 'inches',
    inches: 'inches'
};

const yardUnits = {
    yd: 'yards',
    yard: 'yards',
    yards: 'yards'
};

const meterUnits = {
    m: 'meters',
    meter: 'meters',
    meters: 'meters'
};

const kilometerUnits = {
    km: 'kilometers',
    kilometer: 'kilometers',
    kilometers: 'kilometers'
};

const millimeterUnits = {
    mm: 'millimeters',
    millimeter: 'millimeters',
    millimeters: 'millimeters'
};

const centimetersUnits = {
    cm: 'centimeters',
    centimeter: 'centimeters',
    centimeters: 'centimeters'
};

const feetUnits = {
    ft: 'feet',
    feet: 'feet'
};

export const GEO_DISTANCE_UNITS = {
    ...mileUnits,
    ...nmileUnits,
    ...inchUnits,
    ...yardUnits,
    ...meterUnits,
    ...kilometerUnits,
    ...millimeterUnits,
    ...centimetersUnits,
    ...feetUnits
};
