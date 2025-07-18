import {
    isString,
    isEmpty,
    isPlainObject,
    TSError,
    isWildCardString,
    debugLogger,
    primitiveToString,
    isPrimitiveValue,
    toBoolean,
    toNumber,
    toIntegerOrThrow,
    toFloatOrThrow,
    getTypeOf,
    isBooleanLike,
    isNotNil,
    isIP,
    isCIDR,
    isIPv6,
    getFirstIPInCIDR,
    getLastIPInCIDR,
    toCIDR,
    isValidDate,
    getValidDate
} from '@terascope/utils';

import {
    xLuceneFieldType, xLuceneVariables, CoordinateTuple,
    Maybe
} from '@terascope/types';
import * as i from './interfaces.js';

export const logger = debugLogger('xlucene-parser');

function _getType(node: unknown): i.NodeType | undefined {
    if (!node || typeof node !== 'object') return;
    return (node as any).type || undefined;
}

export function isLogicalGroup(node: unknown): node is i.LogicalGroup {
    return _getType(node) === i.NodeType.LogicalGroup;
}

export function isConjunction(node: unknown): node is i.Conjunction {
    return _getType(node) === i.NodeType.Conjunction;
}

export function isNegation(node: unknown): node is i.Negation {
    return _getType(node) === i.NodeType.Negation;
}

export function isFieldGroup(node: unknown): node is i.FieldGroup {
    return _getType(node) === i.NodeType.FieldGroup;
}

export function isExists(node: unknown): node is i.Exists {
    return _getType(node) === i.NodeType.Exists;
}

export function isRange(node: unknown): node is i.Range {
    return _getType(node) === i.NodeType.Range;
}

export function isFunctionNode(node: unknown): node is i.FunctionNode {
    return _getType(node) === i.NodeType.Function;
}

export function isRegexp(node: unknown): node is i.Regexp {
    return _getType(node) === i.NodeType.Regexp;
}

export function isWildcard(node: unknown): node is i.Wildcard {
    return _getType(node) === i.NodeType.Wildcard;
}

export function isWildcardField(node: unknown): boolean {
    return !!(node && isWildCardString((node as any).field));
}

export function isTerm(node: unknown): node is i.Term {
    return _getType(node) === i.NodeType.Term;
}

export function isTermList(node: unknown): node is i.TermList {
    return _getType(node) === i.NodeType.TermList;
}

