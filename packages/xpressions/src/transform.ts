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
        if (char === '$' && nextChar === '{') {
            let expression = '';
            for (let j = (i + 2); j < len; j++) {
                if (input[j] === '}') {
                    i = j;
                    break;
                } else {
                    expression += input[j];
                }
            }
            output += evaluate(expression, options);
        } else {
            output += char;
        }
    }
    return output;
}
