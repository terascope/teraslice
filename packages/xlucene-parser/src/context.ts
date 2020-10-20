import {
    TSError,
    parseGeoDistance,
    parseGeoPoint,
    isRegExpLike,
    isWildCardString,
    toFloatOrThrow,
    toIntegerOrThrow,
} from '@terascope/utils';
import {
    xLuceneFieldType,
    xLuceneTypeConfig,
} from '@terascope/types';
import { Netmask } from 'netmask';
import * as i from './interfaces';
import * as utils from './utils';

const inferredFieldTypes = Object.freeze({
    [xLuceneFieldType.String]: true,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeContext(arg: i.ContextArg) {
    let typeConfig: xLuceneTypeConfig;
    // eslint-disable-next-line
    ({ typeConfig = {} } = arg);
    if (!typeConfig) {
        throw new Error('xLucene Parser given invalid context');
    }

    /**
    * Propagate the default field on a field group expression
    */
    function propagateDefaultField(node: i.AnyAST, field: string): void {
        if (!node) return;

        if (utils.isTermType(node) && !node.field) {
            node.field = field;
            const fieldType = getFieldType(field);
            coerceTermType(node);
            // @ts-expect-error
            if (!node.field_type && fieldType) node.field_type = fieldType;
            return;
        }

        if (utils.isNegation(node)) {
            propagateDefaultField(node.node, field);
            return;
        }

        if (utils.isGroupLike(node)) {
            for (const conj of node.flow) {
                propagateDefaultField(conj, field);
            }
            return;
        }

        if (utils.isConjunction(node)) {
            for (const conj of node.nodes) {
                propagateDefaultField(conj, field);
            }
        }
    }

    // The following functions are javascript functions and not
    // peg grammar because this is based off configuration passed
    // in and cannot be inferred by the syntax

    function getFieldType(field: string): xLuceneFieldType|undefined {
        if (!field) return;
        return typeConfig[field];
    }

    function isInferredTermType(field: string): boolean {
        const fieldType = getFieldType(field);
        if (!fieldType) return false;
        return inferredFieldTypes[fieldType] === true;
    }

    // parse an inferred field type
    function parseInferredTermType(field: string, value: any): i.TermLikeAST {
        const fieldType = getFieldType(field);
        const term: any = {
            type: i.ASTType.Term,
            field_type: fieldType,
        };

        if (fieldType === xLuceneFieldType.String) {
            term.quoted = false;
            term.value = {
                type: 'value',
                value: String(value),
            };
            return term;
        }

        utils.logger.warn(`Unsupported field inferred field type ${fieldType} for field ${field}`);
        term.value = { type: 'value', value };
        return term;
    }

    function parseVariableRegex(str: string & RegExp) {
        if (str.source) return str.source;
        const results = /\/(.*)\//.exec(str);
        if (results) return results[1];
        return str;
    }

    function coerceTermType(node: any, _field?: string) {
        if (!node) return;
        const field = node.field || _field;
        if (!field) return;

        let fieldType = getFieldType(field);

        if (fieldType === xLuceneFieldType.AnalyzedString) {
            node.analyzed = true;
        }
        if (node.operator && fieldType) {
            node.field_type = fieldType as xLuceneFieldType.Integer;
        }

        if (fieldType === node.field_type) return;
        if (node.value.type !== 'value') return;

        const value = node.value.value as any;
        if (fieldType) {
            utils.logger.trace(
                `coercing field "${field}":${value} type of ${node.field_type} to ${fieldType}`
            );
        }

        // in the case of analyzed fields we should update the
        // node to indicate so non-term level queries can be performed
        if (!node.analyzed && utils.isTermType(node) && !typeConfig[field] && field.includes('.')) {
            const parentField = field.split('.').slice(0, -1)[0];
            const parentType = typeConfig[parentField];
            if (parentType && parentType !== xLuceneFieldType.Object) {
                fieldType = parentType;
                node.analyzed = true;
            }
        }

        if (fieldType === xLuceneFieldType.IPRange) {
            node.field_type = fieldType;
            node.type = i.ASTType.Range;
            delete node.quoted;

            const { start, end } = getIPRange(value);

            node.left = {
                operator: 'gte',
                field_type: xLuceneFieldType.IP,
                value: {
                    type: 'value',
                    value: start,
                }
            };
            node.right = {
                operator: 'lte',
                field_type: xLuceneFieldType.IP,
                value: {
                    type: 'value',
                    value: end,
                },
            };
        }

        if (fieldType === xLuceneFieldType.Boolean) {
            node.field_type = fieldType;
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            if (value === 'true') {
                node.value = { type: 'value', value: true };
            }
            if (value === 'false') {
                node.value = { type: 'value', value: false };
            }
            return;
        }

        if (fieldType === xLuceneFieldType.Integer) {
            delete node.quoted;
            delete node.restricted;
            node.field_type = fieldType;
            node.type = i.ASTType.Term;
            node.value = {
                type: 'value',
                value: toIntegerOrThrow(value)
            };
            return;
        }

        if (fieldType === xLuceneFieldType.Float) {
            node.field_type = fieldType;
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            node.value = {
                type: 'value',
                value: toFloatOrThrow(value),
            };
            return;
        }

        if (fieldType === xLuceneFieldType.String) {
            node.field_type = fieldType;
            if (node.type === i.ASTType.Regexp || isRegExpLike(value)) {
                node.type = i.ASTType.Regexp;
                node.value = {
                    type: 'value',
                    value: parseVariableRegex(value)
                };
            } else if (isWildCardString(value)) {
                node.type = i.ASTType.Wildcard;
            } else {
                node.quoted = false;
                node.value = {
                    type: 'value',
                    value: String(value),
                };
                node.type = i.ASTType.Term;
            }
        }
    }

    return {
        logger: utils.logger,
        parseGeoPoint,
        parseGeoDistance,
        coerceTermType,
        parseInferredTermType,
        isInferredTermType,
        propagateDefaultField,
        getFieldType,
    };
}

function getIPRange(val: string): { start: string, end: string} {
    try {
        const block = new Netmask(val);
        const end = block.broadcast ? block.broadcast : block.last;
        return { start: block.base, end };
    } catch (err) {
        throw new TSError(`Invalid value ${val}, could not convert to ip_range`);
    }
}
