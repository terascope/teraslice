import {
    isString,
    isEmpty,
    isPlainObject,
    TSError,
    isWildCardString,
    debugLogger,
    toString,
    primitiveToString,
    isPrimitiveValue,
    toBoolean,
    toNumber,
    toIntegerOrThrow,
    toFloatOrThrow,
    getTypeOf,
    isBooleanLike
} from '@terascope/utils';
import { Netmask } from 'netmask';
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

export function isFunctionNode(node: unknown): node is i.FunctionNode {
    return _getType(node) === i.ASTType.Function;
}

export function isRegexp(node: unknown): node is i.Regexp {
    return _getType(node) === i.ASTType.Regexp;
}

export function isWildcard(node: unknown): node is i.Wildcard {
    return _getType(node) === i.ASTType.Wildcard;
}

export function isWildcardField(node: unknown): boolean {
    return !!(node && isWildCardString((node as any).field));
}

export function isTerm(node: unknown): node is i.Term {
    return _getType(node) === i.ASTType.Term;
}

export function isEmptyAST(node: unknown): node is i.EmptyAST {
    return isEmpty(node) || (_getType(node) === i.ASTType.Empty);
}

export function isStringDataType(node: unknown): node is i.StringDataType {
    return !!(node && (node as any).field_type === 'string');
}

export const numberDataTypes: xLuceneFieldType[] = [
    xLuceneFieldType.Integer, xLuceneFieldType.Float
];

export function isNumberDataType(node: unknown): node is i.NumberDataType {
    return !!(node && numberDataTypes.includes((node as any).field_type));
}

export function isBooleanDataType(node: unknown): node is i.BooleanDataType {
    return !!(node && (node as any).field_type === 'boolean');
}

export function getField(node: unknown): string|undefined {
    if (!node) return;
    if (!(node as any).field || !isString((node as any).field)) return;
    return (node as any).field;
}

/** term level queries with field (string|null)  */
export const termTypes: readonly i.ASTType[] = [
    i.ASTType.Term,
    i.ASTType.Regexp,
    i.ASTType.Range,
    i.ASTType.Wildcard,
    i.ASTType.Function,
    i.ASTType.TermList,
];

export function isTermType(node: unknown): node is i.TermLike {
    return !!(node && termTypes.includes((node as any).type));
}

/** logical group or field group with flow */
export const groupTypes: i.ASTType[] = [i.ASTType.LogicalGroup, i.ASTType.FieldGroup];

export function isGroupLike(node: unknown): node is i.GroupLikeAST {
    return !!(node && groupTypes.includes((node as any).type));
}

export function validateVariables(obj: xLuceneVariables): xLuceneVariables {
    if (!isPlainObject(obj)) {
        throw new TSError('Invalid xLuceneVariables configuration provided, it must be an object', {
            context: { safe: true },
            statusCode: 400
        });
    }
    return { ...obj };
}

export function getFieldValue<T>(
    value: i.FieldValue<T>[],
    variables: xLuceneVariables,
): T[];
export function getFieldValue<T>(
    value: i.FieldValue<T>,
    variables: xLuceneVariables,
): T;
export function getFieldValue<T>(
    value: i.FieldValue<T>|i.FieldValue<T>[],
    variables: xLuceneVariables,
): T|T[] {
    if (Array.isArray(value)) {
        return value.map((val) => getFieldValue(val, variables)) as T[];
    }
    if (value.type === 'variable') {
        if (variables[value.value] != null) {
            return variables[value.value] as T;
        }
        if (value.scoped) {
            throw new Error(`Could not find a scoped variable ${value.value}`);
        } else {
            throw new Error(`Could not find a variable $${value.value}`);
        }
    }
    if (value.value != null) {
        return value.value;
    }

    // should never get here
    throw new Error(`Missing value, got ${toString(value)}`);
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

export function parseRange(
    node: i.Range, variables: xLuceneVariables, excludeInfinite = false
): ParsedRange {
    const results = {};

    const leftValue = getFieldValue(node.left.value, variables);
    if (!excludeInfinite || !isInfiniteValue(leftValue)) {
        results[node.left.operator] = leftValue;
    }

    if (node.right) {
        const rightValue = getFieldValue(node.right.value, variables);
        if (!excludeInfinite || !isInfiniteValue(rightValue)) {
            results[node.right.operator] = rightValue;
        }
    }
    return results;
}

export function coordinateToXlucene(cord: CoordinateTuple): string {
    // tuple is [lon, lat], need to return "lat, lon"
    return `"${cord[1]}, ${cord[0]}"`;
}

type CoerceValueFns = Partial<Record<xLuceneFieldType, ((value: any) => any)>>;
export const coerceValueFns: CoerceValueFns = Object.freeze({
    [xLuceneFieldType.AnalyzedString]: primitiveToString,
    [xLuceneFieldType.String]: primitiveToString,
    [xLuceneFieldType.Boolean](value) {
        if (!isBooleanLike(value)) {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a boolean like format`);
        }
        return toBoolean(value);
    },
    [xLuceneFieldType.Date](value) {
        if (!isPrimitiveValue(value)) {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a date like format`);
        }
        return value;
    },
    [xLuceneFieldType.Number](value) {
        const numValue = toNumber(value);
        if (Number.isNaN(numValue)) {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a number like format`);
        }
        return numValue;
    },
    [xLuceneFieldType.Float]: toFloatOrThrow,
    [xLuceneFieldType.Integer]: toIntegerOrThrow,
    [xLuceneFieldType.IP](value) {
        if (typeof value !== 'string') {
            throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a IP like format`);
        }
        return value;
    },
});

export function makeCoerceFn(fieldType: xLuceneFieldType|undefined): (v: any) => any {
    if (!fieldType || !(fieldType in coerceValueFns)) return (v) => v;
    const coerceFn = coerceValueFns[fieldType]!;
    return coerceFn;
}

export function createIPRangeFromTerm(node: i.Term, value: string): i.Range {
    const { start, end } = parseIPRange(value);

    return {
        type: i.ASTType.Range,
        field: node.field,
        field_type: node.field_type,
        left: {
            operator: 'gte',
            field_type: xLuceneFieldType.IP,
            value: {
                type: 'value',
                value: start,
            }
        },
        right: {
            operator: 'lte',
            field_type: xLuceneFieldType.IP,
            value: {
                type: 'value',
                value: end,
            },
        }
    };
}

function parseIPRange(val: string): { start: string, end: string} {
    try {
        const block = new Netmask(val);
        const end = block.broadcast ? block.broadcast : block.last;
        return { start: block.base, end };
    } catch (err) {
        throw new Error(`Invalid value ${val}, could not convert to ip_range`);
    }
}
