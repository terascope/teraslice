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
        const prevChar = input[i - 1];
        const char = input[i];
        const nextChar = input[i + 1];
        if (prevChar !== '\\' && char === '$' && nextChar === '{') {
            let expression = '';
            let terminated = false;
            for (let j = (i + 2); j < len; j++) {
                if (input[j - 1] !== '\\' && input[j] === '}') {
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
