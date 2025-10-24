import { DataTypeFields, FieldType } from '@terascope/types';
import {
    isNumber, isBigInt, getTypeOf, isArrayLike,
    TSError,
} from '@terascope/core-utils';
import { ipToInt, isIP } from '@terascope/ip-utils';
import { ListVector } from './ListVector.js';
import {
    AnyVector, BigIntVector, BooleanVector, DateVector,
    FloatVector, GeoJSONVector, GeoPointVector, IntVector,
    ObjectVector, StringVector, IPVector, IPRangeVector,
    TupleVector, GeoBoundaryVector,
} from './types/index.js';
import { Vector, VectorOptions } from './Vector.js';
import { DataBuckets } from './interfaces.js';

export function _newVector<T>(
    data: DataBuckets<any>,
    options: VectorOptions
): Vector<T> {
    const fieldType = options.config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (options.config.array) {
        return new ListVector(data, options) as Vector<any>;
    }

    return _newVectorForType(data, options) as Vector<T>;
}

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
function _newVectorForType(
    data: DataBuckets<any>,
    options: VectorOptions
): Vector<any> {
    switch (options.config.type as FieldType) {
        case FieldType.String:
        case FieldType.Text:
        case FieldType.Keyword:
        case FieldType.KeywordCaseInsensitive:
        case FieldType.KeywordTokens:
        case FieldType.KeywordTokensCaseInsensitive:
        case FieldType.KeywordPathAnalyzer:
        case FieldType.Domain:
        case FieldType.Hostname:
            return new StringVector(data, options);
        case FieldType.IP:
            return new IPVector(data, options);
        case FieldType.IPRange:
            return new IPRangeVector(data, options);
        case FieldType.Date:
            return new DateVector(data, options);
        case FieldType.Boolean:
            return new BooleanVector(data, options);
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector(data, options);
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector(data, options);
        case FieldType.Long:
            return new BigIntVector(data, options);
        case FieldType.Boundary:
            return new GeoBoundaryVector(data, options);
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointVector(data, options);
        case FieldType.GeoJSON:
            return new GeoJSONVector(data, options);
        case FieldType.Object:
            return new ObjectVector(data, options);
        case FieldType.Tuple:
            return new TupleVector(data, options);
        default:
            return new AnyVector(data, options);
    }
}

export type ParsedNumericObject = { original?: string; parsed: number | bigint };
type NumericValuesResult = {
    readonly values: number[];
    readonly type: 'number';
} | {
    readonly values: bigint[];
    readonly type: 'bigint';
} | {
    readonly values: ParsedNumericObject[];
    readonly type: 'bigint';
};

/**
 * Get all of the numeric values from a value or Vector
 * (will return as [] of number|bigint UNLESS allowing IP and value is IP,
 * then will return object with original value and parsed to number)
*/
export function getNumericValues(value: unknown, allowIP = false): NumericValuesResult {
    return _getNumericValues(
        { type: 'number', values: [] },
        value,
        allowIP
    );
}

/**
 * An interval function for doing recursion, made for getNumericValues
*/
function _getNumericValues(
    curr: NumericValuesResult, v: unknown, allowIP: boolean
): NumericValuesResult {
    let val = v;
    if (val == null) return curr;

    if (isArrayLike(val)) {
        let res: NumericValuesResult = curr;
        for (const nested of val) {
            res = _getNumericValues(res, nested, allowIP);
        }
        return res;
    }

    let valueIsIP = false;
    if (typeof val === 'string') {
        valueIsIP = isIP(val);
        if (valueIsIP) {
            if (!allowIP) {
                throw new Error(`Invalid to numeric values in ${v} (${getTypeOf(v)})`);
            }
            val = ipToInt(val);
        }
    }

    if (!isNumber(val) && !isBigInt(val)) {
        if (!Number.isNaN(val)) {
            throw new Error(`Invalid to numeric values in ${val} (${getTypeOf(val)})`);
        }
    }

    const changesToBigInt = curr.type === 'number' && isBigInt(val);

    if (valueIsIP) {
        (curr.values as ParsedNumericObject[]).push({
            parsed: val as bigint | number, original: v as string
        });
    } else {
        (curr.values as (number | bigint)[]).push(val as number | bigint);
    }

    return {
        type: changesToBigInt ? 'bigint' : curr.type,
        values: curr.values
    } as NumericValuesResult;
}

export function isNumberLike(type: FieldType): boolean {
    if (type === FieldType.Long) return true;
    if (type === FieldType.IP) return true;
    return isFloatLike(type) || isIntLike(type);
}

export function isFloatLike(type: FieldType): boolean {
    if (type === FieldType.Float) return true;
    if (type === FieldType.Number) return true;
    if (type === FieldType.Double) return true;
    return false;
}

export function isIntLike(type: FieldType): boolean {
    if (type === FieldType.Byte) return true;
    if (type === FieldType.Short) return true;
    if (type === FieldType.Integer) return true;
    return false;
}

export function isStringLike(type: FieldType): boolean {
    if (type === FieldType.String) return true;
    if (type === FieldType.Text) return true;
    if (type === FieldType.Keyword) return true;
    if (type === FieldType.KeywordCaseInsensitive) return true;
    if (type === FieldType.KeywordPathAnalyzer) return true;
    if (type === FieldType.KeywordTokens) return true;
    if (type === FieldType.KeywordTokensCaseInsensitive) return true;
    if (type === FieldType.Domain) return true;
    if (type === FieldType.Hostname) return true;
    return false;
}

/**
 * Given two field types, return a common field type format.
 * This will be flexible for string like and number like values.
*/
export function getCommonFieldType(field: string, a: FieldType, b: FieldType): FieldType {
    if (a === b) return a;

    if (a === FieldType.Any || b === FieldType.Any) return FieldType.Any;

    // make sure we upgrade to long
    if (a === FieldType.Long || isIntLike(b)) return FieldType.Long;
    // make sure we upgrade to long
    if (isIntLike(a) || b === FieldType.Long) return FieldType.Long;
    if (isIntLike(a) && isIntLike(b)) return FieldType.Integer;
    if (isFloatLike(a) && isFloatLike(b)) return FieldType.Float;
    // fall back if there is mix-match between number types
    if (isNumberLike(a) && isNumberLike(b)) return FieldType.Number;

    if (isStringLike(a) && isStringLike(b)) return FieldType.String;
    if (a === FieldType.Geo && b === FieldType.GeoPoint) return FieldType.GeoPoint;
    if (a === FieldType.GeoPoint && b === FieldType.Geo) return FieldType.GeoPoint;

    throw new TSError(`Field "${field}" has conflicting field types, ${a} incompatible with ${b}`, {
        statusCode: 400,
        context: { safe: true }
    });
}

export function getCommonTupleType(
    tupleField: string, childConfig: DataTypeFields | undefined
): FieldType {
    let fieldType: FieldType | undefined;
    for (const config of Object.values(childConfig ?? {})) {
        const type = config.type as FieldType;

        if (!fieldType) {
            fieldType = type;
        } else {
            fieldType = getCommonFieldType(tupleField, fieldType, type);
        }
    }

    if (!fieldType) {
        throw new TSError(
            `Field "${tupleField}" has no child fields`,
            { statusCode: 400, context: { safe: true } }
        );
    }

    return fieldType;
}
