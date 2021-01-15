import {
    Nodes, ExpressionNode, LiteralNode, NodeType, VariableNode
} from './interfaces';

/**
 * Parse and validate an expression string and return the parsed AST
 *
 * @returns a list of errors
*/
export function parse(input: string): Nodes {
    const len = input.length;
    const ast: (LiteralNode|ExpressionNode|VariableNode)[] = [];
    let chunk = '';
    function finishChunk() {
        if (!chunk) return;
        ast.push({
            type: NodeType.LITERAL,
            value: chunk,
        });
        chunk = '';
    }

    for (let i = 0; i < len; i++) {
        const char = input[i];
        const nextChar = input[i + 1];
        if (char === '$' && nextChar === '{' && !isEscaped(input, i)) {
            finishChunk();
            let expression = '';
            let terminated = false;
            for (let j = (i + 2); j < len; j++) {
                if (input[j] === '}' && !isEscaped(input, j)) {
                    i = j;
                    terminated = true;
                    break;
                } else {
                    expression += input[j];
                }
            }
            if (terminated) {
                const variable = expression.trim().replace(/^\$/, '');
                ast.push({
                    type: NodeType.VARIABLE,
                    scoped: variable.startsWith('@'),
                    value: variable,
                });
            } else {
                ast.push({
                    type: NodeType.LITERAL,
                    value: `\${${expression}`,
                });
                break;
            }
        } else {
            chunk += char;
        }
    }
    finishChunk();

    return ast.slice();
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
