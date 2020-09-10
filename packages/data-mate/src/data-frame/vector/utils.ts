import { FieldType } from '@terascope/types';
import {
    AnyVector, BigIntVector, BooleanVector, DateVector, FloatVector, IntVector, StringVector
} from './types';

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVectorForType(fieldType: FieldType, values: any[]) {
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
            return new StringVector({ fieldType, values });
        case FieldType.Date:
            return new DateVector({ fieldType, values });
        case FieldType.Boolean:
            return new BooleanVector({ fieldType, values });
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector({ fieldType, values });
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector({ fieldType, values });
        case FieldType.Long:
            return new BigIntVector({ fieldType, values });
        default:
            return new AnyVector({ fieldType, values });
    }
}
