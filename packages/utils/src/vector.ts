import { isArray } from './arrays.js';
import { isFloat, toNumberOrThrow } from './numbers.js';

export function getVector(input: unknown) {
    if (!isArray(input)) throw new Error('Vector must be an array');

    // its a string input, map and validate
    if (input.length === 1 && typeof input[0] === 'string') {
        return input[0].split(',').map(toNumberOrThrow);
        // this is where variables are put
    } else if (!input.every(isFloat)) {
        throw new Error('Vector must be an array of floats');
    }

    return input;
}
