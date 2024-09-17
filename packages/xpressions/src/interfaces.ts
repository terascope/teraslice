import type { xLuceneVariables } from '@terascope/types';

export interface Options {
    variables: xLuceneVariables;
}

export type Nodes = readonly Node[];

export enum NodeType {
    LITERAL = 'LITERAL',
    EXPRESSION = 'EXPRESSION',
    VARIABLE = 'VARIABLE',
}

export interface Node {
    readonly type: NodeType;
    readonly loc: {
        readonly start: number;
        readonly end: number;
    };
}

export interface LiteralNode extends Node {
    readonly type: NodeType.LITERAL;
    readonly value: string;
}

export function isLiteralNode(node: Node): node is LiteralNode {
    return node.type === NodeType.LITERAL;
}

export interface ExpressionNode extends Node {
    readonly type: NodeType.EXPRESSION;
    readonly value: string;
    readonly nodes: Nodes;
}

export function isExpressionNode(node: Node): node is ExpressionNode {
    return node.type === NodeType.EXPRESSION;
}

export interface VariableNode extends Node {
    readonly type: NodeType.VARIABLE;
    readonly scoped: boolean;
    readonly value: string;
}

export function isVariableNode(node: Node): node is VariableNode {
    return node.type === NodeType.VARIABLE;
}
