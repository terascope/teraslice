import {
    DataTypeFieldConfig, ReadonlyDataTypeFields, FieldType
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
import { Vector } from './Vector';
import { ReadableData } from '../data';

export function _newVector<T>(
    config: Readonly<DataTypeFieldConfig>,
    data: ReadableData<any>,
    childConfig?: ReadonlyDataTypeFields
): Vector<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListVector({
            config,
            data,
            childConfig,
        }) as Vector<any>;
    }

    return _newVectorForType(config, data, childConfig) as Vector<T>;
}

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
function _newVectorForType(
    config: Readonly<DataTypeFieldConfig>,
    data: ReadableData<any>,
    childConfig?: ReadonlyDataTypeFields
) {
    switch (config.type as FieldType) {
        case FieldType.String:
        case FieldType.Text:
        case FieldType.Keyword:
        case FieldType.KeywordCaseInsensitive:
        case FieldType.KeywordTokens:
        case FieldType.KeywordTokensCaseInsensitive:
        case FieldType.KeywordPathAnalyzer:
        case FieldType.Domain:
        case FieldType.Hostname:
            return new StringVector({ config, data });
        case FieldType.IP:
            return new IPVector({ config, data });
        case FieldType.IPRange:
            return new IPRangeVector({ config, data });
        case FieldType.Date:
            return new DateVector({ config, data });
        case FieldType.Boolean:
            return new BooleanVector({ config, data });
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector({ config, data });
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector({ config, data });
        case FieldType.Long:
            return new BigIntVector({ config, data });
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointVector({ config, data });
        case FieldType.GeoJSON:
            return new GeoJSONVector({ config, data });
        case FieldType.Object:
            return new ObjectVector({ config, data, childConfig });
        default:
            return new AnyVector({ config, data });
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
            values: _getAllValues(value.data.values),
            type: 'number'
        };
    }

    if (value instanceof BigIntVector) {
        return {
            values: _getAllValues(value.data.values),
            type: 'bigint'
        };
    }

    throw new Error(`Unable to get numeric values from input ${getTypeOf(value)}`);
}
function _getAllValues(values: readonly Readonly<{ value: any, indices: readonly number[] }>[]) {
    const result: any[] = [];
    for (const value of values) {
        result.push(..._getValues(value));
    }
    return result;
}
function _getValues(v: { value: any, indices: readonly number[] }) {
    return Array.from({ length: v.indices.length }, () => v.value);
}

export function isNumberLike(type: FieldType): boolean {
    if (type === FieldType.Long) return true;
    return isFloatLike(type) || isIntLike(type);
}

export function isFloatLike(type: FieldType): boolean {
    if (type === FieldType.Float) return true;
    if (type === FieldType.Number) return true;
    if (type === FieldType.Double) return true;
    return true;
}

export function isIntLike(type: FieldType): boolean {
    if (type === FieldType.Byte) return true;
    if (type === FieldType.Short) return true;
    if (type === FieldType.Integer) return true;
    return true;
}
