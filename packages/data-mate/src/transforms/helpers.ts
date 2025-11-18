import { startsWith } from '@terascope/core-utils';
import {
    parseGeoPoint, isGeoJSON, isGeoShapePolygon,
    isGeoShapeMultiPolygon
} from '@terascope/geo-utils';
import {
    GeoPointInput, xLuceneTypeConfig, xLuceneVariables,
    xLuceneFieldType, GeoShapeRelation
} from '@terascope/types';
import { isGeoShapePoint } from '../validations/field-validator.js';

// TODO: move these
export type JoinBy = 'AND' | 'OR';

export interface xLuceneQueryResult {
    query: string;
    variables: xLuceneVariables;
}

export type CreateJoinQueryOptions = {
    typeConfig?: xLuceneTypeConfig;
    fieldParams?: Record<string, string>;
    joinBy?: JoinBy;
    variables?: Record<string, any>;
};

function isGeoQuery(type: xLuceneFieldType) {
    return isGeoPointType(type) || isGeoJSONType(type);
}

function isGeoPointType(type: xLuceneFieldType) {
    return type === xLuceneFieldType.Geo || type === xLuceneFieldType.GeoPoint;
}

function isGeoJSONType(type: xLuceneFieldType) {
    return type === xLuceneFieldType.GeoJSON;
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
    targetType: xLuceneFieldType,
    fieldParam?: string
) {
    if (isGeoJSON(value)) {
        if (isGeoShapePolygon(value) || isGeoShapeMultiPolygon(value)) {
            // geoPolygon internally takes care of poly/multi-polygon.
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

export function toXluceneQuery(
    input: Record<string, any>,
    options: CreateJoinQueryOptions = {}
): xLuceneQueryResult {
    const {
        fieldParams = {},
        joinBy = 'AND',
        typeConfig = {},
        variables
    } = options;

    const variableState = new VariableState(variables);
    const query = Object.entries(input)
        .map(([field, val]) => {
            if (val == null) return '';

            const config = typeConfig[field];

            if (isGeoQuery(config)) {
                return createGeoQuery(
                    variableState,
                    field,
                    val,
                    config,
                    fieldParams[field]
                );
            }

            const value = variableState.createVariable(field, val);
            return `${field}: ${value}`;
        })
        .filter(Boolean)
        .join(` ${joinBy} `)
        .trim();

    const finalVariables = variableState.getVariables();
    return { query, variables: finalVariables };
}

export class VariableState {
    private variables: Record<string, any>;

    constructor(variables?: Record<string, any>) {
        this.variables = { ...variables };
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

    createVariable(field: string, value: unknown): string {
        if (typeof value === 'string' && startsWith(value, '$')) {
            const vField = value.slice(1);
            if (this.variables[vField] === undefined) {
                throw new Error(`Must provide variable "${vField}" in the variables config`);
            }
            return value;
        }
        const key = this._makeKey(field);
        this.variables[key] = value;
        return `$${key}`;
    }

    /**
     * Shallow clones and sorts the keys
    */
    getVariables(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const key of Object.keys(this.variables).sort()) {
            result[key] = this.variables[key];
        }
        return result;
    }
}
