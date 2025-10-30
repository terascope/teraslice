import { TSError } from '@terascope/core-utils';
import {
    Nodes, ExpressionNode, LiteralNode,
    NodeType, VariableNode
} from './interfaces.js';

/**
 * Parse and validate an templated expression string
 *
 * @returns the parsed ast
*/
export function parse(input: string): Nodes {
    const len = input.length;
    const ast: (LiteralNode | ExpressionNode | VariableNode)[] = [];
    let chunkStart = 0;
    let chunk = '';

    function finishChunk(chunkEnd: number) {
        if (!chunk) return;
        ast.push({
            type: NodeType.LITERAL,
            value: chunk,
            loc: {
                start: chunkStart,
                end: chunkEnd
            }
        } as LiteralNode);
        chunk = '';
        chunkStart = chunkEnd;
    }

    for (let i = 0; i < len; i++) {
        const char = input[i];
        const nextChar = input[i + 1];
        if (char === '$' && nextChar === '{' && !isEscaped(input, i)) {
            finishChunk(i);
            const expr = parseExpression(input, i + 2, true);
            ast.push(expr);
            i = expr.loc.end;
            chunkStart = i;
        } else {
            chunk += char;
        }
    }
    finishChunk(input.length);

    return ast.slice();
}

/**
 * Parse and validate an expression
 *
 * @returns return the parsed expression
*/
export function parseExpression(
    input: string, startPosition = 0, isInTemplate = false
): ExpressionNode {
    let expression = '';
    let terminated = false;
    for (let j = startPosition; j < input.length; j++) {
        if (input[j] === '}' && !isEscaped(input, j)) {
            terminated = true;
            break;
        } else {
            expression += input[j];
        }
    }
    if (terminated || !isInTemplate) {
        const variable = expression.trim();
        const scoped = variable.startsWith('@');
        return {
            type: NodeType.EXPRESSION,
            value: expression,
            nodes: [{
                type: NodeType.VARIABLE,
                scoped,
                value: scoped ? variable : variable.replace(/^\$/, ''),
                loc: {
                    start: startPosition + expression.indexOf(variable),
                    end: startPosition + variable.length
                }
            } as VariableNode],
            loc: {
                start: startPosition,
                end: startPosition + expression.length,
            }
        };
    }
    throw new TSError('Expected } for end of expression, found EOL', {
        statusCode: 400,
        context: { safe: true }
    });
}

function isEscaped(input: string, pos: number): boolean {
    if (pos === 0) return false;
    let i = pos;
    let lastCharEscaped = false;
    while (i--) {
        const char = input[i];
        if (char === '\\') {
            lastCharEscaped = !lastCharEscaped;
        } else {
            return lastCharEscaped;
        }
    }
    return lastCharEscaped;
}
