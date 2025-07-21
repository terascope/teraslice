import { isArray } from './arrays.js';
import { isNumber } from './numbers.js';

export function isVector(val: unknown): val is number[] {
    if (!isArray(val)) return false;
    return val.every(isNumber);
}
