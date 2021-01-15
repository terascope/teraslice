import { evaluate } from './evaluate';
import {
    Nodes, isExpressionNode, isLiteralNode, Options
} from './interfaces';
import { parse } from './parse';

/**
 * Evaluate all of the templated variables in a xpression string
 *
 * @returns the input with the translated values
*/
export function transform(input: Nodes|string, options: Options): string {
    const ast = typeof input === 'string' ? parse(input) : input;
    return ast.map((node): string => {
        if (isLiteralNode(node)) return node.value;
        if (isExpressionNode(node)) return evaluate(node.value, options);
        if (isLiteralNode(node)) return evaluate(node.value, options);
        throw new Error(`Unexpected expression node type ${node.type}`);
    }).join('');
}
