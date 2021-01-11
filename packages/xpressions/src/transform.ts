import { evaluate } from './evaluate';
import { Options } from './interfaces';

/**
 * Evaluate all of the templated variables in a xpression string
 *
 * @returns the input with the translated values
*/
export function transform(input: string, options: Options): string {
    const len = input.length;
    let output = '';

    for (let i = 0; i < len; i++) {
        const char = input[i];
        const nextChar = input[i + 1];
        if (char === '$' && nextChar === '{' && !isEscaped(input, i)) {
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
                output += evaluate(expression, options);
            } else {
                output += '${';
                output += expression;
                break;
            }
        } else {
            output += char;
        }
    }

    return output;
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
