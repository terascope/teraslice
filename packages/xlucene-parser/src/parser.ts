import {
    TSError,
    trim,
    isRegExpLike
} from '@terascope/utils';
import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import { parse } from './peg-engine';
import * as i from './interfaces';
import * as utils from './utils';

const termTypes = new Set(utils.termTypes.filter((type) => (
    type !== i.NodeType.Range && type !== i.NodeType.Function
)));

/**
 * Parse a xLucene query
*/
export class Parser {
    readonly ast: i.Node;
    readonly query: string;
    readonly typeConfig: xLuceneTypeConfig;

    constructor(
        query: string,
        options: i.ParserOptions = {},
        _overrideNode?: i.Node
    ) {
        this.query = trim(query || '');

        this.typeConfig = { ...options.type_config };
        if (_overrideNode) {
            this.ast = _overrideNode;
            return;
        }

        const contextArg: i.ContextArg = {
            typeConfig: this.typeConfig,
        };

        try {
            this.ast = parse(this.query, { contextArg });

            if (utils.logger.level() === 10) {
                const astJSON = JSON.stringify(this.ast, null, 4);
                utils.logger.trace(`parsed ${this.query ? this.query : "''"} to `, astJSON);
            }
        } catch (err) {
            if (err && err.message.includes('Expected ,')) {
                err.message = err.message.replace('Expected ,', 'Expected');
            }

            throw new TSError(err, {
                reason: `Failure to parse xLucene query "${this.query}"`,
            });
        }
    }

    /**
     * Recursively Iterate over all or select set of the nodes types
    */
    forTypes<T extends i.NodeType[]|readonly i.NodeType[]>(
        types: T, cb: (node: i.Node) => void, skipFunctionParams = false
    ): void {
        const walkNode = (node: i.Node) => {
            if (types.includes(node.type)) {
                cb(node);
            }

            if (!skipFunctionParams && utils.isFunctionNode(node)) {
                for (const param of node.params) {
                    walkNode(param);
                }
                return;
            }

            if (utils.isNegation(node)) {
                walkNode(node.node);
                return;
            }

            if (utils.isGroupLike(node)) {
                for (const conj of node.flow) {
                    walkNode(conj);
                }
                return;
            }

            if (utils.isConjunction(node)) {
                for (const conj of node.nodes) {
                    walkNode(conj);
                }
            }
        };

        walkNode(this.ast);
    }

    /**
     * Iterate over all of the Term-Like nodes.
    */
    forTermTypes(
        cb: (node: i.TermLikeNode) => void,
        skipFunctionParams = true
    ): void {
        this.forTypes(
            utils.termTypes,
            cb as (node: i.Node) => void,
            skipFunctionParams
        );
    }

    /**
     * Iterate over all of the field value from Term-Like nodes,
     * this is useful for validating values and variables.
    */
    forEachFieldValue(cb: (value: i.FieldValue<any>, node: i.TermLikeNode) => void): void {
        this.forTermTypes((node) => {
            if (utils.isFunctionNode(node)) return;
            if (utils.isRange(node)) {
                cb(node.left.value, node);
                if (node.right) {
                    cb(node.right.value, node);
                }
                return;
            }

            if (utils.isTermList(node)) {
                node.value.forEach((value) => {
                    cb(value, node);
                });
                return;
            }

            cb((node as i.Term).value, node);
        }, false);
    }

    forEachTermNode(
        fieldValidator: (field: string) => void,
        valueValidator: (fieldValue: i.FieldValue<any>) => void,
    ): void {
        function callValidateField(node: i.TermLikeNode|i.RangeNode) {
            if ('field' in node && node.field) {
                fieldValidator(node.field);
            }
        }

        function callValidateValue(node: i.Node|i.RangeNode) {
            if ('value' in node) {
                if (Array.isArray(node.value)) {
                    node.value.forEach(valueValidator);
                } else {
                    valueValidator(node.value);
                }
            }
        }

        const walkNode = (node: i.Node) => {
            if (termTypes.has(node.type)) {
                callValidateField(node as i.TermLikeNode);
                callValidateValue(node);
                return;
            }

            if (utils.isRange(node)) {
                callValidateField(node);
                callValidateValue(node.left);
                if (node.right) {
                    callValidateValue(node.right);
                }
                return;
            }

            if (utils.isFunctionNode(node)) {
                callValidateField(node);
                for (const param of node.params) {
                    callValidateValue(param);
                }
                return;
            }

            if (utils.isNegation(node)) {
                walkNode(node.node);
                return;
            }

            if (utils.isGroupLike(node)) {
                for (const conj of node.flow) {
                    walkNode(conj);
                }
                return;
            }

            if (utils.isConjunction(node)) {
                for (const conj of node.nodes) {
                    walkNode(conj);
                }
            }
        };

        walkNode(this.ast);
    }

