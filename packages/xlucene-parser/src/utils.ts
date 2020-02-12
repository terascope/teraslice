import {
    isString,
    isEmpty,
    isPlainObject,
    TSError,
    isWildCardString
} from '@terascope/utils';
import { XluceneFieldType, XluceneVariables, CoordinateTuple } from '@terascope/types';
import * as i from './interfaces';

export function isLogicalGroup(node: any): node is i.LogicalGroup {
    return node && node.type === i.ASTType.LogicalGroup;
}

export function isConjunction(node: any): node is i.Conjunction {
    return node && node.type === i.ASTType.Conjunction;
}

export function isNegation(node: any): node is i.Negation {
    return node && node.type === i.ASTType.Negation;
}

export function isFieldGroup(node: any): node is i.FieldGroup {
    return node && node.type === i.ASTType.FieldGroup;
}

export function isExists(node: any): node is i.Exists {
    return node && node.type === i.ASTType.Exists;
}

export function isRange(node: any): node is i.Range {
    return node && node.type === i.ASTType.Range;
}

export function isGeoDistance(node: any): node is i.GeoDistance {
    return node && node.type === i.ASTType.GeoDistance;
}

export function isGeoBoundingBox(node: any): node is i.GeoBoundingBox {
    return node && node.type === i.ASTType.GeoBoundingBox;
}

export function isFunctionExpression(node: any): node is i.FunctionNode {
    return node && node.type === i.ASTType.Function;
}

export function isRegexp(node: any): node is i.Regexp {
    return node && node.type === i.ASTType.Regexp;
}

export function isWildcard(node: any): node is i.Wildcard {
    return node && node.type === i.ASTType.Wildcard;
}

export function isWildcardField(node: any) {
    return node && isWildCardString(node.field);
}

export function isTerm(node: any): node is i.Term {
    return node && node.type === i.ASTType.Term;
}

export function isEmptyAST(node: any): node is i.EmptyAST {
    return isEmpty(node) || (node && node.type === i.ASTType.Empty);
}

export function isStringDataType(node: any): node is i.StringDataType {
    return node && node.field_type === 'string';
}

export const numberDataTypes: XluceneFieldType[] = [
    XluceneFieldType.Integer, XluceneFieldType.Float
];

export function isNumberDataType(node: any): node is i.NumberDataType {
    return node && numberDataTypes.includes(node.field_type);
}

export function isBooleanDataType(node: any): node is i.BooleanDataType {
    return node && node.field_type === 'boolean';
}

export function getAnyValue(node: any): any {
    return node && node.value;
}

export function getField(node: any): string|undefined {
    if (!node) return;
    if (!node.field || !isString(node.field)) return;
    return node.field;
}

/** term level queries with field (string|null)  */
export const termTypes: i.ASTType[] = [
    i.ASTType.Term,
    i.ASTType.Regexp,
    i.ASTType.Range,
    i.ASTType.Wildcard,
    i.ASTType.GeoDistance,
    i.ASTType.GeoBoundingBox,
    i.ASTType.Function
];

export function isTermType(node: any): node is i.TermLike {
    return node && termTypes.includes(node.type);
}

/** logical group or field group with flow */
export const groupTypes: i.ASTType[] = [i.ASTType.LogicalGroup, i.ASTType.FieldGroup];

export function isGroupLike(node: any): node is i.GroupLikeAST {
    return node && groupTypes.includes(node.type);
}

export function validateVariables(obj: XluceneVariables): XluceneVariables {
    if (!isPlainObject(obj)) throw new TSError('Invalid XluceneVariables configuration provided, it must be an object');
    return { ...obj };
}

export function isInfiniteValue(input?: number|string) {
    return input === '*' || input === Number.NEGATIVE_INFINITY || input === Number.POSITIVE_INFINITY;
}

export function isInfiniteMin(min?: number|string) {
    if (min == null) return false;
    return min === '*' || min === Number.NEGATIVE_INFINITY;
}

export function isInfiniteMax(max?: number|string) {
    if (max == null) return false;
    return max === '*' || max === Number.POSITIVE_INFINITY;
}

export interface ParsedRange {
    'gte'?: number|string;
    'gt'?: number|string;
    'lte'?: number|string;
    'lt'?: number|string;
}

export function parseRange(node: i.Range, excludeInfinite = false): ParsedRange {
    const results = {};

    if (!excludeInfinite || !isInfiniteValue(node.left.value)) {
        results[node.left.operator] = node.left.value;
    }

    if (node.right) {
        if (!excludeInfinite || !isInfiniteValue(node.right.value)) {
            results[node.right.operator] = node.right.value;
        }
    }
    return results;
}

function isGreaterThan(node: i.RangeNode) {
    if (node.operator === 'gte' || node.operator === 'gt') return true;
    return false;
}

export function buildRangeQueryString(node: i.Range): string | undefined {
    if (node.right) {
        const leftBrace = node.left.operator === 'gte' ? '[' : '{';
        const rightBrace = node.right.operator === 'lte' ? ']' : '}';
        return `${leftBrace}${node.left.value} TO ${node.right.value}${rightBrace}`;
    }
    // cannot have a single value infinity range query
    if (isInfiniteValue(node.left.value)) return;
    // queryString cannot use ranges like >=1000, must convert to equivalent [1000 TO *]
    if (isGreaterThan(node.left)) {
        if (node.left.operator === 'gte') {
            return `[${node.left.value} TO *]`;
        }
        return `{${node.left.value} TO *]`;
    }

    if (node.left.operator === 'lte') {
        return `[* TO ${node.left.value}]`;
    }
    return `[* TO ${node.left.value}}`;
}

export function coordinateToXlucene(cord: CoordinateTuple) {
    // tuple is [lon, lat], need to return "lat, lon"
    return `"${cord[1]}, ${cord[0]}"`;
}
