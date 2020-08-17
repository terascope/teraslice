import {
    TSError,
    getTypeOf,
    parseGeoDistance,
    parseGeoPoint,
    isRegExpLike,
    isWildCardString,
} from '@terascope/utils';
import {
    xLuceneFieldType,
    xLuceneVariables,
    xLuceneTypeConfig,
} from '@terascope/types';
import * as i from './interfaces';
import * as utils from './utils';
import xLuceneFunctions from './functions';

const inferredFieldTypes = Object.freeze({
    [xLuceneFieldType.String]: true,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function makeContext(arg: i.ContextArg) {
    let typeConfig: xLuceneTypeConfig;
    let variables: xLuceneVariables;
    // eslint-disable-next-line
    ({ typeConfig = {}, variables = {} } = arg);
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
            coerceTermType(node);
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

    function getVariable(value: string) {
        const variable = variables[value];
        if (variable === undefined) throw new TSError(`Could not find a variable set with key "${value}"`);
        if (Array.isArray(variable)) return variable.slice();
        return variable;
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
            term.value = String(value);
            return term;
        }

        utils.logger.warn(`Unsupported field inferred field type ${fieldType} for field ${field}`);
        term.value = value;
        return term;
    }

    function parseFunction(field: string, name: string, params: i.Term[]) {
        const fnType = xLuceneFunctions[name];
        if (fnType == null) throw new Error(`Could not find an xLucene function with name "${name}"`);
        // we are delaying instantiation until after parser since this can be called multiple times
        return () => fnType.create(field, params, {
            logger: utils.logger, typeConfig
        });
    }

    function makeFlow(field: string, values: any[], varName: string) {
        return values.map((value) => {
            validateRestrictedVariable(value, varName);
            const node = { field, type: i.ASTType.Term, value };
            coerceTermType(node);
            // this creates an OR statement
            return {
                type: i.ASTType.Conjunction,
                nodes: [node]
            };
        });
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
        if (fieldType === node.field_type) return;

        utils.logger.trace(
            `coercing field "${field}":${node.value} type of ${node.field_type} to ${fieldType}`
        );

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

        if (fieldType === xLuceneFieldType.Boolean) {
            node.field_type = fieldType;
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            if (node.value === 'true') {
                node.value = true;
            }
            if (node.value === 'false') {
                node.value = false;
            }
            return;
        }

        if (fieldType === xLuceneFieldType.Integer) {
            if (utils.isRange(node)) {
                node.type = i.ASTType.Range;
                node.left.field_type = fieldType;
                if (node.right) node.right.field_type = fieldType;
            } else {
                delete node.quoted;
                delete node.restricted;
                node.field_type = fieldType;
                node.type = i.ASTType.Term;
                node.value = parseInt(node.value, 10);
            }
            return;
        }

        if (fieldType === xLuceneFieldType.Float) {
            node.field_type = fieldType;
            node.type = i.ASTType.Term;
            delete node.quoted;
            delete node.restricted;
            node.value = parseFloat(node.value);
            return;
        }

        if (fieldType === xLuceneFieldType.String) {
            node.field_type = fieldType;
            if (isRegExpLike(node.value) || node.type === i.ASTType.Regexp) {
                node.type = i.ASTType.Regexp;
                node.value = parseVariableRegex(node.value);
            } else if (isWildCardString(node.value)) {
                node.type = i.ASTType.Wildcard;
            } else {
                node.quoted = false;
                node.value = `${node.value}`;
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
        parseFunction,
        getVariable,
        makeFlow,
        validateRestrictedVariable
    };
}

const variableTypes = Object.freeze({
    String: true,
    Number: true,
    Boolean: true,
    RegExp: true,
});

// cannot allow variables that are objects, errors, maps, sets, buffers
function validateRestrictedVariable(variable: any, varName: string) {
    const type = getTypeOf(variable);
    if (!variableTypes[type]) {
        throw new Error(`Unsupported type of ${type} received for variable $${varName}`);
    }
}
