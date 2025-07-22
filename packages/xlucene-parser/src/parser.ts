import {
    TSError, trim, isRegExpLike,
    cloneDeep, unset, get
} from '@terascope/utils';
import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import { parse } from './peg-engine.js';
import * as i from './interfaces.js';
import * as utils from './utils.js';

const termTypes = new Set<i.NodeType>(utils.termTypes.filter((type) => (
    type !== i.NodeType.Range && type !== i.NodeType.Function
)));

/**
 * Parse a xLucene query
*/
export class Parser {
    readonly ast: i.Node;
    readonly query: string;
    readonly typeConfig: xLuceneTypeConfig;
    readonly filterNilVariables: boolean;

    constructor(
        query: string,
        options?: i.ParserOptions,
        _overrideNode?: i.Node
    ) {
        this.query = trim(query || '');
        this.filterNilVariables = !!options?.filterNilVariables;

        this.typeConfig = { ...options?.type_config };
        if (_overrideNode) {
            this.ast = _overrideNode;
            return;
        }

        const contextArg: i.ContextArg = {
            typeConfig: this.typeConfig,
        };

        try {
            this.ast = parse(this.query, { contextArg });

            if (options?.filterNilVariables) {
                if (!options.variables) {
                    utils.logger.warn('Parser filtering out undefined variables but no variables were provided. Consider adding variables or not running in "filterNilVariables" mode.');
                }
                this.ast = this.filterNodes(this.ast, (_node: any) => {
                    let type = '';
                    let value: any = '';
                    let node = _node;
                    if (utils.isNegation(node)) {
                        node = _node.node;
                    }
                    if (utils.isTerm(node)) {
                        if ((node.value as i.FieldValueVariable).scoped) return true;
                        type = node.value.type;
                        value = node.value.value;
                    }
                    if (utils.isRange(node)) {
                        type = node.left.value.type ?? node.right?.value.type;
                        value = node.left.value.value ?? node.right?.value.value;
                    }

                    function keep(nodeType: string, nodeVariable: string) {
                        if (nodeType !== 'variable') return true;
                        if (nodeVariable in (options?.variables || {})) return true;
                        return false;
                    }
                    return keep(type, value);
                });
            }

            if (utils.logger.level() === 10) {
                const astJSON = JSON.stringify(this.ast, null, 4);
                utils.logger.trace(`parsed ${this.query ? this.query : '\'\''} to `, astJSON);
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

    filterNodes(ast: i.Node, fn: (node: i.Node, parent?: i.Node) => boolean): i.Node {
        const filterNode = (ogNode: i.Node, parent?: i.Node): i.Node => {
            const clone = cloneDeep(ogNode);

            if (utils.isLogicalGroup(clone) || utils.isFieldGroup(clone)) {
                const filtered = clone.flow
                    .map((f) => {
                        const nodes = f.nodes
                            .map((n) => {
                                if (utils.isConjunction(n) || utils.isLogicalGroup(n)) {
                                    // if grouping recurse to filter the inner nodes
                                    return filterNode(n, clone);
                                }
                                if (utils.isNegation(n)
                                    && (
                                        utils.isConjunction(n.node) || utils.isLogicalGroup(n.node))
                                ) {
                                    const _node = filterNode(n.node, clone);
                                    if (utils.isEmptyNode(_node)) return;
                                    return {
                                        ...n,
                                        node: _node
                                    };
                                }

                                // if filter fn returns true, keep the node
                                if (fn({ ...n }, parent)) return n;
                                return;
                            })
                            .filter(Boolean); // filter out undefined flow nodes

                        if (nodes.length) {
                            return { ...f, nodes };
                        }
                        return;
                    })
                    .filter( // filter out flows with zero nodes
                        (f) => !!f?.nodes.filter(Boolean).length
                    );

                if (!filtered.length) {
                    return {
                        type: i.NodeType.Empty
                    };
                }

                clone.flow = filtered as i.Conjunction[];

                // if only 1 flow and 1 node, don't need conjunction anymore
                if (clone.flow.length === 1 && clone.flow[0].nodes.length === 1) {
                    return clone.flow[0].nodes[0];
                }

                return clone;
            }

            if (utils.isRange(clone)) {
                const keepLeft = fn(clone.left as any, clone);

                let keepRight = false;
                if (clone.right) {
                    keepRight = fn(clone.right as any, clone);
                    if (!keepRight) {
                        unset(clone, 'right');
                    }
                }

                if (!keepLeft) {
                    unset(clone, 'left');
                    if (keepRight && clone.right) {
                        clone.left = { ...clone.right };
                    }
                }

                if (clone.left) {
                    return clone;
                }
                // fall through to end empty node if no left range
            }

            if (utils.isFunctionNode(clone)) {
                const filtered = clone.params.map((n) => {
                    if (utils.isTermList(n)) {
                        const value = n.value.map((v) => {
                            const keep = fn({
                                ...n,
                                type: i.NodeType.Term,
                                value: { ...v }
                            } as i.Term, ogNode);
                            if (keep) return v;
                            return;
                        }).filter(Boolean) as i.FieldValue<any>[];
                        if (!value.length) return;
                        n.value = value;
                        return n;
                    }
                    const keep = fn(n, ogNode);
                    if (keep) return n;
                    return;
                }).filter(Boolean) as (i.Term | i.TermList)[];

                if (!filtered.length) {
                    return { type: i.NodeType.Empty };
                }
                clone.params = filtered;
                return clone;
            }

            if (fn(ogNode, parent)) {
                return clone;
            }

            return {
                type: i.NodeType.Empty
            };
        };

        return filterNode(ast);
    }

    /**
     * Recursively Iterate over all or select set of the nodes types
    */
    forTypes<T extends i.NodeType[] | readonly i.NodeType[]>(
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

    walkAST(cb: (node: i.Node) => void) {
        const walkNode = (node: i.Node) => {
            cb(node);

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
        function callValidateField(node: i.TermLikeNode | i.RangeNode) {
            if ('field' in node && node.field) {
                fieldValidator(node.field);
            }
        }

        function callValidateValue(node: i.Node | i.RangeNode) {
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
            const allowNil = parent?.type === i.NodeType.Conjunction;

            if (utils.isTermList(node)) {
                return coerceTermList(node, validatedVariables);
            }
            if ('value' in node) {
                return coerceNodeValue(
                    node as i.Term | i.Regexp | i.Wildcard,
                    validatedVariables,
                    parent?.type === i.NodeType.Function,
                    allowNil
                );
            }
            if (utils.isRange(node)) {
                coerceRange(node, validatedVariables, allowNil);
            }

            return node;
        });

        return new Parser(this.query, {
            type_config: this.typeConfig,
            filterNilVariables: this.filterNilVariables
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

function coerceRange(node: i.Range, variables: xLuceneVariables, allowNil?: boolean) {
    node.left = coerceNodeValue(
        node.left, variables, allowNil, undefined, true
    ) as unknown as i.RangeNode;

    if (node.right) {
        node.right = coerceNodeValue(
            node.right, variables, allowNil, undefined, true
        ) as unknown as i.RangeNode;
    }

    return node;
}

function coerceNodeValue(
    node: i.Term | i.Regexp | i.Wildcard | i.RangeNode,
    variables: xLuceneVariables,
    skipAutoFieldGroup?: boolean,
    allowNil?: boolean,
    isRange = false
): i.Node {
    const value = utils.getFieldValue<any>(
        node.value, variables, allowNil
    );
    if (isRange && value === Infinity) {
        return node as i.Node; // technically i.RangeNode
    }

    const coerceFn = allowNil && value == null
        ? () => null
        : utils.makeCoerceFn(node.field_type);

    const type = get(node, 'type');
    const field: string = get(node, 'field', '');

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
            field,
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

    if (type !== i.NodeType.Regexp && isRegExpLike(value)) {
        return {
            type: i.NodeType.Regexp,
            field,
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
