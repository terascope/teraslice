import { createHash } from 'crypto';
import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';
import {
    isNumber, isBigInt, getTypeOf, toString
} from '@terascope/utils';
import { ListVector } from './list-vector';
import {
    AnyVector, BigIntVector, BooleanVector, DateVector,
    FloatVector, GeoJSONVector, GeoPointVector, IntVector,
    ObjectVector, StringVector
} from './types';
import { Data, Vector } from './vector';

export function _newVector<T>(
    config: DataTypeFieldConfig,
    data: Data<any>,
    childConfig?: DataTypeFields
): Vector<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListVector({
            fieldType,
            data,
            childConfig,
        }) as Vector<any>;
    }

    return _newVectorForType(fieldType, data, childConfig) as Vector<T>;
}

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
function _newVectorForType(
    fieldType: FieldType,
    data: Data<any>,
    childConfig?: DataTypeFields
) {
    switch (fieldType) {
        case FieldType.String:
        case FieldType.Text:
        case FieldType.Keyword:
        case FieldType.KeywordCaseInsensitive:
        case FieldType.KeywordTokens:
        case FieldType.KeywordTokensCaseInsensitive:
        case FieldType.KeywordPathAnalyzer:
        case FieldType.Domain:
        case FieldType.Hostname:
        case FieldType.IP:
        case FieldType.IPRange:
            return new StringVector({ fieldType, data });
        case FieldType.Date:
            return new DateVector({ fieldType, data });
        case FieldType.Boolean:
            return new BooleanVector({ fieldType, data });
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector({ fieldType, data });
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector({ fieldType, data });
        case FieldType.Long:
            return new BigIntVector({ fieldType, data });
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointVector({ fieldType, data });
        case FieldType.GeoJSON:
            return new GeoJSONVector({ fieldType, data });
        case FieldType.Object:
            return new ObjectVector({ fieldType, data, childConfig });
        default:
            return new AnyVector({ fieldType, data });
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
        return { type: 'number', values: [] };
    }

    if (isNumber(value)) {
        return { values: [value], type: 'number' };
    }
    if (isBigInt(value)) {
        return { values: [value], type: 'bigint' };
    }

    if (value instanceof IntVector || value instanceof FloatVector) {
        const values: number[] = [];
        for (const val of value) {
            if (isNumber(val)) values.push(val);
        }
        return { values, type: 'number' };
    }

    if (value instanceof BigIntVector) {
        const values: bigint[] = [];
        for (const val of value) {
            if (isBigInt(val)) values.push(val);
        }
        return { values, type: 'bigint' };
    }

    throw new Error(`Unable to get numeric values from input ${getTypeOf(value)}`);
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

export function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}
export function createKeyForValue(value: unknown): string|undefined {
    if (value == null) return;

    if (typeof value !== 'object') return String(value);
    if (value instanceof Vector || Array.isArray(value)) {
        let key = '';
        for (const item of value) {
            if (item != null) key += `${toString(item)}`;
        }
        return key;
    }

    const keys: string[] = Object.keys(value as any).sort();

    let key = '';
    for (const prop of keys) {
        const item = (value as any)[prop];
        if (item != null) {
            key += `${prop}:${toString(item)}`;
        }
    }
    return key;
}
