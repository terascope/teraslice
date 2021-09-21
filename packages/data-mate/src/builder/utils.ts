import { getGroupedFields } from '@terascope/data-types';
import {
    DataTypeConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { WritableData } from '../core';
import { Builder, BuilderOptions } from './Builder';
import { ListBuilder } from './ListBuilder';
import {
    AnyBuilder, BigIntBuilder, BooleanBuilder,
    DateBuilder, IntBuilder, FloatBuilder,
    GeoBoundaryBuilder, GeoJSONBuilder, GeoPointBuilder,
    IPBuilder, IPRangeBuilder,
    ObjectBuilder, StringBuilder, TupleBuilder
} from './types';

export function getBuildersForConfig<T extends Record<string, any> = Record<string, unknown>>(
    config: DataTypeConfig, size: number
): Map<(keyof T), Builder<unknown>> {
    const builders = new Map<keyof T, Builder<unknown>>();
    const groupedFieldEntries = Object.entries(getGroupedFields(config.fields));

    for (const [field, nested] of groupedFieldEntries) {
        let childConfig: DataTypeFields|undefined;
        nested.forEach((fullField) => {
            if (fullField === field) return;
            const nestedField = fullField.replace(`${field}.`, '');
            childConfig ??= {};
            childConfig[nestedField] = config.fields[fullField];
        });
        builders.set(field, Builder.make(new WritableData(size), {
            childConfig,
            config: config.fields[field],
            name: field,
        }));
    }

    return builders;
}

export function _newBuilder<T>(
    data: WritableData<any>,
    options: BuilderOptions,
): Builder<T> {
    const fieldType = options.config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (options.config.array) {
        return new ListBuilder(data, options) as Builder<any>;
    }

    return _newBuilderForType(data, options) as Builder<T>;
}

/**
 * Create primitive builder types, does not deal with array or object type fields
*/
function _newBuilderForType(
    data: WritableData<any>,
    options: BuilderOptions,
) {
    switch (options.config.type) {
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
        case FieldType.Boundary:
            return new GeoBoundaryBuilder(data, options);
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointBuilder(data, options);
        case FieldType.GeoJSON:
            return new GeoJSONBuilder(data, options);
        case FieldType.Object:
            return new ObjectBuilder(data, options);
        case FieldType.Tuple:
            return new TupleBuilder(data, options);
        default:
            return new AnyBuilder(data, options);
    }
}
