import type { xLuceneVariables } from '@terascope/types';

export interface Options {
    variables: xLuceneVariables
}

export type AST = readonly Node[];

export enum NodeType {
    LITERAL = 'LITERAL',
    EXPRESSION = 'EXPRESSION',
}

export interface Node {
    readonly type: NodeType;
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
    readonly variables: readonly Variable[];
}

export interface Variable {
    scoped: boolean;
    value: string;
}

export function isExpressionNode(node: Node): node is ExpressionNode {
    return node.type === NodeType.EXPRESSION;
}
