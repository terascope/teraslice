import { evaluate, evaluateVariableNode } from './evaluate.js';
import {
    Nodes, isExpressionNode, isLiteralNode,
    Options, isVariableNode
} from './interfaces.js';
import { parse } from './parse.js';

/**
 * Evaluate all of the templated variables in a xpression string
 *
 * @returns the input with the translated values
*/
export function transform(input: Nodes|string, options: Options): string {
    const ast = typeof input === 'string' ? parse(input) : input;
    return ast.map((node): string => {
        if (isLiteralNode(node)) return node.value;
        if (isExpressionNode(node)) return evaluate(node, options);
        if (isVariableNode(node)) return evaluateVariableNode(node, options);
        throw new Error(`Unexpected expression node type ${node.type}`);
    }).join('');
}
