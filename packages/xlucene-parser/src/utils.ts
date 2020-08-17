import {
    isString,
    isEmpty,
    isPlainObject,
    TSError,
    isWildCardString,
    debugLogger
} from '@terascope/utils';
import { xLuceneFieldType, xLuceneVariables, CoordinateTuple } from '@terascope/types';
import * as i from './interfaces';

export const logger = debugLogger('xlucene-parser');

function _getType(node: unknown): i.ASTType|undefined {
    if (!node || typeof node !== 'object') return;
    return (node as any).type || undefined;
}

export function isLogicalGroup(node: unknown): node is i.LogicalGroup {
    return _getType(node) === i.ASTType.LogicalGroup;
}

export function isConjunction(node: unknown): node is i.Conjunction {
    return _getType(node) === i.ASTType.Conjunction;
}

export function isNegation(node: unknown): node is i.Negation {
    return _getType(node) === i.ASTType.Negation;
}

export function isFieldGroup(node: unknown): node is i.FieldGroup {
    return _getType(node) === i.ASTType.FieldGroup;
}

export function isExists(node: unknown): node is i.Exists {
    return _getType(node) === i.ASTType.Exists;
}

export function isRange(node: unknown): node is i.Range {
    return _getType(node) === i.ASTType.Range;
}

export function isGeoDistance(node: unknown): node is i.GeoDistance {
    return _getType(node) === i.ASTType.GeoDistance;
}

export function isGeoBoundingBox(node: unknown): node is i.GeoBoundingBox {
    return _getType(node) === i.ASTType.GeoBoundingBox;
}

export function isFunctionExpression(node: unknown): node is i.FunctionNode {
    return _getType(node) === i.ASTType.Function;
}

export function isRegexp(node: unknown): node is i.Regexp {
    return _getType(node) === i.ASTType.Regexp;
}

export function isWildcard(node: unknown): node is i.Wildcard {
    return _getType(node) === i.ASTType.Wildcard;
}

export function isWildcardField(node: unknown): boolean {
    return node && isWildCardString((node as any).field);
}

export function isTerm(node: unknown): node is i.Term {
    return _getType(node) === i.ASTType.Term;
}

export function isEmptyAST(node: unknown): node is i.EmptyAST {
    return isEmpty(node) || (_getType(node) === i.ASTType.Empty);
}

export function isStringDataType(node: unknown): node is i.StringDataType {
    return node && (node as any).field_type === 'string';
}

export const numberDataTypes: xLuceneFieldType[] = [
    xLuceneFieldType.Integer, xLuceneFieldType.Float
];

export function isNumberDataType(node: unknown): node is i.NumberDataType {
    return node && numberDataTypes.includes((node as any).field_type);
}

export function isBooleanDataType(node: unknown): node is i.BooleanDataType {
    return node && (node as any).field_type === 'boolean';
}

export function getAnyValue(node: unknown): any {
    return node && (node as any).value;
}

export function getField(node: unknown): string|undefined {
    if (!node) return;
    if (!(node as any).field || !isString((node as any).field)) return;
    return (node as any).field;
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

export function isTermType(node: unknown): node is i.TermLike {
    return node && termTypes.includes((node as any).type);
}

/** logical group or field group with flow */
export const groupTypes: i.ASTType[] = [i.ASTType.LogicalGroup, i.ASTType.FieldGroup];

export function isGroupLike(node: unknown): node is i.GroupLikeAST {
    return node && groupTypes.includes((node as any).type);
}

export function validateVariables(obj: xLuceneVariables): xLuceneVariables {
    if (!isPlainObject(obj)) throw new TSError('Invalid xLuceneVariables configuration provided, it must be an object');
    return { ...obj };
}

export function isInfiniteValue(input?: number|string): boolean {
    return input === '*' || input === Number.NEGATIVE_INFINITY || input === Number.POSITIVE_INFINITY;
}

export function isInfiniteMin(min?: number|string): boolean {
    if (min == null) return false;
    return min === '*' || min === Number.NEGATIVE_INFINITY;
}

export function isInfiniteMax(max?: number|string): boolean {
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

export function coordinateToXlucene(cord: CoordinateTuple): string {
    // tuple is [lon, lat], need to return "lat, lon"
    return `"${cord[1]}, ${cord[0]}"`;
}
