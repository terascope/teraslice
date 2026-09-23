import {
    isNumber, isBooleanLike, getValidDate, isString
} from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import { isCIDR, isIP } from '@terascope/ip-utils';
import { xLuceneFieldType } from '@terascope/types';

/**
 * What a field type can hold, and how a value should be rendered for it.
 *
 * This is the one place SQL emission reasons about xLucene's type system rather than about
 * SQL text.
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
 * The field type to render a value as when the node carries none.
 *
 * A term built from an array variable has no `field_type` at all (measured - the parser
 * expands `some:$array` into a field group whose terms carry only a value), so the value's
 * own JavaScript type is the only thing left to go on.
*/
export function inferFieldType(value: unknown): xLuceneFieldType {
    if (typeof value === 'boolean') return xLuceneFieldType.Boolean;
    if (isNumber(value)) return xLuceneFieldType.Number;
    return xLuceneFieldType.String;
}

/**
 * Whether a value could be a value of this field type at all.
 *
 * **This is only asked when a query names no field, or names a pattern of them** - a query
 * that names its field has already been coerced by the parser, which throws on a value the
 * type cannot hold. An expansion has no such protection: `ba*:hello` can land on an integer
 * column, where `"num" = 'hello'` is not a non-match but a cast error that fails the whole
 * query.
 *
 * A field this returns false for contributes nothing to the expansion, which is the same
 * answer Elasticsearch gives - it simply cannot match.
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
