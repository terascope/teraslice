import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import {
    AnyVector, BigIntVector, FloatVector, IntVector, ListVector, StringVector
} from './types';
import { Vector } from './vector';

export * from './interfaces';
export * from './types';
export * from './vector';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVector<T>(config: DataTypeFieldConfig, values: any[]): Vector<T> {
    const type = config.type as FieldType;
    if (!(type in FieldType)) {
        throw new Error(`Unsupported field type ${type}`);
    }

    if (config.array) {
        return new ListVector<any>(
            type,
            values,
            (childValues) => _newVector<T>(
                type, childValues as any[]
            )
        ) as Vector<T>;
    }
    return _newVector<T>(type, values);
}

function _newVector<T>(type: FieldType, values: any[]): Vector<T> {
    switch (type) {
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
            return new StringVector(type, values) as Vector<T>;
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector(type, values) as Vector<T>;
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector(type, values) as Vector<T>;
        case FieldType.Long:
            return new BigIntVector(type, values) as Vector<T>;
        default:
            return new AnyVector(type, values);
    }
}
