import { getGroupedFields } from '@terascope/data-types';
import {
    DataTypeConfig, DataTypeFieldConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { WritableData } from '../core';
import { Builder, BuilderOptions } from './Builder';
import { ListBuilder } from './ListBuilder';
import {
    AnyBuilder, BigIntBuilder, BooleanBuilder,
    DateBuilder, FloatBuilder,
    GeoJSONBuilder, GeoPointBuilder, IntBuilder,
    IPBuilder, IPRangeBuilder,
    ObjectBuilder, StringBuilder
} from './types';

export function getBuildersForConfig<T extends Record<string, any> = Record<string, unknown>>(
    config: DataTypeConfig, size: number
): Map<(keyof T), Builder<unknown>> {
    const builders = new Map<keyof T, Builder<unknown>>();
    const groupedFieldEntries = Object.entries(getGroupedFields(config.fields));

    for (const [field, nested] of groupedFieldEntries) {
        const childConfig: DataTypeFields = {};
        nested.forEach((fullField) => {
            if (fullField === field) return;
            const nestedField = fullField.replace(`${field}.`, '');
            childConfig[nestedField] = config.fields[fullField];
        });
        builders.set(field, Builder.make(
            config.fields[field],
            WritableData.make(size),
            childConfig
        ));
    }

    return builders;
}

export function _newBuilder<T>(
    config: DataTypeFieldConfig,
    data: WritableData<any>,
    childConfig?: DataTypeFields,
): Builder<T> {
    const fieldType = config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (config.array) {
        return new ListBuilder(data, {
            config, childConfig
        }) as Builder<any>;
    }

    return _newBuilderForType(
        config, data, childConfig
    ) as Builder<T>;
}

/**
 * Create primitive builder types, does not deal with array or object type fields
*/
function _newBuilderForType(
    config: DataTypeFieldConfig,
    data: WritableData<any>,
    childConfig?: DataTypeFields,
) {
    const options: BuilderOptions = {
        config, childConfig
    };
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
            return new StringBuilder(data, options);
        case FieldType.IP:
            return new IPBuilder(data, options);
        case FieldType.IPRange:
            return new IPRangeBuilder(data, options);
        case FieldType.Date:
            return new DateBuilder(data, options);
        case FieldType.Boolean:
            return new BooleanBuilder(data, options);
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatBuilder(data, options);
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntBuilder(data, options);
        case FieldType.Long:
            return new BigIntBuilder(data, options);
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointBuilder(data, options);
        case FieldType.GeoJSON:
            return new GeoJSONBuilder(data, options);
        case FieldType.Object:
            return new ObjectBuilder(data, options);
        default:
            return new AnyBuilder(data, options);
    }
}
