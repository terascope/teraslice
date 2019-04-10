import * as i from './interfaces';
import { isString } from '@terascope/utils';

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

export function isRegexp(node: any): node is i.Regexp {
    return node && node.type === i.ASTType.Regexp;
}

export function isWildcard(node: any): node is i.Wildcard {
    return node && node.type === i.ASTType.Wildcard;
}

export function isTerm(node: any): node is i.Term {
    return node && node.type === i.ASTType.Term;
}

export function isStringDataType(node: any): node is i.StringDataType {
    return node && node.data_type === 'string';
}

export const numberDataTypes: i.DataType[] = ['number', 'integer', 'float'];

export function isNumberDataType(node: any): node is i.NumberDataType {
    return node && numberDataTypes.includes(node.data_type);
}

export function isBooleanDataType(node: any): node is i.BooleanDataType {
    return node && node.data_type === 'boolean';
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
    i.ASTType.GeoBoundingBox,
    i.ASTType.GeoDistance,
];

export function isTermType(node: any): node is i.TermLike {
    return node && termTypes.includes(node.type);
}

/** logical group or field group with flow */
export const groupTypes: i.ASTType[] = [i.ASTType.LogicalGroup, i.ASTType.FieldGroup];

export function isGroupLike(node: any): node is i.GroupLikeAST {
    return node && groupTypes.includes(node.type);
}
