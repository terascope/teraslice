import { hasOwn, TSError } from '@terascope/core-utils';
import {
    ExpressionNode, isVariableNode, Options,
    VariableNode
} from './interfaces.js';
import { parseExpression } from './parse.js';

/**
 * Evaluate a single expression
 *
 * @returns the translated expression
*/
export function evaluate(input: string | ExpressionNode, options: Options): string {
    const expr = typeof input === 'string' ? parseExpression(input) : input;
    let output = '';
    for (const node of expr.nodes) {
        if (isVariableNode(node)) {
            output += evaluateVariableNode(node, options);
        } else {
            throw new Error(`Unsupported expression "${node.type}" given`);
        }
    }
    return output;
}

/**
 * Evaluate a single expression
 *
 * @returns the translated expression
*/
export function evaluateVariableNode(node: VariableNode, { variables }: Options): string {
    if (hasOwn(variables, node.value)) {
        return variables[node.value];
    }
    throw new TSError(`Missing variable "${node.value}" in expression`, {
        statusCode: 400,
        context: { safe: true }
    });
}
