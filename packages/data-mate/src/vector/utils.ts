import {
    FieldType
} from '@terascope/types';
import {
    isNumber, isBigInt, getTypeOf
} from '@terascope/utils';
import { ListVector } from './ListVector';
import {
    AnyVector, BigIntVector, BooleanVector, DateVector,
    FloatVector, GeoJSONVector, GeoPointVector, IntVector,
    ObjectVector, StringVector, IPVector, IPRangeVector,
} from './types';
import { Vector, VectorOptions } from './Vector';
import { ReadableData } from '../core';

export function _newVector<T>(
    data: ReadableData<any>,
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
    data: ReadableData<any>,
    options: VectorOptions
) {
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
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointVector(data, options);
        case FieldType.GeoJSON:
            return new GeoJSONVector(data, options);
        case FieldType.Object:
            return new ObjectVector(data, options);
        default:
            return new AnyVector(data, options);
    }
}

/**
 * Get all of the numeric values from a value or Vector
*/
export function getNumericValues(value: unknown): {
    values: number[],
    type: 'number'
}|{
    values: bigint[],
    type: 'bigint'
} {
    if (value == null) {
        return { values: [], type: 'number' };
    }

    if (isNumber(value)) {
        return { values: [value], type: 'number' };
    }
    if (isBigInt(value)) {
        return { values: [value], type: 'bigint' };
    }

    if (value instanceof IntVector || value instanceof FloatVector) {
        return {
            values: [...value.data.values.values()],
            type: 'number'
        };
    }

    if (value instanceof BigIntVector) {
        return {
            values: [...value.data.values.values()],
            type: 'bigint'
        };
    }

    throw new Error(`Unable to get numeric values from ${value} (${getTypeOf(value)})`);
}

export function isNumberLike(type: FieldType): boolean {
    if (type === FieldType.Long) return true;
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
