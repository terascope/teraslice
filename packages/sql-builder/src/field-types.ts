import {
    isNumber, isBooleanLike, getValidDate, isString
} from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import { isCIDR, isIP } from '@terascope/ip-utils';
import { xLuceneFieldType } from '@terascope/types';

/**
 * Helpers for deciding which values an xLucene field type can hold and how to render them.
*/

const NUMERIC_TYPES: readonly xLuceneFieldType[] = [
    xLuceneFieldType.Integer,
    xLuceneFieldType.Float,
    xLuceneFieldType.Number,
];

const TEXT_TYPES: readonly xLuceneFieldType[] = [
    xLuceneFieldType.String,
    xLuceneFieldType.AnalyzedString,
    xLuceneFieldType.IP,
    xLuceneFieldType.IPRange,
];

export function isNumericFieldType(fieldType?: xLuceneFieldType): boolean {
    return fieldType != null && NUMERIC_TYPES.includes(fieldType);
}

export function isTextFieldType(fieldType?: xLuceneFieldType): boolean {
    return fieldType != null && TEXT_TYPES.includes(fieldType);
}

/**
 * Infer a field type from a value's JavaScript type, for nodes that have no `field_type`.
 *
 * The parser expands `some:$array` into terms that carry only a value, so the value's type
 * is all there is to go on.
*/
export function inferFieldType(value: unknown): xLuceneFieldType {
    if (typeof value === 'boolean') return xLuceneFieldType.Boolean;
    if (isNumber(value)) return xLuceneFieldType.Number;
    return xLuceneFieldType.String;
}

/**
 * Whether a value can be a value of this field type.
 *
 * Used when a query names no field or a field pattern. A query that names its field was
 * already checked by the parser, but `ba*:hello` can expand to an integer column, where
 * `"num" = 'hello'` is a cast error that fails the whole query. Fields that return false
 * are left out of the expansion; in Elasticsearch they could not match either.
*/
export function canRenderValueAs(value: unknown, fieldType?: xLuceneFieldType): boolean {
    if (value == null) return false;

    switch (fieldType) {
        case xLuceneFieldType.Integer:
        case xLuceneFieldType.Float:
        case xLuceneFieldType.Number:
            return isNumber(value) || (isString(value) && value !== '' && Number.isFinite(Number(value)));
        case xLuceneFieldType.Boolean:
            return isBooleanLike(value);
        case xLuceneFieldType.Date:
            return getValidDate(value) !== false;
        case xLuceneFieldType.IP:
        case xLuceneFieldType.IPRange:
            return isIP(value) || isCIDR(value);
        case xLuceneFieldType.Geo:
        case xLuceneFieldType.GeoPoint:
            return parseGeoPoint(value, false) != null;
        case xLuceneFieldType.GeoJSON:
        case xLuceneFieldType.Object:
            return false;
        default:
            return true;
    }
}
