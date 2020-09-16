import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';
import { Builder } from './builder';
import { ListBuilder } from './list-builder';
import {
    AnyBuilder, BigIntBuilder, BooleanBuilder,
    DateBuilder, FloatBuilder,
    GeoJSONBuilder, GeoPointBuilder, IntBuilder,
    ObjectBuilder, StringBuilder
} from './types';

export function _newBuilder<T>(
    config: DataTypeFieldConfig,
    childConfig?: DataTypeFields
): Builder<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListBuilder({ config, childConfig }) as Builder<any>;
    }

    return _newBuilderForType(config, childConfig) as Builder<T>;
}

/**
 * Create primitive builder types, does not deal with array or object type fields
*/
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function _newBuilderForType(
    config: DataTypeFieldConfig,
    childConfig?: DataTypeFields
) {
    switch (config.type) {
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
            return new StringBuilder({ config });
        case FieldType.Date:
            return new DateBuilder({ config });
        case FieldType.Boolean:
            return new BooleanBuilder({ config });
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatBuilder({ config });
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntBuilder({ config });
        case FieldType.Long:
            return new BigIntBuilder({ config });
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointBuilder({ config });
        case FieldType.GeoJSON:
            return new GeoJSONBuilder({ config });
        case FieldType.Object:
            return new ObjectBuilder({ config, childConfig });
        default:
            return new AnyBuilder({ config });
    }
}
