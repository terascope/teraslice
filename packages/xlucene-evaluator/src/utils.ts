import geoHash from 'latlon-geohash';
import {
    trim,
    toNumber,
    isPlainObject,
    parseNumberList,
    isNumber,
    AnyObject,
    withoutNil,
    TSError,
    startsWith
} from '@terascope/utils';
import { Range, RangeNode } from './parser/interfaces';
import {
    GeoDistanceObj,
    GeoPointInput,
    GeoPoint,
    GeoDistanceUnit,
    FieldType,
    CoordinateTuple,
    GeoShapeRelation,
    JoinQueryResult,
    CreateJoinQueryOptions
} from './interfaces';
import {
    isGeoJSONData,
    isGeoShapePolygon,
    isGeoShapeMultiPolygon,
    isGeoShapePoint
} from './parser/functions/geo/helpers';

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

function isGreaterThan(node: RangeNode) {
    if (node.operator === 'gte' || node.operator === 'gt') return true;
    return false;
}

export function buildRangeQueryString(node: Range): string | undefined {
    if (node.right) {
        const leftBrace = node.left.operator === 'gte' ? '[' : '{';
        const rightBrace = node.right.operator === 'lte' ? ']' : '}';
        return `${leftBrace}${node.left.value} TO ${node.right.value}${rightBrace}`;
    }
    // cannot have a single value infinity range query
    if (isInfiniteValue(node.left.value)) return;
    // queryString cannot use ranges like >=1000, must convert to equivalent [1000 TO *]
    if (isGreaterThan(node.left)) {
        if (node.left.operator === 'gte') {
            return `[${node.left.value} TO *]`;
        }
        return `{${node.left.value} TO *]`;
    }

    if (node.left.operator === 'lte') {
        return `[* TO ${node.left.value}]`;
    }
    return `[* TO ${node.left.value}}`;
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
export function getLonAndLat(input: any, throwInvalid = true): [number, number] | null {
    let lat = input.lat || input.latitude;
    let lon = input.lon || input.longitude;

    if (isGeoShapePoint(input)) {
        [lon, lat] = input.coordinates;
    }

    if (throwInvalid && (!lat || !lon)) {
        throw new Error('Invalid geopoint object, it must contain keys lat,lon or latitude/longitude');
    }

    lat = toNumber(lat);
    lon = toNumber(lon);
    if (!isNumber(lat) || !isNumber(lon)) {
        if (throwInvalid) throw new Error('Invalid geopoint, lat and lon must be numbers');
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

const relationList = Object.values(GeoShapeRelation);

function makeXluceneGeoDistanceQuery(
    variableState: VariableState,
    field: string,
    value: GeoPointInput,
    fieldParam?: string
) {
    const dValue = fieldParam || '100m';
    const results = parseGeoPoint(value, false);
    if (!results) return '';
    const vDistance = variableState.createVariable('distance', dValue);
    const vPoint = variableState.createVariable('point', `${results.lat},${results.lon}`);
    return `${field}:geoDistance(point: ${vPoint}, distance: ${vDistance})`;
}

function makeXlucenePolyContainsPoint(
    variableState: VariableState,
    field: string,
    value: GeoPointInput
) {
    const results = parseGeoPoint(value, false);
    if (!results) return '';
    const vPoint = variableState.createVariable('point', `${results.lat},${results.lon}`);
    return `${field}:geoContainsPoint(point: ${vPoint})`;
}

export function coordinateToXlucene(cord: CoordinateTuple) {
    // tuple is [lon, lat], need to return "lat, lon"
    return `"${cord[1]}, ${cord[0]}"`;
}

function geoPolyQuery(field: string, polyVariableName: string, vParam?: string) {
    if (vParam) {
        return `${field}:geoPolygon(points: ${polyVariableName}, relation: ${vParam})`;
    }
    return `${field}:geoPolygon(points: ${polyVariableName})`;
}

function makeXlucenePolyQuery(
    variableState: VariableState,
    field: string,
    polyVariableName: string,
    fieldParam?: string
) {
    let vParam: string | undefined;

    if (fieldParam && relationList.includes(fieldParam as GeoShapeRelation)) {
        vParam = variableState.createVariable('relation', fieldParam) as string;
    }

    return geoPolyQuery(field, polyVariableName, vParam);
}

function createGeoQuery(
    variableState: VariableState,
    field: string,
    value: any,
    targetType: FieldType,
    fieldParam?: string
) {
    if (isGeoJSONData(value)) {
        if (isGeoShapePolygon(value) || isGeoShapeMultiPolygon(value)) {
            // geoPolygon internally takes care of poly/multipoly.
            // need to preserve original poly in variables
            const polyVariableName = variableState.createVariable('points', value);
            return makeXlucenePolyQuery(variableState, field, polyVariableName, fieldParam);
        }

        if (isGeoShapePoint(value)) {
            if (isGeoPointType(targetType)) {
                return makeXluceneGeoDistanceQuery(
                    variableState,
                    field,
                    value.coordinates,
                    fieldParam
                );
            }
            return makeXlucenePolyContainsPoint(variableState, field, value.coordinates);
        }
        // We do not support any other geoJSON types;
        return '';
    }
    // incoming value is a geo-point and we compare to another geo-point by geoDistance query
    if (isGeoPointType(targetType)) {
        return makeXluceneGeoDistanceQuery(variableState, field, value, fieldParam);
    }

    if (isGeoJSONType(targetType)) return makeXlucenePolyContainsPoint(variableState, field, value);
    // if here then return a noop
    return '';
}

function isGeoQuery(type: FieldType) {
    return isGeoPointType(type) || isGeoJSONType(type);
}

function isGeoPointType(type: FieldType) {
    return type === FieldType.Geo || type === FieldType.GeoPoint;
}

function isGeoJSONType(type: FieldType) {
    return type === FieldType.GeoJSON;
}

// TODO: handle variables and query from before
export function createJoinQuery(
    input: AnyObject,
    options: CreateJoinQueryOptions = {}
): JoinQueryResult {
    const {
        fieldParams = {},
        joinBy = 'AND',
        typeConfig = {},
        variables
    } = options;
    const variableState = new VariableState(variables);
    let query = '';
    const obj = withoutNil(input);

    if (Object.keys(obj).length) {
        query = Object.entries(obj)
            .map(([field, val]) => {
                if (isGeoQuery(typeConfig[field])) {
                    return createGeoQuery(
                        variableState,
                        field,
                        val,
                        typeConfig[field],
                        fieldParams[field]
                    );
                }

                const value = variableState.createVariable(field, val);
                return `${field}: ${value}`;
            })
            .join(` ${joinBy} `)
            .trim();
    }

    const finalVariables = variableState.getVaraibles();
    return { query, variables: finalVariables };
}

export class VariableState {
    private variables: AnyObject;

    constructor(variables?: AnyObject) {
        this.variables = variables || {};
    }

    private _makeKey(field: string) {
        let num = 1;
        let name = `${field}_${num}`;

        while (this.variables[name] !== undefined) {
            num += 1;
            name = `${field}_${num}`;
        }

        return name;
    }

    createVariable(field: string, value: any) {
        if (typeof value === 'string' && startsWith(value, '$')) {
            const vField = value.slice(1);
            if (this.variables[vField] === undefined) throw new Error(`Must provide variable "${vField}" in the variables config`);
            return value;
        }
        const key = this._makeKey(field);
        this.variables[key] = value;
        return `$${key}`;
    }

    getVaraibles() {
        return { ...this.variables };
    }
}
