import { trim, padEnd } from '@terascope/core-utils';
import { customAlphabet } from 'nanoid';

export function newId(prefix?: string, lowerCase = false, length = 15): string {
    let characters = '-0123456789abcdefghijklmnopqrstuvwxyz';

    if (!lowerCase) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    let id = trim(customAlphabet(characters, length)(), '-');
    id = padEnd(id, length, 'abcdefghijklmnopqrstuvwxyz');

    if (prefix) {
        return `${prefix}-${id}`;
    }

    return id;
}