export function isEmptyNode(node: unknown): node is i.EmptyNode {
    return isEmpty(node) || (_getType(node) === i.NodeType.Empty);
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

export function getField(node: unknown): string | undefined {
    if (!node) return;
    if (!(node as any).field || !isString((node as any).field)) return;
    return (node as any).field;
}

/** term level queries with field (string|null)  */
export const termTypes: readonly i.NodeType[] = [
    i.NodeType.Term,
    i.NodeType.Regexp,
    i.NodeType.Range,
    i.NodeType.Wildcard,
    i.NodeType.Function,
    i.NodeType.TermList,
];

export function isTermType(node: unknown): node is i.TermLikeNode {
    return !!(node && termTypes.includes((node as any).type));
}

/** logical group or field group with flow */
export const groupTypes: i.NodeType[] = [i.NodeType.LogicalGroup, i.NodeType.FieldGroup];

export function isGroupLike(node: unknown): node is i.GroupLikeNode {
    return !!(node && groupTypes.includes((node as any).type));
}

/**
 * Validate and normalize a variables object.
 * 
 * @param obj - The variables object to validate
 * @returns A normalized copy of the variables object
 * @throws {TSError} If the variables object is invalid
 */
export function validateVariables(obj: xLuceneVariables): xLuceneVariables {
    if (!isPlainObject(obj)) {
        throw new TSError('Invalid xLuceneVariables configuration provided, it must be an object', {
            context: { safe: true },
            statusCode: 400
        });
    }
    return { ...obj };
}

/**
 * Resolve a field value or array of field values using the provided variables.
 * 
 * This function handles both literal values and variable references, resolving
 * variables to their actual values from the variables object.
 * 
 * @param value - The field value(s) to resolve
 * @param variables - Object containing variable values
 * @param allowNil - Whether to allow undefined/null values
 * @returns The resolved value(s)
 */
export function getFieldValue<T>(
    value: i.FieldValue<T>,
    variables: xLuceneVariables,
    allowNil: true
): Maybe<T>;
export function getFieldValue<T>(
    value: i.FieldValue<T>,
    variables: xLuceneVariables,
    allowNil?: boolean
): T;
export function getFieldValue<T>(
    value: i.FieldValue<T>[],
    variables: xLuceneVariables,
    allowNil?: boolean
): T[];
export function getFieldValue<T>(
    value: i.FieldValue<T> | i.FieldValue<T>[],
    variables: xLuceneVariables,
    allowNil?: boolean
): (T | Maybe<T>)|(T[]) {
    if (Array.isArray(value)) {
        return value
            .map((val) => getFieldValue<any>(val, variables, true))
            .filter(isNotNil);
    }

    if (value.type === 'variable') {
        const varValue = variables[value.value];

        /* a variable returning undefined is different from returning null
        * undefined will signal dataframe and document matcher to
        * return false for this logic operator node, this is to allow
        * AND and OR operations to correctly return expected results
        * if joining or partial data. Returning null would return incorrect
        * results as it is to permissive in an OR statement
        */
        if (varValue === undefined) {
            return undefined;
        }

        if (varValue != null) {
            return variables[value.value] as T;
        }

        if (allowNil) return null;
    }

    if (value.value != null) {
        return value.value as T;
    }

    if (allowNil) return null;

    return undefined;
}

export function isInfiniteValue(input?: number | string): boolean {
    return input === '*' || input === Number.NEGATIVE_INFINITY || input === Number.POSITIVE_INFINITY;
}

export function isInfiniteMin(min?: number | string): boolean {
    if (min == null) return false;
    return min === '*' || min === Number.NEGATIVE_INFINITY;
}

export function isInfiniteMax(max?: number | string): boolean {
    if (max == null) return false;
    return max === '*' || max === Number.POSITIVE_INFINITY;
}

export interface ParsedRange {
    gte?: number | string;
    gt?: number | string;
    lte?: number | string;
    lt?: number | string;
}

/**
 * Parse a range node into a simple object with comparison operators.
 * 
 * @param node - The range node to parse
 * @param variables - Variables for resolving variable references
 * @param excludeInfinite - Whether to exclude infinite values (* or ±Infinity)
 * @returns Object with comparison operators and their values
 */
export function parseRange(
    node: i.Range, variables: xLuceneVariables, excludeInfinite = false
): ParsedRange {
    const results: Partial<ParsedRange> = {};

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

        if (isValidDate(value)) return value;

        const coerced = getValidDate(value, new Date());
        if (coerced) return coerced;

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

/**
 * Create a coercion function for the specified field type.
 * 
 * @param fieldType - The xLucene field type
 * @returns A function that coerces values to the specified type
 */
export function makeCoerceFn(fieldType: xLuceneFieldType | undefined): (v: any) => any {
    if (!fieldType || !(fieldType in coerceValueFns)) return (v) => v;
    const coerceFn = coerceValueFns[fieldType]!;
    return coerceFn;
}

/**
 * Convert an IP address or CIDR block term into a range query.
 * 
 * @param node - The term node containing the IP value
 * @param value - The IP address or CIDR block string
 * @returns A range node representing the IP range
 */
export function createIPRangeFromTerm(node: i.Term, value: string): i.Range {
    const { start, end } = parseIPRange(value);

    return {
        type: i.NodeType.Range,
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

function parseIPRange(val: string): { start: string; end: string } {
    const cidrBlock = makeCidr(val);

    return {
        start: getFirstIPInCIDR(cidrBlock),
        end: getLastIPInCIDR(cidrBlock)
    };
}

function makeCidr(val: string): string {
    if (isCIDR(val)) return val;

    if (isIP(val)) {
        // CIDR notation for a single ip
        if (isIPv6(val)) return toCIDR(val, 128);
        return toCIDR(val, 32);
    }

    throw new Error(`Invalid value ${val}, could not convert to ip_range`);
}
