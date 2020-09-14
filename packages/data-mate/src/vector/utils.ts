import { FieldType } from '@terascope/types';
import {
    AnyVector, BigIntVector, BooleanVector, DateVector,
    FloatVector, GeoJSONVector, GeoPointVector, IntVector, ObjectVector, StringVector
} from './types';
import { Data } from './vector';

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function newVectorForType(fieldType: FieldType, data: Data<any>) {
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
            return new ObjectVector({ fieldType, data });
        default:
            return new AnyVector({ fieldType, data });
    }
}