    /**
     * Validate and resolve the variables, returns a new Parser instance
    */
    resolveVariables(variables: xLuceneVariables): Parser {
        const validatedVariables = utils.validateVariables(variables);

        const ast = this.mapNode((node, parent) => {
            if (utils.isTermList(node)) {
                return coerceTermList(node, validatedVariables);
            }

            if ('value' in node) {
                return coerceNodeValue(
                    node as i.Term|i.Regexp|i.Wildcard,
                    validatedVariables,
                    parent?.type === i.NodeType.Function,
                    parent?.type === i.NodeType.Conjunction
                );
            }

            return node;
        });

        return new Parser(this.query, {
            type_config: this.typeConfig,
        }, ast);
    }

    /**
     * Map the Node and return a new Node
    */
    mapNode(fn: (node: i.Node, parent?: i.Node) => i.Node): i.Node {
        const mapNode = (ogNode: i.Node, parent?: i.Node): i.Node => {
            const node = fn({ ...ogNode }, parent);

            if (utils.isNegation(node)) {
                node.node = mapNode(node.node, node);
            } else if (utils.isFunctionNode(node)) {
                node.params = node.params.map((conj) => {
                    const newNode = mapNode(conj, node);
                    if (!utils.isTerm(newNode) && !utils.isTermList(newNode)) {
                        throw new Error(
                            `Only a ${i.NodeType.Term} or ${i.NodeType.TermList} node type can be returned, got ${newNode.type}`
                        );
                    }
                    return newNode;
                });
            } else if (utils.isGroupLike(node)) {
                node.flow = node.flow.map((conj) => {
                    const newNode = mapNode(conj, node);
                    if (!utils.isConjunction(newNode)) {
                        throw new Error(
                            `Only a ${i.NodeType.Conjunction} node type can be returned, got ${newNode.type}`
                        );
                    }
                    return newNode;
                });
            } else if (utils.isConjunction(node)) {
                node.nodes = node.nodes.map((conj) => mapNode(conj, node));
            }
            return node;
        };

        return mapNode(this.ast);
    }
}

function coerceTermList(node: i.TermList, variables: xLuceneVariables) {
    const values = utils.getFieldValue<any>(node.value, variables);
    return {
        ...node,
        values: values.map((value) => ({
            type: 'value',
            value,
        }))
    };
}

function coerceNodeValue(
    node: i.Term|i.Regexp|i.Wildcard,
    variables: xLuceneVariables,
    skipAutoFieldGroup?: boolean,
    allowNil?: boolean
): i.Node {
    const value = utils.getFieldValue<any>(
        node.value, variables, allowNil
    );
    const coerceFn = allowNil && value == null
        ? () => null
        : utils.makeCoerceFn(node.field_type);

    if (Array.isArray(value)) {
        if (skipAutoFieldGroup) {
            return {
                ...node,
                value: {
                    type: 'value',
                    value: value.map(coerceFn) as any
                }
            } as i.Term;
        }

        const fieldGroup: i.FieldGroup = {
            type: i.NodeType.FieldGroup,
            field: node.field as string,
            field_type: node.field_type,
            flow: value.map((val: any) => ({
                type: i.NodeType.Conjunction,
                nodes: [{
                    ...node,
                    value: {
                        type: 'value',
                        value: coerceFn(val)
                    }
                } as i.Term]
            } as i.Conjunction))
        };
        return fieldGroup;
    }

    if (node.type !== i.NodeType.Regexp && isRegExpLike(value)) {
        return {
            type: i.NodeType.Regexp,
            field: node.field,
            field_type: node.field_type as xLuceneFieldType.String,
            quoted: false,
            value: {
                type: 'value',
                value: parseVariableRegex(value)
            }
        } as i.Regexp;
    }

    if (node.field_type === xLuceneFieldType.IPRange) {
        return utils.createIPRangeFromTerm(node, value);
    }

    return {
        ...node,
        value: {
            type: 'value',
            value: coerceFn(value)
        }
    } as i.Term;
}

function parseVariableRegex(str: string & RegExp) {
    if (str.source) return str.source;
    const results = /\/(.*)\//.exec(str);
    if (results) return results[1];
    return str;
}
