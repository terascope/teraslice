import { getGroupedFields } from '@terascope/data-types';
import {
    DataTypeConfig, DataTypeFieldConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { Builder } from './Builder';
import { ListBuilder } from './ListBuilder';
import {
    AnyBuilder, BigIntBuilder, BooleanBuilder,
    DateBuilder, FloatBuilder,
    GeoJSONBuilder, GeoPointBuilder, IntBuilder,
    ObjectBuilder, StringBuilder
} from './types';

export function getBuildersForConfig<T extends Record<string, any> = Record<string, unknown>>(
    config: DataTypeConfig, length?: number
): Map<keyof T, Builder<unknown>> {
    const builders = new Map<keyof T, Builder<unknown>>();
    const groupedFieldEntries = Object.entries(getGroupedFields(config.fields));

    for (const [field, nested] of groupedFieldEntries) {
        const childConfig: DataTypeFields = {};
        nested.forEach((fullField) => {
            if (fullField === field) return;
            const nestedField = fullField.replace(`${field}.`, '');
            childConfig[nestedField] = config.fields[fullField];
        });
        builders.set(field, Builder.make(config.fields[field], length, childConfig));
    }

    return builders;
}

export function _newBuilder<T>(
    config: DataTypeFieldConfig,
    length?: number,
    childConfig?: DataTypeFields
): Builder<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListBuilder({ config, length, childConfig }) as Builder<any>;
    }

    return _newBuilderForType(config, length, childConfig) as Builder<T>;
}

/**
 * Create primitive builder types, does not deal with array or object type fields
*/
function _newBuilderForType(
    config: DataTypeFieldConfig,
    length?: number,
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
            return new StringBuilder({ config, length });
        case FieldType.Date:
            return new DateBuilder({ config, length });
        case FieldType.Boolean:
            return new BooleanBuilder({ config, length });
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatBuilder({ config, length });
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntBuilder({ config, length });
        case FieldType.Long:
            return new BigIntBuilder({ config, length });
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointBuilder({ config, length });
        case FieldType.GeoJSON:
            return new GeoJSONBuilder({ config, length });
        case FieldType.Object:
            return new ObjectBuilder({ config, length, childConfig });
        default:
            return new AnyBuilder({ config, length });
    }
}
