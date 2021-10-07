import { FieldType } from '@terascope/types';

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
