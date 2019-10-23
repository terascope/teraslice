import geoHash from 'latlon-geohash';
import {
    trim, toNumber, isPlainObject, parseNumberList, isNumber, AnyObject, escapeString, uniq
} from '@terascope/utils';
import { Range } from './parser/interfaces';
import {
    GeoDistanceObj,
    GeoPointInput,
    GeoPoint,
    GeoDistanceUnit,
    JoinBy,
    TypeConfig,
    FieldType
} from './interfaces';

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

export const GEO_DISTANCE_UNITS: { readonly [key: string]: GeoDistanceUnit } = {
    mi: 'miles',
    miles: 'miles',
    mile: 'miles',
    NM: 'nauticalmiles',
    nmi: 'nauticalmiles',
    nauticalmile: 'nauticalmiles',
    nauticalmiles: 'nauticalmiles',
    in: 'inch',
    inch: 'inch',
    inches: 'inch',
    yd: 'yards',
    yard: 'yards',
    yards: 'yards',
    m: 'meters',
    meter: 'meters',
    meters: 'meters',
    km: 'kilometers',
    kilometer: 'kilometers',
    kilometers: 'kilometers',
    mm: 'millimeters',
    millimeter: 'millimeters',
    millimeters: 'millimeters',
    cm: 'centimeters',
    centimeter: 'centimeters',
    centimeters: 'centimeters',
    ft: 'feet',
    feet: 'feet',
};

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

export function parseGeoPoint(point: GeoPointInput): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: true): GeoPoint;
export function parseGeoPoint(point: GeoPointInput, throwInvalid: false): GeoPoint | null;
export function parseGeoPoint(point: GeoPointInput, throwInvalid = true): GeoPoint | null {
    let results = null;

    if (typeof point === 'string') {
        if (point.match(',')) {
            results = parseNumberList(point);
        } else {
            try {
                results = Object.values(geoHash.decode(point));
            } catch (err) {
                // do nothing
            }
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

export type CreateJoinQueryOptions = {
    typeConfig?: TypeConfig;
    fieldParams?: Record<string, string>;
    joinBy?: JoinBy;
    arrayJoinBy?: JoinBy;
};

export function createJoinQuery(input: AnyObject, options: CreateJoinQueryOptions = {}) {
    const {
        fieldParams = {},
        joinBy = 'AND',
        arrayJoinBy = 'AND',
        typeConfig = {}
    } = options;

    return Object.entries(input)
        .filter(([_field, val]) => {
            if (val == null) return false;
            return true;
        })
        .map(([field, val]) => {
            const fieldParam: any = fieldParams[field];
            let value: string;
            if (typeConfig[field] === FieldType.Geo) {
                const distance = fieldParam || '100m';
                const { lat, lon } = parseGeoPoint(val);
                return `${field}:geoDistance(point:"${lat},${lon}" distance:"${distance}")`;
            }

            if (Array.isArray(val)) {
                if (val.length > 1) {
                    value = `(${uniq(val)
                        .map(escapeValue)
                        .join(` ${arrayJoinBy} `)})`;
                } else {
                    value = escapeValue(val);
                }
            } else {
                value = escapeValue(val);
            }
            return `${field}: ${value}`;
        })
        .join(` ${joinBy} `);
}

function escapeValue(val: any) {
    return `"${escapeString(val)}"`;
}
