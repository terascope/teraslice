import { FieldType } from '@terascope/types';
import {
    AnyVector, BigIntVector, FloatVector, IntVector, StringVector
} from './types';
import { Vector } from './vector';

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
export function newVectorForType<T>(type: FieldType, values: any[]): Vector<T> {
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
            return new StringVector({ type, values }) as Vector<T>;
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector({ type, values }) as Vector<T>;
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector({ type, values }) as Vector<T>;
        case FieldType.Long:
            return new BigIntVector({ type, values }) as Vector<T>;
        default:
            return new AnyVector({ type, values });
    }
}
