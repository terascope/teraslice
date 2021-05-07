import { DataTypeFieldConfig, FieldType } from '@terascope/types';

export function isSameFieldConfig(
    a: Readonly<DataTypeFieldConfig>, b: Readonly<DataTypeFieldConfig>
): boolean {
    if (Object.is(a, b)) return true;
    if (a.type !== b.type) return false;

    const aArray = a.array ?? false;
    const bArray = a.array ?? false;
    if (aArray !== bArray) return false;

    if (a.format !== b.format) return false;

    if (a.locale !== b.locale) return false;

    return true;
}

/**
 * All of the numeric like field types
*/
export const numericTypes: ReadonlySet<FieldType> = new Set([
    FieldType.Any,
    FieldType.Number,
    FieldType.Short,
    FieldType.Integer,
    FieldType.Float,
    FieldType.Double,
    FieldType.Byte,
    FieldType.Long,
]);

/**
 * All of the string like field types
*/
export const stringTypes: ReadonlySet<FieldType> = new Set([
    FieldType.Any,
    FieldType.String,
    FieldType.Text,
    FieldType.Keyword,
    FieldType.KeywordCaseInsensitive,
    FieldType.KeywordPathAnalyzer,
    FieldType.KeywordTokens,
    FieldType.KeywordTokensCaseInsensitive,
    FieldType.Domain,
    FieldType.Hostname,
]);
